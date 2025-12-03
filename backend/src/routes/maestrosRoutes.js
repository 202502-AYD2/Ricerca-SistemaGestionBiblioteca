import express from 'express'
import { body } from 'express-validator'
import {
  getMaestros,
  getMaestroById,
  createMaestro,
  updateMaestro,
  deleteMaestro,
  getMaestroStats
} from '../controllers/maestrosController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

/**
 * @route   GET /api/maestros
 * @desc    Obtener todos los maestros
 * @access  Private (USER, ADMIN)
 */
router.get('/', getMaestros)

/**
 * @route   GET /api/maestros/:id
 * @desc    Obtener un maestro por ID
 * @access  Private (USER, ADMIN)
 */
router.get('/:id', getMaestroById)

/**
 * @route   POST /api/maestros
 * @desc    Crear un nuevo maestro
 * @access  Private (ADMIN only)
 */
router.post(
  '/',
  requireAdmin,
  [
    body('nombre')
      .trim()
      .notEmpty()
      .withMessage('El nombre es requerido')
      .isLength({ max: 255 })
      .withMessage('El nombre no puede exceder 255 caracteres'),
    body('saldoInicial')
      .isNumeric()
      .withMessage('El saldo inicial debe ser numérico')
      .isFloat({ min: 0 })
      .withMessage('El saldo inicial no puede ser negativo')
  ],
  createMaestro
)

/**
 * @route   PUT /api/maestros/:id
 * @desc    Actualizar un maestro
 * @access  Private (ADMIN only)
 */
router.put('/:id', requireAdmin, updateMaestro)

/**
 * @route   DELETE /api/maestros/:id
 * @desc    Eliminar un maestro
 * @access  Private (ADMIN only)
 */
router.delete('/:id', requireAdmin, deleteMaestro)

/**
 * @route   GET /api/maestros/:id/stats
 * @desc    Obtener estadísticas de un maestro
 * @access  Private (USER, ADMIN)
 */
router.get('/:id/stats', getMaestroStats)

export default router
