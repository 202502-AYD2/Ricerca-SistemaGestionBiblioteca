import express from 'express'
import { body } from 'express-validator'
import {
  getLibros,
  getLibroById,
  createLibro,
  updateLibro,
  deleteLibro,
  searchLibros
} from '../controllers/librosController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

// USER y ADMIN pueden ver libros
router.get('/', getLibros)
router.get('/search', searchLibros)
router.get('/:id', getLibroById)

// Solo ADMIN puede crear, actualizar y eliminar
router.post(
  '/',
  requireAdmin,
  [
    body('titulo').notEmpty().withMessage('El título es requerido'),
    body('autor').notEmpty().withMessage('El autor es requerido'),
    body('cantidad').optional().isInt({ min: 0 })
  ],
  createLibro
)

router.put('/:id', requireAdmin, updateLibro)
router.delete('/:id', requireAdmin, deleteLibro)

export default router