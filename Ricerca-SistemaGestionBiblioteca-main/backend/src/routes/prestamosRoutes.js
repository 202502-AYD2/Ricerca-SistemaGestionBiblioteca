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

// USER y ADMIN pueden ver préstamos y crear
router.get('/', getPrestamos)
router.get('/vencidos', getPrestamosVencidos)
router.post(
  '/',
  [
    body('libro_id').isInt().withMessage('ID de libro inválido'),
    body('usuario_id').isUUID().withMessage('ID de usuario inválido'),
    body('fecha_devolucion').isDate().withMessage('Fecha inválida')
  ],
  createPrestamo
)

// USER y ADMIN pueden devolver
router.put('/:id/devolver', devolverPrestamo)

// Solo ADMIN puede eliminar
router.delete('/:id', requireAdmin, deletePrestamo)

export default router