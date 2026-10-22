import multer from "multer";

const MAX_RESUME_BYTES = 10 * 1024 * 1024; // 10 MB, matches the client limit.

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
        message: "The resume must be smaller than 10 MB.",
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
