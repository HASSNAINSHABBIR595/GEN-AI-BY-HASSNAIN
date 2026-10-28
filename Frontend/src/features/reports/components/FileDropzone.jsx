import { useRef, useState } from "react";
import { FileText, Upload, X } from "lucide-react";

import { formatFileSize } from "../utils/resume.js";

/**
 * Resume dropzone. Keyboard reachable through the "Choose PDF" button,
 * drag and drop supported, and announces the selected file.
 */
function FileDropzone({
  file,
  onFile,
  onClear,
  invalid = false,
  describedBy,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);

    if (disabled) return;

    const dropped = event.dataTransfer.files?.[0];
    if (dropped) onFile(dropped);
  }

  function handleChange(event) {
    const selected = event.target.files?.[0];
    if (selected) onFile(selected);
    event.target.value = "";
  }

  return (
    <div
      className="dropzone"
      data-dragging={dragging ? "true" : "false"}
      data-filled={file ? "true" : "false"}
      data-disabled={disabled ? "true" : "false"}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        id="resume"
        type="file"
        accept=".pdf,application/pdf"
        className="sr-file-input"
        onChange={handleChange}
        disabled={disabled}
        aria-invalid={invalid ? "true" : "false"}
        aria-describedby={describedBy}
      />

      <span
        className="grid h-12 w-12 shrink-0 place-items-center bg-surface text-ink"
        aria-hidden="true"
      >
        {file ? <FileText size={20} /> : <Upload size={20} />}
      </span>

      <div className="min-w-0 flex-1">
        {file ? (
          <>
            <p className="truncate text-[15px] font-medium">{file.name}</p>
            <p className="mt-1 text-[13px] text-secondary">
              {formatFileSize(file.size)} · PDF
            </p>
          </>
        ) : (
          <>
            <p className="text-[15px] font-medium">Drop your resume here</p>
            <p className="mt-1 text-[13px] text-secondary">
              PDF only, up to 10 MB. We read every page.
            </p>
          </>
        )}
      </div>

      {file ? (
        <button
          type="button"
          onClick={() => onClear()}
          disabled={disabled}
          className="btn btn-ghost btn-sm shrink-0"
        >
          <X size={16} aria-hidden="true" />
          Remove
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="btn btn-secondary btn-sm shrink-0"
        >
          Choose PDF
        </button>
      )}
    </div>
  );
}

export default FileDropzone;
