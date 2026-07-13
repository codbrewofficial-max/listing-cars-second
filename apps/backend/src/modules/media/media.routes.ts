import { Router } from "express";
import multer from "multer";
import { authenticate } from "../auth/authenticate.middleware";
import { authorize } from "../auth/authorize.middleware";
import {
  deleteMediaHandler,
  getMediaHandler,
  getMediaUsageHandler,
  uploadMediaHandler,
} from "./media.controller";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file sebelum kompresi
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      return cb(new Error("Hanya file gambar yang diizinkan"));
    }
    cb(null, true);
  },
});

const router = Router();

// POST /api/media - Admin, Super Admin, Customer (khusus lampiran chat)
router.post(
  "/",
  authenticate,
  authorize("admin", "super_admin", "customer"),
  upload.single("file"),
  uploadMediaHandler
);

// GET /api/media/usage - Owner, Super Admin (didaftarkan sebelum /:id agar tidak tertangkap sebagai id)
router.get("/usage", authenticate, authorize("owner", "super_admin"), getMediaUsageHandler);

// GET /api/media/:id - Authenticated
router.get("/:id", authenticate, getMediaHandler);

// DELETE /api/media/:id - Admin, Super Admin
router.delete("/:id", authenticate, authorize("admin", "super_admin"), deleteMediaHandler);

export default router;
