import express from 'express'
import { body } from 'express-validator'
import {
  getMultas,
  createMulta,
  pagarMulta,
  getMultasStats,
  generarMultasAutomaticas,
  deleteMulta
} from '../controllers/multasController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// ADMIN y USER pueden ver multas
router.get('/', getMultas)
router.get('/stats', getMultasStats)

// Solo ADMIN puede crear, pagar, generar y eliminar
router.post(
  '/',
  requireAdmin,
  [
    body('prestamo_id').isInt().withMessage('ID de préstamo inválido'),
    body('monto').isFloat({ min: 0 }).withMessage('Monto inválido')
  ],
  createMulta
)

router.put('/:id/pagar', requireAdmin, pagarMulta)
router.post('/generar-automaticas', requireAdmin, generarMultasAutomaticas)
router.delete('/:id', requireAdmin, deleteMulta)

export default router