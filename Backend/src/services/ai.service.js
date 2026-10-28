import { z } from "zod";
import https from "https";

// ✅ SenseNova configuration — used when SENSENOVA_API_KEY is set
const SENSENOVA_BASE_URL = (
  process.env.SENSENOVA_BASE_URL || "https://token.sensenova.ai/v1"
).trim();
const SENSENOVA_MODEL = (
  process.env.SENSENOVA_MODEL || "sensenova-6.8-flash-lite"
).trim();

// ✅ Check if SenseNova API key is configured
const HAS_SENSENOVA_KEY = Boolean(process.env.SENSENOVA_API_KEY);

// ✅ SenseNova API call - cloud only
function senseNovaChat(payload, onResult) {
  const body = JSON.stringify(payload);
  const parsedUrl = new URL(SENSENOVA_BASE_URL);

  const options = {
    hostname: parsedUrl.hostname,
    port: 443,
    path: parsedUrl.pathname + "/chat/completions",
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SENSENOVA_API_KEY || ""}`,
      "Content-Length": Buffer.byteLength(body),
    },
  };

  const req = https.request(options, (res) => {
    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });
    res.on("end", () => {
      // Check for non-200 status codes
      if (res.statusCode !== 200) {
        // Try to extract error message from HTML response
        const htmlError = data.match(/<h[1-6][^>]*>([^<]+)<\/h[1-6]>/);
        const errorMsg = htmlError
          ? htmlError[1]
          : `SenseNova API error: status ${res.statusCode}`;
        if (onResult) onResult(new Error(errorMsg));
        else throw new Error(errorMsg);
        return;
      }

      try {
        const parsed = JSON.parse(data);
        if (onResult) onResult(null, parsed);
      } catch (e) {
        if (onResult) onResult(e);
        else throw e;
      }
    });
  });

  req.on("error", (e) => {
    if (onResult) onResult(e);
  });

  req.write(body);
  req.end();
}

// ✅ Export for JSON repair utility
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
      const value = frame.char === "{" ? `{${body}}` : `[${body}]`;

      addValue(value);
      index += 1;
      continue;
    }

    if (character === ":") {
      index += 1;
      continue;
    }

    let end = index;
    while (end < input.length && !",}]: \n\r\t".includes(input[end])) {
      end += 1;
    }

    const raw = input.slice(index, end).trim();

    if (!raw) {
      index = end + 1;
      continue;
    }

    index = end;

    addValue(raw);

    while (
      index < input.length &&
      (input[index] === "," || isWhitespace(input[index]))
    ) {
      index += 1;
    }
  }

  while (stack.length) {
    const frame = stack.pop();
    const body = frame.parts.join(",");
    const value = frame.char === "{" ? `{${body}}` : `[${body}]`;

    addValue(value);
  }

  if (typeof result !== "string") {
    return null;
  }

  const trimmed = result.trim();

  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return null;
  }

  return trimmed;
}

// ===== ZOD SCHEMAS =====

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

// ===== HELPER FUNCTION =====

const parseModelJson = (content) => {
  try {
    return JSON.parse(content);
  } catch {
    const match = content.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        throw new Error("The AI model did not return valid JSON.");
      }
    }
    throw new Error("The AI model did not return valid JSON.");
  }
};

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

  console.log("[AI] Generating interview report...");

  try {
    // ✅ Call SenseNova cloud API only - no Ollama fallback
    if (!HAS_SENSENOVA_KEY) {
      throw new Error(
        "SENSENOVA_API_KEY is not configured. Please set SENSENOVA_API_KEY in .env to enable AI report generation.",
      );
    }

    console.log("[AI] Using SenseNova cloud API for Part 1 and Part 2...");

    // ✅ Part 1 — Assessment prompt
    const assessmentPrompt =
      "You are an expert technical interviewer. Analyze this candidate and generate an assessment." +
      "\n\nRESUME:" +
      resume +
      "\n\nSELF-DESCRIPTION:" +
      selfDescription +
      "\n\nJOB DESCRIPTION:" +
      jobDescription +
      "\n\nIMPORTANT — Return JSON with EXACTLY these fields and formats:" +
      "\ncandidateName: string (extract from resume)" +
      "\ntargetRole: string (extract from job description title)" +
      "\nmatchScore: number between 0 and 100" +
      "\nexecutiveSummary: string, 3-4 sentences about candidate fit, strengths, and gaps" +
      "\nhiringRecommendation: MUST be exactly one of:" +
      ' "Strong Hire" | "Proceed to Technical Interview" | "Proceed to Technical Screening" | "Consider with Reservations" | "Hold" | "Not Recommended"' +
      "\n\nkeyStrengths: array of 4 strings like:" +
      '["Strong React.js skills from internship and projects", "JWT auth implementation experience", "MongoDB and NoSQL database knowledge", "Full-stack MERN project experience"]' +
      "\n\nareasForGrowth: array of 3 OBJECTS — each MUST have all 4 fields:" +
      '[\n  {\n    "skill": "PostgreSQL",\n    "severity": "medium",\n    "explanation": "Limited SQL experience shown in resume",\n    "recommendation": "Build a full CRUD project using PostgreSQL and Sequelize"\n  }' +
      ']\nseverity MUST be exactly: "low" OR "medium" OR "high"\n\nskillsAnalysis: array of 5 OBJECTS — each MUST have all 5 fields:' +
      '[\n  {\n    "skill": "React.js",\n    "importance": "required",\n    "alignment": "strong",\n    "evidence": "Built 3 React.js projects including full-stack todo app",\n    "assessment": "Fully meets the React.js requirement with practical project evidence"\n  }' +
      ']\nimportance MUST be exactly: "required" OR "preferred"\nalignment MUST be exactly: "strong" OR "partial" OR "weak" OR "not_demonstrated"\n\ninterviewerFocusAreas: array of 4 strings describing what to probe in interview';

    // ✅ Call SenseNova API for Part 1
    const part1Response = await new Promise((resolve, reject) => {
      senseNovaChat(
        {
          model: SENSENOVA_MODEL,
          messages: [{ role: "user", content: assessmentPrompt }],
          temperature: 0.1,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        },
      );
    });

    const part1Content = part1Response?.choices?.[0]?.message?.content;
    if (!part1Content) {
      throw new Error("Empty response from SenseNova — Part 1");
    }

    // ✅ PARSE Part 1 BEFORE using assessment data
    const assessment = parseModelJson(part1Content);
    const validatedAssessment = assessmentZodSchema.parse(assessment);

    // ✅ NOW we can use assessment.targetRole and assessment.areasForGrowth safely
    const skillGaps =
      validatedAssessment?.areasForGrowth?.map((a) => a.skill) || [];

    // ✅ Part 2 — Questions prompt (NOW assessment is defined)
    const questionsPrompt =
      "You are an expert technical interviewer. Generate interview questions and a preparation plan." +
      "\n\nCANDIDATE ROLE: " +
      validatedAssessment.targetRole +
      "\nSKILL GAPS TO ADDRESS: " +
      skillGaps.join(", ") +
      "\n\nRESUME:" +
      resume +
      "\n\nJOB DESCRIPTION:" +
      jobDescription +
      "\n\nReturn JSON with EXACTLY these fields. Every item MUST be an OBJECT with ALL required fields." +
      "\ntechnicalQuestions: array of 5 OBJECTS — include easy, medium, AND hard:" +
      '[\n  {\n    "question": "What is the difference between var, let, and const in JavaScript?",\n    "intention": "Test fundamental JavaScript knowledge",\n    "answer": "var is function-scoped and hoisted, let and const are block-scoped. const cannot be reassigned after declaration but its object properties can be mutated. let can be reassigned. Modern JavaScript prefers const by default and let when reassignment is needed.",\n    "difficulty": "easy",\n    "relatedSkill": "JavaScript"\n  }' +
      ']\ndifficulty MUST be exactly: "easy" OR "medium" OR "hard"\n\nsystemDesignQuestions: array of 3 OBJECTS, difficulty "medium" or "hard" only\n\nbehavioralQuestions: array of 3 OBJECTS, difficulty "easy" or "medium" only\nFor behavioral questions use "Teamwork" or "Problem Solving" or "Communication" as relatedSkill\n\npreparationPlan: array of 5 OBJECTS:' +
      '[\n  {\n    "day": 1,\n    "focus": "JavaScript async programming",\n    "tasks": ["Review promises and async/await", "Practice error handling with try/catch", "Build a small async exercise"],\n    "expectedOutcome": "Confident explaining async patterns in JavaScript interviews"\n  }' +
      "]\nday MUST be a number (1, 2, 3, 4, 5)\ntasks MUST have at least 3 items per day";

    // ✅ Call SenseNova API for Part 2
    const part2Response = await new Promise((resolve, reject) => {
      senseNovaChat(
        {
          model: SENSENOVA_MODEL,
          messages: [{ role: "user", content: questionsPrompt }],
          temperature: 0.1,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        },
      );
    });

    const part2Content = part2Response?.choices?.[0]?.message?.content;
    if (!part2Content) {
      throw new Error("Empty response from SenseNova — Part 2");
    }

    // ✅ Parse Part 2
    const questions = parseModelJson(part2Content);
    const validatedQuestions = questionsZodSchema.parse(questions);

    // ✅ Combine both parts
    const fullReport = { ...validatedAssessment, ...validatedQuestions };

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

// ✅ Default export for the report engine
export default generateInterviewReport;
