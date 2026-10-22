import test from "node:test";
import assert from "node:assert/strict";

import { validateResumeFile, formatFileSize } from "./resume.js";

const MAX_BYTES = 10 * 1024 * 1024;

function fakeFile({ name, type, size }) {
  return { name, type, size };
}

test("a missing resume is rejected", () => {
  assert.match(validateResumeFile(null), /resume/i);
});

test("a non PDF file is rejected", () => {
  const error = validateResumeFile(
    fakeFile({ name: "resume.docx", type: "application/msword", size: 1024 }),
  );

  assert.match(error, /PDF/i);
});

test("a PDF over the size limit is rejected", () => {
  const error = validateResumeFile(
    fakeFile({
      name: "resume.pdf",
      type: "application/pdf",
      size: MAX_BYTES + 1,
    }),
  );

  assert.match(error, /10 MB/i);
});

test("a PDF within the limits is accepted", () => {
  const error = validateResumeFile(
    fakeFile({
      name: "resume.pdf",
      type: "application/pdf",
      size: 512 * 1024,
    }),
  );

  assert.equal(error, null);
});

test("a PDF is accepted when the browser does not report a PDF mime type", () => {
  const error = validateResumeFile(
    fakeFile({ name: "RESUME.PDF", type: "", size: 1024 }),
  );

  assert.equal(error, null);
});

test("file sizes are formatted for humans", () => {
  assert.equal(formatFileSize(512), "512 B");
  assert.equal(formatFileSize(2048), "2 KB");
  assert.equal(formatFileSize(5 * 1024 * 1024), "5.0 MB");
});
