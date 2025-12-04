import express from 'express'
import { body } from 'express-validator'
import {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserProfile,
  deleteUser,
  getUserStats
} from '../controllers/usersController.js'
import { authenticateToken, requireAdmin } from '../middleware/auth.js'

const router = express.Router()

// Todas las rutas requieren autenticación
router.use(authenticateToken)

/**
 * @route   GET /api/users
 * @desc    Obtener todos los usuarios
 * @access  Private (ADMIN only)
 */
router.get('/', requireAdmin, getUsers)

/**
 * @route   GET /api/users/stats
 * @desc    Obtener estadísticas de usuarios
 * @access  Private (ADMIN only)
 */
router.get('/stats', requireAdmin, getUserStats)

/**
 * @route   GET /api/users/:id
 * @desc    Obtener un usuario por ID
 * @access  Private (ADMIN only)
 */
router.get('/:id', requireAdmin, getUserById)

/**
 * @route   PUT /api/users/:id/role
 * @desc    Actualizar el rol de un usuario
 * @access  Private (ADMIN only)
 */
router.put(
  '/:id/role',
  requireAdmin,
  [
    body('role')
      .isIn(['ADMIN', 'USER'])
      .withMessage('El rol debe ser ADMIN o USER')
  ],
  updateUserRole
)

/**
 * @route   PUT /api/users/:id/profile
 * @desc    Actualizar el perfil de un usuario
 * @access  Private (mismo usuario o ADMIN)
 */
router.put('/:id/profile', updateUserProfile)

/**
 * @route   DELETE /api/users/:id
 * @desc    Eliminar un usuario
 * @access  Private (ADMIN only)
 */
router.delete('/:id', requireAdmin, deleteUser)

export default router
