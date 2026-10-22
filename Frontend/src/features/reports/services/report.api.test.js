import test from "node:test";
import assert from "node:assert/strict";

import { buildGenerateFormData } from "./report.api.js";

/**
 * The backend contract for POST /api/interview:
 *   multipart/form-data with "resume" (file), "jobDescription" and
 *   "selfDescription" (text).
 */
test("the generation payload uses the field names the backend expects", () => {
  const resume = new File(["%PDF-1.4"], "Hassnain_Shabbir_Resume.pdf", {
    type: "application/pdf",
  });

  const formData = buildGenerateFormData({
    resume,
    jobDescription: "Senior Frontend Engineer",
    selfDescription: "I build React applications.",
  });

  const fields = [...formData.entries()].map(([name]) => name);

  assert.deepEqual(fields, ["resume", "jobDescription", "selfDescription"]);

  const file = formData.get("resume");

  assert.equal(file.name, "Hassnain_Shabbir_Resume.pdf");
  assert.equal(formData.get("jobDescription"), "Senior Frontend Engineer");
  assert.equal(
    formData.get("selfDescription"),
    "I build React applications.",
  );
});
