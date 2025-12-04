import express from "express";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";
import {
  getLibros,
  getLibroById,
  createLibro,
  updateLibro,
  deleteLibro
} from "../controllers/librosController.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getLibros);
router.get("/:id", getLibroById);

router.post("/", requireAdmin, createLibro);
router.put("/:id", requireAdmin, updateLibro);
router.delete("/:id", requireAdmin, deleteLibro);

export default router;
