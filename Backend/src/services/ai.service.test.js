import test from "node:test";
import assert from "node:assert/strict";

import { repairTruncatedJson, sanitizeModelOutput } from "./ai.service.js";

const assessmentSchema = {
  type: "object",
  properties: {
    candidateName: { type: "string" },
    hiringRecommendation: {
      type: "string",
      enum: ["Strong Hire", "Consider with Reservations", "Hold"],
    },
    keyStrengths: { type: "array", items: { type: "string" } },
    areasForGrowth: {
      type: "array",
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
  },
};

/**
 * The model answer is cleaned against the requested JSON schema before it
 * is validated: half written entries are dropped instead of failing the
 * whole report.
 */
test("an array entry without its required fields is dropped", () => {
  const cleaned = sanitizeModelOutput(
    {
      candidateName: "Hassnain Shabbir",
      areasForGrowth: [
        {
          skill: "TypeScript",
          severity: "high",
          explanation: "Limited TypeScript experience",
          recommendation: "Build a TypeScript project",
        },
        { skill: "Next.js", severity: "medium" },
      ],
    },
    assessmentSchema,
  );

  assert.equal(cleaned.areasForGrowth.length, 1);
  assert.equal(cleaned.areasForGrowth[0].skill, "TypeScript");
});

test("a missing optional string field becomes an empty string", () => {
  const cleaned = sanitizeModelOutput(
    {
      areasForGrowth: [
        { skill: "Next.js", severity: "medium", recommendation: "Read the docs" },
      ],
    },
    {
      type: "object",
      properties: {
        areasForGrowth: {
          type: "array",
          items: {
            type: "object",
            required: ["skill", "severity"],
            properties: {
              skill: { type: "string" },
              severity: { type: "string", enum: ["low", "medium", "high"] },
              explanation: { type: "string" },
              recommendation: { type: "string" },
            },
          },
        },
      },
    },
  );

  assert.equal(cleaned.areasForGrowth.length, 1);
  assert.equal(cleaned.areasForGrowth[0].explanation, "");
});

test("an unknown enum value falls back to a safe default", () => {
  const cleaned = sanitizeModelOutput(
    { hiringRecommendation: "Maybe later" },
    assessmentSchema,
  );

  assert.equal(cleaned.hiringRecommendation, "Consider with Reservations");
});

test("an unknown severity inside an item falls back as well", () => {
  const cleaned = sanitizeModelOutput(
    {
      areasForGrowth: [
        {
          skill: "GraphQL",
          severity: "critical",
          explanation: "No GraphQL in the resume",
          recommendation: "Build one project",
        },
      ],
    },
    assessmentSchema,
  );

  assert.equal(cleaned.areasForGrowth[0].severity, "medium");
});

test("an array of strings only keeps the filled ones", () => {
  const cleaned = sanitizeModelOutput(
    { keyStrengths: ["React", "", "MongoDB"] },
    assessmentSchema,
  );

  assert.deepEqual(cleaned.keyStrengths, ["React", "MongoDB"]);
});

test("the repaired JSON keeps every complete member", () => {
  const truncated =
    '{"keyStrengths":["one","two"],"areasForGrowth":[{"skill":"React","severity":"high","explanation":"good","recommendation":"ship"';

  const repaired = repairTruncatedJson(truncated);

  assert.deepEqual(JSON.parse(repaired), {
    keyStrengths: ["one", "two"],
    areasForGrowth: [
      {
        skill: "React",
        severity: "high",
        explanation: "good",
        recommendation: "ship",
      },
    ],
  });
});
