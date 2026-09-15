import { Router, Application } from "express";
import multer from "multer";
import { storagePut } from "./storage";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 16 * 1024 * 1024 }, // 16MB max
  fileFilter: (_req, file, cb) => {
    // Allow images, PDFs, audio, video, and common docs
    const allowed = [
      "image/", "application/pdf", "audio/", "video/",
      "text/plain", "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument",
      "application/msword",
    ];
    const ok = allowed.some(prefix => file.mimetype.startsWith(prefix));
    cb(null, ok);
  },
});

function randomSuffix() {
  return Math.random().toString(36).slice(2, 10);
}

export function registerMediaUploadRoute(app: Application) {
  const router = Router();

  router.post("/api/chat/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file provided or file type not allowed" });
      }

      const { originalname, mimetype, buffer } = req.file;
      const ext = originalname.split(".").pop() ?? "bin";
      const fileKey = `chat-media/${Date.now()}-${randomSuffix()}.${ext}`;

      const { url } = await storagePut(fileKey, buffer, mimetype);

      return res.json({
        url,
        mediaType: mimetype,
        mediaName: originalname,
      });
    } catch (err: any) {
      console.error("[MediaUpload] Error:", err);
      return res.status(500).json({ error: err?.message ?? "Upload failed" });
    }
  });

  app.use(router);
}
