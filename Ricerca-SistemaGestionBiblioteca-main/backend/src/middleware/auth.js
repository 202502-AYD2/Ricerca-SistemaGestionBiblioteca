import jwt from 'jsonwebtoken'

/**
 * Middleware para verificar el token JWT
 */
export const authenticateToken = (req, res, next) => {
  try {
    // Obtener el token del header Authorization
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1] // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Token de autenticación no proporcionado' 
      })
    }

    // Verificar el token con JWT
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ 
          error: 'Token inválido o expirado' 
        })
      }

      // Adjuntar la información del usuario al request
      req.user = decoded

      next()
    })
  } catch (error) {
    console.error('Error en authenticateToken:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Middleware para verificar que el usuario tiene rol de ADMIN
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
 */
export const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ 
      error: 'Usuario no autenticado' 
    })
  }

  next()
}