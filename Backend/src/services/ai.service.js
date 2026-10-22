import "dotenv/config";

import { z } from "zod";
import OpenAI from "openai";
import http from "http";

// ✅ SenseNova connection (OpenAI compatible), configurable through the environment
const SENSENOVA_BASE_URL = (
  process.env.SENSENOVA_BASE_URL || "https://token.sensenova.ai/v1"
).trim();
const SENSENOVA_API_KEY = (process.env.SENSENOVA_API_KEY || "").trim();
const SENSENOVA_MODEL = (
  process.env.SENSENOVA_MODEL || "sensenova-6.8-flash-lite"
).trim();

// ✅ Local Ollama, used when no cloud provider is configured
const OLLAMA_URL = (process.env.OLLAMA_URL || "http://127.0.0.1:11434").trim();
const OLLAMA_MODEL = (process.env.OLLAMA_MODEL || "qwen2.5:7b").trim();
const OLLAMA_CHAT_ENDPOINT = new URL("/api/chat", OLLAMA_URL);

// The prompt (resume + job description) plus the generated JSON has to fit
// in the context window. A small window silently truncates the answer and
// produces invalid JSON, so the defaults are generous and overridable.
const OLLAMA_NUM_CTX = Number(process.env.OLLAMA_NUM_CTX) || 8192;
const OLLAMA_NUM_PREDICT = Number(process.env.OLLAMA_NUM_PREDICT) || 4096;

/**
 * The report engine talks to SenseNova when an API key is configured and
 * falls back to the local Ollama model otherwise. The client is created
 * lazily so a missing key can never stop the server from booting.
 */
const useSenseNova = SENSENOVA_API_KEY.length > 0;
let senseNovaClient = null;

// Not every provider understands a JSON schema request. The first rejection
// switches the engine to plain JSON for the rest of the process.
let providerSupportsJsonSchema = true;

function getSenseNovaClient() {
  if (!useSenseNova) {
    throw new Error(
      "SenseNova is not configured. Set SENSENOVA_API_KEY or use the local Ollama model.",
    );
  }

  if (!senseNovaClient) {
    senseNovaClient = new OpenAI({
      baseURL: SENSENOVA_BASE_URL,
      apiKey: SENSENOVA_API_KEY,
    });
  }

  return senseNovaClient;
}

// ✅ Direct HTTP — No timeout issues
function ollamaChat(payload) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload);
    const options = {
      hostname: OLLAMA_CHAT_ENDPOINT.hostname,
      port: OLLAMA_CHAT_ENDPOINT.port || 80,
      path: OLLAMA_CHAT_ENDPOINT.pathname,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
      timeout: 0,
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Failed to parse Ollama response: " + data));
        }
      });
    });

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

/**
 * One chat call to the configured provider. Both AI passes use it, so the
 * provider can be switched without touching the prompts.
 */
async function chatCompletion({ system, user, schema }) {
  if (useSenseNova) {
    const messages = [];

    if (system) messages.push({ role: "system", content: system });
    messages.push({ role: "user", content: user });

    const request = {
      model: SENSENOVA_MODEL,
      messages,
      temperature: 0.1,
    };

    let response;

    if (providerSupportsJsonSchema) {
      try {
        // Ask for the exact JSON shape when the provider supports it.
        response = await getSenseNovaClient().chat.completions.create({
          ...request,
          response_format: {
            type: "json_schema",
            json_schema: { name: "interview_report", schema, strict: false },
          },
        });
      } catch (error) {
        // The provider does not know the schema: ask for plain JSON from now on.
        providerSupportsJsonSchema = false;

        console.warn(
          "[AI] The provider rejected the JSON schema, asking for plain JSON instead:",
          error?.message,
        );

        response = await getSenseNovaClient().chat.completions.create(request);
      }
    } else {
      response = await getSenseNovaClient().chat.completions.create(request);
    }

    const content = response.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("Empty response from SenseNova");
    }

    return content;
  }

  const response = await ollamaChat({
    model: OLLAMA_MODEL,
    messages: [{ role: "user", content: user }],
    format: schema,
    stream: false,
    options: {
      temperature: 0.1,
      num_ctx: OLLAMA_NUM_CTX,
      num_predict: OLLAMA_NUM_PREDICT,
    },
  });

  if (response.error) throw new Error(`Ollama error: ${response.error}`);

  const content = response.message?.content;

  if (!content) throw new Error("Empty response from Ollama");

  return content;
}

// ===== JSON PARSING =====

/**
 * Closes a JSON document that was cut off (for example when the model hit
 * the token limit). Complete members are kept, the incomplete trailing
 * member is dropped and the open brackets are closed.
 *
 * Returns null when nothing usable can be rebuilt.
 */
export function repairTruncatedJson(input) {
  const stack = [];
  let result = null;
  let index = 0;

  const isWhitespace = (character) =>
    character === " " ||
    character === "\n" ||
    character === "\r" ||
    character === "\t";

  function readString(start) {
    let cursor = start + 1;
    let escaped = false;

    while (cursor < input.length) {
      const character = input[cursor];

      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        return cursor;
      }

      cursor += 1;
    }

    return -1;
  }

  function addValue(value) {
    if (stack.length === 0) {
      result = value;
      return;
    }

    const frame = stack[stack.length - 1];

    if (frame.char === "{") {
      // A value without its key is incomplete and is dropped.
      if (frame.pendingKey === null) return;

      frame.parts.push(`${JSON.stringify(frame.pendingKey)}:${value}`);
      frame.pendingKey = null;
      return;
    }

    frame.parts.push(value);
  }

  while (index < input.length) {
    const character = input[index];

    if (isWhitespace(character)) {
      index += 1;
      continue;
    }

    if (character === '"') {
      const end = readString(index);

      // Unterminated string: the document was cut off here.
      if (end === -1) break;

      const raw = input.slice(index, end + 1);
      index = end + 1;

      const frame = stack[stack.length - 1];

      if (frame && frame.char === "{" && frame.pendingKey === null) {
        frame.pendingKey = JSON.parse(raw);
        continue;
      }

      addValue(raw);
      continue;
    }

    if (character === "{" || character === "[") {
      stack.push({ char: character, parts: [], pendingKey: null });
      index += 1;
      continue;
    }

    if (character === "}" || character === "]") {
      const frame = stack.pop();

      if (!frame) {
        index += 1;
        continue;
      }

      const body = frame.parts.join(",");
      const value =
        frame.char === "{" ? `{${body}}` : `[${body}]`;

      addValue(value);
      index += 1;
      continue;
    }

    if (character === ":") {
      // The key is already stored on the frame: the value comes next.
      index += 1;
      continue;
    }

    let end = index;
    while (
      end < input.length &&
      !",}]: \n\r\t".includes(input[end])
    ) {
      end += 1;
    }

    const raw = input.slice(index, end).trim();

    if (!raw) {
      // A separator without a value: move past it so the loop always ends.
      index = end + 1;
      continue;
    }

    index = end;

    addValue(raw);

    while (index < input.length && (input[index] === "," || isWhitespace(input[index]))) {
      index += 1;
    }
  }

  // Close the containers that are still open.
  while (stack.length) {
    const frame = stack.pop();
    const body = frame.parts.join(",");
    const value = frame.char === "{" ? `{${body}}` : `[${body}]`;

    addValue(value);
  }

  // Only a JSON object or array is useful here: the model is always asked
  // for an object, so a bare word is not a recoverable answer.
  if (typeof result !== "string") {
    return null;
  }

  const trimmed = result.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  return trimmed;
}

/**
 * Parses the model answer. A truncated answer (the model hit the token
 * limit) is repaired before giving up, so a long report is not lost to a
 * single missing bracket.
 */
function parseModelJson(content) {
  try {
    return JSON.parse(content);
  } catch {
    // fall through to the recovery paths
  }

  const match = content.match(/\{[\s\S]*\}/);

  if (match) {
    try {
      return JSON.parse(match[0]);
    } catch {
      // fall through to the repair path
    }
  }

  const repaired = repairTruncatedJson(content);

  if (repaired) {
    try {
      const parsed = JSON.parse(repaired);
      console.warn(
        "[AI] The model answer was truncated and has been repaired.",
      );
      return parsed;
    } catch {
      // fall through to the error below
    }
  }

  throw new Error("The AI model did not return valid JSON.");
}

// ===== MODEL OUTPUT CLEANING =====

// Fallbacks for the few enum fields the model sometimes gets wrong.
const ENUM_FALLBACKS = {
  hiringRecommendation: "Consider with Reservations",
  severity: "medium",
  importance: "preferred",
  alignment: "partial",
  difficulty: "medium",
};

function hasText(value) {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Cleans the model answer against the JSON schema that was requested:
 *
 * - an array entry without its required fields is dropped (a half written
 *   entry cannot be shown in the report),
 * - a missing optional string becomes an empty string,
 * - an unknown enum value falls back to a safe default.
 *
 * The Zod validation that runs afterwards still decides whether the report
 * is complete enough to be stored.
 */
export function sanitizeModelOutput(value, schema) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return value;
  }

  const result = { ...value };
  const properties = schema?.properties || {};

  for (const [key, definition] of Object.entries(properties)) {
    const current = result[key];

    if (definition.type === "array" && Array.isArray(current)) {
      const itemSchema = definition.items || {};
      const required = Array.isArray(itemSchema.required)
        ? itemSchema.required
        : [];

      if (itemSchema.type === "string") {
        result[key] = current.filter(hasText);
        continue;
      }

      const cleaned = [];

      for (const item of current) {
        if (!item || typeof item !== "object") continue;

        const complete = required.every((field) => {
          const fieldValue = item[field];
          const fieldDefinition = itemSchema.properties?.[field];

          if (fieldDefinition?.type === "string") {
            return hasText(fieldValue);
          }

          return fieldValue !== undefined && fieldValue !== null;
        });

        if (!complete) continue;

        const copy = { ...item };

        for (const [field, fieldDefinition] of Object.entries(
          itemSchema.properties || {},
        )) {
          if (fieldDefinition?.type === "string") {
            if (!hasText(copy[field])) copy[field] = "";

            if (
              Array.isArray(fieldDefinition.enum) &&
              !fieldDefinition.enum.includes(copy[field])
            ) {
              const fallback = ENUM_FALLBACKS[field];

              if (fallback) copy[field] = fallback;
            }
          } else if (copy[field] === undefined || copy[field] === null) {
            copy[field] = fieldDefinition?.default ?? "";
          }
        }

        cleaned.push(copy);
      }

      result[key] = cleaned;
      continue;
    }

    if (definition.type === "string" && !hasText(current)) {
      result[key] = "";
      continue;
    }

    if (Array.isArray(definition.enum) && !definition.enum.includes(current)) {
      const fallback = ENUM_FALLBACKS[key];

      if (fallback) {
        result[key] = fallback;
      }
    }
  }

  return result;
}

// ===== PLAIN JSON SCHEMAS — Model ke liye (No preprocess confusion) =====

const plainAssessmentSchema = {
  type: "object",
  required: [
    "candidateName",
    "targetRole",
    "matchScore",
    "executiveSummary",
    "hiringRecommendation",
    "keyStrengths",
    "areasForGrowth",
    "skillsAnalysis",
    "interviewerFocusAreas",
  ],
  properties: {
    candidateName: { type: "string" },
    targetRole: { type: "string" },
    matchScore: { type: "number", minimum: 0, maximum: 100 },
    executiveSummary: { type: "string" },
    hiringRecommendation: {
      type: "string",
      enum: [
        "Strong Hire",
        "Proceed to Technical Interview",
        "Proceed to Technical Screening",
        "Consider with Reservations",
        "Hold",
        "Not Recommended",
      ],
    },
    keyStrengths: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
    areasForGrowth: {
      type: "array",
      minItems: 2,
      items: {
        type: "object",
        required: ["skill", "severity", "explanation", "recommendation"],
        properties: {
          skill: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          explanation: { type: "string" },
          recommendation: { type: "string" },
        },
      },
    },
    skillsAnalysis: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "skill",
          "importance",
          "alignment",
          "evidence",
          "assessment",
        ],
        properties: {
          skill: { type: "string" },
          importance: { type: "string", enum: ["required", "preferred"] },
          alignment: {
            type: "string",
            enum: ["strong", "partial", "weak", "not_demonstrated"],
          },
          evidence: { type: "string" },
          assessment: { type: "string" },
        },
      },
    },
    interviewerFocusAreas: {
      type: "array",
      items: { type: "string" },
      minItems: 3,
    },
  },
};

const plainQuestionsSchema = {
  type: "object",
  required: [
    "technicalQuestions",
    "systemDesignQuestions",
    "behavioralQuestions",
    "preparationPlan",
  ],
  properties: {
    technicalQuestions: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: [
          "question",
          "intention",
          "answer",
          "difficulty",
          "relatedSkill",
        ],
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          relatedSkill: { type: "string" },
        },
      },
    },
    systemDesignQuestions: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: [
          "question",
          "intention",
          "answer",
          "difficulty",
          "relatedSkill",
        ],
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          relatedSkill: { type: "string" },
        },
      },
    },
    behavioralQuestions: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: [
          "question",
          "intention",
          "answer",
          "difficulty",
          "relatedSkill",
        ],
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          relatedSkill: { type: "string" },
        },
      },
    },
    preparationPlan: {
      type: "array",
      minItems: 4,
      items: {
        type: "object",
        required: ["day", "focus", "tasks", "expectedOutcome"],
        properties: {
          day: { type: "number" },
          focus: { type: "string" },
          tasks: {
            type: "array",
            items: { type: "string" },
            minItems: 2,
          },
          expectedOutcome: { type: "string" },
        },
      },
    },
  },
};

// ===== ZOD SCHEMAS — Sirf final validation ke liye =====

const makeQuestionSchema = () =>
  z.object({
    question: z.string(),
    intention: z.string(),
    answer: z.string(),
    difficulty: z.preprocess(
      (val) => String(val).toLowerCase().trim(),
      z.enum(["easy", "medium", "hard"]),
    ),
    relatedSkill: z.string(),
  });

const assessmentZodSchema = z.object({
  candidateName: z.string(),
  targetRole: z.string(),
  matchScore: z.number().min(0).max(100),
  executiveSummary: z.string(),
  hiringRecommendation: z.preprocess(
    (val) => {
      const map = {
        "strong hire": "Strong Hire",
        "proceed to technical interview": "Proceed to Technical Interview",
        "proceed to technical screening": "Proceed to Technical Screening",
        "consider with reservations": "Consider with Reservations",
        hold: "Hold",
        "not recommended": "Not Recommended",
      };
      return map[String(val).toLowerCase().trim()] ?? val;
    },
    z.enum([
      "Strong Hire",
      "Proceed to Technical Interview",
      "Proceed to Technical Screening",
      "Consider with Reservations",
      "Hold",
      "Not Recommended",
    ]),
  ),
  keyStrengths: z.array(z.string()).min(3),
  areasForGrowth: z
    .array(
      z.object({
        skill: z.string(),
        severity: z.preprocess(
          (val) => String(val).toLowerCase().trim(),
          z.enum(["low", "medium", "high"]),
        ),
        explanation: z.string(),
        recommendation: z.string(),
      }),
    )
    .min(2),
  skillsAnalysis: z
    .array(
      z.object({
        skill: z.string(),
        importance: z.preprocess(
          (val) => String(val).toLowerCase().trim(),
          z.enum(["required", "preferred"]),
        ),
        alignment: z.preprocess(
          (val) => String(val).toLowerCase().trim().replace(/\s+/g, "_"),
          z.enum(["strong", "partial", "weak", "not_demonstrated"]),
        ),
        evidence: z.string(),
        assessment: z.string(),
      }),
    )
    .min(4),
  interviewerFocusAreas: z.array(z.string()).min(3),
});

const questionsZodSchema = z.object({
  technicalQuestions: z.array(makeQuestionSchema()).min(4),
  systemDesignQuestions: z.array(makeQuestionSchema()).min(3),
  behavioralQuestions: z.array(makeQuestionSchema()).min(3),
  preparationPlan: z
    .array(
      z.object({
        day: z.preprocess((val) => Number(val), z.number().int().min(1)),
        focus: z.string(),
        tasks: z.array(z.string()).min(2),
        expectedOutcome: z.string(),
      }),
    )
    .min(4),
});

const fullReportZodSchema = assessmentZodSchema.merge(questionsZodSchema);

// ===== PART 1 — Assessment =====

async function generateAssessment({ resume, selfDescription, jobDescription }) {
  console.log("[AI] Part 1 — Generating assessment...");
  console.time("[AI] Part 1 time");

  const systemPrompt = "You are an expert technical interviewer.";

  const userPrompt = `Analyze this candidate and generate an assessment.

RESUME:
${resume}

SELF-DESCRIPTION:
${selfDescription}

JOB DESCRIPTION:
${jobDescription}

IMPORTANT — Return JSON with EXACTLY these fields and formats:

candidateName: string (extract from resume)
targetRole: string (extract from job description title)
matchScore: number between 0 and 100
executiveSummary: string, 3-4 sentences about candidate fit, strengths, and gaps
hiringRecommendation: MUST be exactly one of:
"Strong Hire" | "Proceed to Technical Interview" | "Proceed to Technical Screening" | "Consider with Reservations" | "Hold" | "Not Recommended"

keyStrengths: array of 4 strings like:
["Strong React.js skills from internship and projects", "JWT auth implementation experience", "MongoDB and NoSQL database knowledge", "Full-stack MERN project experience"]

areasForGrowth: array of 3 OBJECTS — each MUST have all 4 fields:
[
  {
    "skill": "PostgreSQL",
    "severity": "medium",
    "explanation": "Limited SQL experience shown in resume",
    "recommendation": "Build a full CRUD project using PostgreSQL and Sequelize"
  }
]
severity MUST be exactly: "low" OR "medium" OR "high"

skillsAnalysis: array of 5 OBJECTS — each MUST have all 5 fields:
[
  {
    "skill": "React.js",
    "importance": "required",
    "alignment": "strong",
    "evidence": "Built 3 React.js projects including full-stack todo app",
    "assessment": "Fully meets the React.js requirement with practical project evidence"
  }
]
importance MUST be exactly: "required" OR "preferred"
alignment MUST be exactly: "strong" OR "partial" OR "weak" OR "not_demonstrated"

interviewerFocusAreas: array of 4 strings describing what to probe in interview`;

  const jsonString = await chatCompletion({
    system: systemPrompt,
    user: userPrompt,
    schema: plainAssessmentSchema,
  });

  console.timeEnd("[AI] Part 1 time");

  const parsed = sanitizeModelOutput(
    parseModelJson(jsonString),
    plainAssessmentSchema,
  );

  console.log("[AI] Part 1 parsed keys:", Object.keys(parsed));

  return assessmentZodSchema.parse(parsed);
}

// ===== PART 2 — Questions + Plan =====

async function generateQuestions({
  resume,
  jobDescription,
  targetRole,
  skillGaps,
}) {
  console.log("[AI] Part 2 — Generating questions and plan...");
  console.time("[AI] Part 2 time");

  const systemPrompt = "You are an expert technical interviewer.";

  const userPrompt = `Generate interview questions and a preparation plan.

CANDIDATE ROLE: ${targetRole}
SKILL GAPS TO ADDRESS: ${skillGaps.join(", ")}

RESUME:
${resume}

JOB DESCRIPTION:
${jobDescription}

Return JSON with EXACTLY these fields. Every item MUST be an OBJECT with ALL required fields.

technicalQuestions: array of 5 OBJECTS — include easy, medium, AND hard:
[
  {
    "question": "What is the difference between var, let, and const in JavaScript?",
    "intention": "Test fundamental JavaScript knowledge",
    "answer": "var is function-scoped and hoisted, let and const are block-scoped. const cannot be reassigned after declaration but its object properties can be mutated. let can be reassigned. Modern JavaScript prefers const by default and let when reassignment is needed.",
    "difficulty": "easy",
    "relatedSkill": "JavaScript"
  }
]
difficulty MUST be exactly: "easy" OR "medium" OR "hard"

systemDesignQuestions: array of 3 OBJECTS, difficulty "medium" or "hard" only

behavioralQuestions: array of 3 OBJECTS, difficulty "easy" or "medium" only
For behavioral questions use "Teamwork" or "Problem Solving" or "Communication" as relatedSkill

preparationPlan: array of 5 OBJECTS:
[
  {
    "day": 1,
    "focus": "JavaScript async programming",
    "tasks": ["Review promises and async/await", "Practice error handling with try/catch", "Build a small async exercise"],
    "expectedOutcome": "Confident explaining async patterns in JavaScript interviews"
  }
]
day MUST be a number (1, 2, 3, 4, 5)
tasks MUST have at least 3 items per day`;

  const jsonString = await chatCompletion({
    system: systemPrompt,
    user: userPrompt,
    schema: plainQuestionsSchema,
  });

  console.timeEnd("[AI] Part 2 time");

  console.log("[AI] Part 2 preview:", jsonString.slice(0, 200));

  const parsed = sanitizeModelOutput(
    parseModelJson(jsonString),
    plainQuestionsSchema,
  );

  console.log("[AI] Part 2 parsed keys:", Object.keys(parsed));

  return questionsZodSchema.parse(parsed);
}

// ===== MAIN FUNCTION =====

async function generateInterviewReport({
  resume,
  selfDescription,
  jobDescription,
}) {
  if (!resume || !selfDescription || !jobDescription) {
    throw new Error(
      "Resume, self-description, and job description are required.",
    );
  }

  const resumeText =
    typeof resume === "string" ? resume : JSON.stringify(resume);

  try {
    // ✅ Call 1 — Assessment
    const assessment = await generateAssessment({
      resume: resumeText,
      selfDescription,
      jobDescription,
    });
    console.log("[AI] Part 1 done ✅ —", assessment.candidateName);

    // ✅ Pass skill gaps to Part 2 for targeted questions
    const skillGaps = assessment.areasForGrowth.map((a) => a.skill);

    // ✅ Call 2 — Questions + Plan
    const questions = await generateQuestions({
      resume: resumeText,
      jobDescription,
      targetRole: assessment.targetRole,
      skillGaps,
    });
    console.log("[AI] Part 2 done ✅");

    // ✅ Combine both parts
    const fullReport = { ...assessment, ...questions };

    // ✅ Final Zod validation
    const validated = fullReportZodSchema.parse(fullReport);
    console.log("[AI] Full report validated ✅");

    return validated;
  } catch (error) {
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);
    throw error;
  }
}

export default generateInterviewReport;
