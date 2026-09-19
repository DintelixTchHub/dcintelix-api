import multer from "multer";
import path from "path";

const allowedExtensions = new Set([".pdf", ".jpg", ".jpeg", ".png"]);
const allowedMimeTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);

export const paymentProofUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const extensionAllowed = allowedExtensions.has(path.extname(file.originalname).toLowerCase());
    if (extensionAllowed && allowedMimeTypes.has(file.mimetype)) return callback(null, true);
    callback(new Error("Payment proof must be a PDF, JPG, JPEG, or PNG file"));
  },
});