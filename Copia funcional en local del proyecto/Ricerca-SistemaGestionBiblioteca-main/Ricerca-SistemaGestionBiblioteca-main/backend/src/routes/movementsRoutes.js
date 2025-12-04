import express from 'express'
import { body } from 'express-validator'
import {
  getMovements,
  getMovementById,
  createMovement,
  deleteMovement,
  getDailyBalances,
  getMovementStats,
  getRecentMovements
} from '../controllers/movementsController.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

/**
 * @route   GET /api/movements
 * @desc    Obtener todos los movimientos (opcional: filtrado por maestroId)
 * @access  Private (USER, ADMIN)
 */
router.get('/', getMovements)

/**
 * @route   GET /api/movements/recent
 * @desc    Obtener movimientos recientes
 * @access  Private (USER, ADMIN)
 */
router.get('/recent', getRecentMovements)

/**
 * @route   GET /api/movements/daily-balances/:maestroId
 * @desc    Obtener saldos diarios de un maestro
 * @access  Private (USER, ADMIN)
 */
router.get('/daily-balances/:maestroId', getDailyBalances)

/**
 * @route   GET /api/movements/stats/:maestroId
 * @desc    Obtener estadísticas de movimientos de un maestro
 * @access  Private (USER, ADMIN)
 */
router.get('/stats/:maestroId', getMovementStats)

/**
 * @route   GET /api/movements/:id
 * @desc    Obtener un movimiento por ID
 * @access  Private (USER, ADMIN)
 */
router.get('/:id', getMovementById)

/**
 * @route   POST /api/movements
 * @desc    Crear un nuevo movimiento
 * @access  Private (USER, ADMIN)
 */
router.post(
  '/',
  [
    body('maestroId')
      .notEmpty()
      .withMessage('El maestro es requerido')
      .isUUID()
      .withMessage('ID de maestro inválido'),
    body('maestroNombre')
      .trim()
      .notEmpty()
      .withMessage('El nombre del maestro es requerido'),
    body('tipo')
      .isIn(['ENTRADA', 'SALIDA'])
      .withMessage('El tipo debe ser ENTRADA o SALIDA'),
    body('cantidad')
      .isNumeric()
      .withMessage('La cantidad debe ser numérica')
      .isFloat({ gt: 0 })
      .withMessage('La cantidad debe ser mayor a cero')
  ],
  createMovement
)

/**
 * @route   DELETE /api/movements/:id
 * @desc    Eliminar un movimiento
 * @access  Private (USER, ADMIN)
 */
router.delete('/:id', deleteMovement)

export default router
