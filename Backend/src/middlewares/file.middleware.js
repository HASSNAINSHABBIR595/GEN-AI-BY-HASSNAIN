import multer from "multer";

// The limit can be lowered for a host that caps the request body (a
// serverless platform accepts about 4.5 MB). The client is told about it
// through the error message.
const MAX_RESUME_MB = Number(process.env.MAX_RESUME_MB) || 10;
const MAX_RESUME_BYTES = MAX_RESUME_MB * 1024 * 1024;

export const resumeSizeLimitMb = MAX_RESUME_MB;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_RESUME_BYTES,
    files: 1,
  },
  fileFilter(_req, file, callback) {
    const isPdf =
      file.mimetype === "application/pdf" || /\.pdf$/i.test(file.originalname);

    if (!isPdf) {
      const error = new Error("The resume must be a PDF file.");
      error.code = "INVALID_FILE_TYPE";
      return callback(error);
    }

    return callback(null, true);
  },
});

/**
 * Run the single-file upload and answer multer failures with the API's JSON
 * error shape, so the browser never receives an HTML error page.
 */
export function uploadResume(req, res, next) {
  upload.single("resume")(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      res.status(413).json({
        message: `The resume must be smaller than ${MAX_RESUME_MB} MB.`,
      });
      return;
    }

    if (error.code === "LIMIT_UNEXPECTED_FILE") {
      res.status(400).json({
        message: 'Upload the resume as a single PDF using the "resume" field.',
      });
      return;
    }

    res.status(400).json({
      message: error.message || "The resume upload could not be processed.",
    });
  });
}

export default upload;
