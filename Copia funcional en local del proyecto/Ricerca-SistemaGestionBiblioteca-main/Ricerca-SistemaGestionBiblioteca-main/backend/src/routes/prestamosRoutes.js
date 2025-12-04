import express from 'express'
import { body } from 'express-validator'
import {
  getPrestamos,
  createPrestamo,
  devolverPrestamo,
  getPrestamosVencidos,
  deletePrestamo
} from '../controllers/prestamosController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

router.use(authenticateToken)

// ADMIN y USER pueden ver préstamos
router.get('/', getPrestamos)
router.get('/vencidos', getPrestamosVencidos)

// SOLO USER puede crear préstamos (ADMIN NO)
router.post(
  '/',
  (req, res, next) => {
    // Middleware personalizado: solo USER puede crear préstamos
    if (req.user.role !== 'USER') {
      return res.status(403).json({ 
        error: 'Solo los usuarios pueden crear préstamos' 
      })
    }
    next()
  },
  [
    body('libro_id').isInt().withMessage('ID de libro inválido'),
    body('usuario_id').isUUID().withMessage('ID de usuario inválido'),
    body('fecha_devolucion').isDate().withMessage('Fecha inválida')
  ],
  createPrestamo
)

// Todos pueden devolver
router.put('/:id/devolver', devolverPrestamo)

// Solo ADMIN puede eliminar
router.delete('/:id', requireAdmin, deletePrestamo)

export default router