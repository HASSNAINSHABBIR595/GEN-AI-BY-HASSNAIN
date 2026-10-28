const MAX_BYTES = 10 * 1024 * 1024;

export const RESUME_MAX_BYTES = MAX_BYTES;

/** Returns an error message, or null when the file is usable. */
export function validateResumeFile(file) {
  if (!file) return "Add your resume before generating a report.";

  const isPdf =
    file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (!isPdf) return "The resume must be a PDF file.";
  if (file.size > MAX_BYTES) return "The resume must be smaller than 10 MB.";

  return null;
}

export function formatFileSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
