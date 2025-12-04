import { supabase } from '../config/supabase.js'

/**
 * Middleware para verificar el token de autenticación
 * Extrae el token del header Authorization y verifica su validez
 */
export const authenticateToken = async (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de autenticación no proporcionado' 
      })
    }

    // Verificar el token con Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Token inválido o expirado' 
      })
    }

    // Obtener información adicional del usuario desde la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single()

    if (userError || !userData) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado en el sistema' 
      })
    }

    // Adjuntar la información del usuario al request
    req.user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      role: userData.role,
      avatarUrl: userData.avatar_url
    }

    next()
  } catch (error) {
    console.error('Error en authenticateToken:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Middleware para verificar que el usuario tiene rol de ADMIN
 * Debe usarse después de authenticateToken
 */
export const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuario no autenticado' 
    })
  }

  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ 
      error: 'Acceso denegado. Se requiere rol de administrador' 
    })
  }

  next()
}

/**
 * Middleware para verificar que el usuario está autenticado
 * Versión más ligera que solo verifica que existe req.user
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuario no autenticado' 
    })
  }

  next()
}
