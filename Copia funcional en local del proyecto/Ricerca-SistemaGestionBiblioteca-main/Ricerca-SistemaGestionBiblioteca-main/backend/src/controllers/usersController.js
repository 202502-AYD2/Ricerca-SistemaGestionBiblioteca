import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todos los usuarios
 * GET /api/users
 * Requiere rol ADMIN
 */
export const getUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener usuarios: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getUsers:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 * Requiere rol ADMIN
 */
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getUserById:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Actualizar el rol de un usuario
 * PUT /api/users/:id/role
 * Requiere rol ADMIN
 */
export const updateUserRole = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { id } = req.params
    const { role } = req.body

    // Prevenir que un admin se quite sus propios permisos de admin
    // si es el último admin del sistema
    if (req.user.id === id && role === 'USER') {
      const { data: adminCount } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ADMIN')

      if (adminCount === 1) {
        return res.status(400).json({ 
          error: 'No puedes quitarte permisos de admin si eres el último administrador' 
        })
      }
    }

    // Actualizar el rol
    const { data, error } = await supabase
      .from('users')
      .update({ role })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al actualizar rol: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Rol actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error en updateUserRole:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Actualizar el perfil de un usuario
 * PUT /api/users/:id/profile
 */
export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { name, avatar_url } = req.body

    // Verificar que el usuario actual es el mismo o es admin
    if (req.user.id !== id && req.user.role !== 'ADMIN') {
      return res.status(403).json({ 
        error: 'No tienes permisos para actualizar este perfil' 
      })
    }

    // Construir objeto de actualización
    const updates = {}
    if (name !== undefined) updates.name = name
    if (avatar_url !== undefined) updates.avatar_url = avatar_url

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron datos para actualizar' 
      })
    }

    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al actualizar perfil: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Perfil actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error en updateUserProfile:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar un usuario
 * DELETE /api/users/:id
 * Requiere rol ADMIN
 */
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params

    // Prevenir que un admin se elimine a sí mismo
    if (req.user.id === id) {
      return res.status(400).json({ 
        error: 'No puedes eliminar tu propia cuenta' 
      })
    }

    // Verificar que no es el último admin
    const { data: userToDelete } = await supabase
      .from('users')
      .select('role')
      .eq('id', id)
      .single()

    if (userToDelete?.role === 'ADMIN') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('role', 'ADMIN')

      if (count === 1) {
        return res.status(400).json({ 
          error: 'No puedes eliminar al último administrador del sistema' 
        })
      }
    }

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar usuario: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteUser:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener estadísticas de usuarios
 * GET /api/users/stats
 * Requiere rol ADMIN
 */
export const getUserStats = async (req, res) => {
  try {
    const [
      { count: totalUsers },
      { count: adminUsers },
      { count: regularUsers }
    ] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact', head: true }),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'ADMIN'),
      supabase.from('users').select('*', { count: 'exact', head: true }).eq('role', 'USER')
    ])

    return res.status(200).json({
      success: true,
      data: {
        total: totalUsers || 0,
        admins: adminUsers || 0,
        users: regularUsers || 0
      }
    })
  } catch (error) {
    console.error('Error en getUserStats:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}
