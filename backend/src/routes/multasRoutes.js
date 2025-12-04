import express from "express";
import {
  getMultas,
  getMultaById,
  createMulta,
  updateMulta,
  deleteMulta
} from "../controllers/multasController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/multas
router.get("/", getMultas);

// GET /api/multas/:id
router.get("/:id", getMultaById);

// POST /api/multas (solo admin)
router.post("/", requireAdmin, createMulta);

// PUT /api/multas/:id (solo admin)
router.put("/:id", requireAdmin, updateMulta);

// DELETE /api/multas/:id (solo admin)
router.delete("/:id", requireAdmin, deleteMulta);

export default router;
