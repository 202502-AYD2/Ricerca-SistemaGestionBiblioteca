import express from "express";
import {
  getPrestamos,
  getPrestamoById,
  createPrestamo,
  updatePrestamo,
  deletePrestamo
} from "../controllers/prestamosController.js";
import { authenticateToken, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

router.use(authenticateToken);

router.get("/", getPrestamos);
router.get("/:id", getPrestamoById);
router.post("/", requireAdmin, createPrestamo);
router.put("/:id", updatePrestamo);
router.delete("/:id", requireAdmin, deletePrestamo);

export default router;
