import test from "node:test";
import assert from "node:assert/strict";

import { repairTruncatedJson } from "./ai.service.js";

/**
 * The model answer can be cut off when it reaches the token limit. The
 * service repairs the truncated JSON instead of losing the whole report.
 */
test("a truncated array of objects is closed and kept", () => {
  const truncated =
    '{"technicalQuestions":[{"question":"Q1","answer":"A1"},{"question":"Q2","answer":"A2"';

  const repaired = repairTruncatedJson(truncated);

  assert.deepEqual(JSON.parse(repaired), {
    technicalQuestions: [
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ],
  });
});

test("an incomplete trailing member is dropped", () => {
  const truncated =
    '{"keyStrengths":["one","two"],"areasForGrowth":[{"skill":"React","explanation":"good"';

  const repaired = repairTruncatedJson(truncated);

  assert.deepEqual(JSON.parse(repaired), {
    keyStrengths: ["one", "two"],
    areasForGrowth: [{ skill: "React", explanation: "good" }],
  });
});

test("an unterminated string is dropped with its member", () => {
  const truncated = '{"executiveSummary":"a candidate who';

  const repaired = repairTruncatedJson(truncated);

  assert.deepEqual(JSON.parse(repaired), {});
});

test("already valid JSON is rebuilt unchanged", () => {
  const valid = '{"matchScore":72,"keyStrengths":["a","b"]}';

  assert.deepEqual(JSON.parse(repairTruncatedJson(valid)), {
    matchScore: 72,
    keyStrengths: ["a", "b"],
  });
});

test("text that holds no JSON returns null", () => {
  assert.equal(repairTruncatedJson("not json at all"), null);
});
