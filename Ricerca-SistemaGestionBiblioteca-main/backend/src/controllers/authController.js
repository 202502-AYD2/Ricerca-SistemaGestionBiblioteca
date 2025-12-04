import { supabase, supabaseAnon } from '../config/supabase.js'

/**
 * Login de usuario
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    // Validar datos de entrada
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email y contraseña son requeridos' 
      })
    }

    // Autenticar con Supabase usando cliente anon
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password
    })

    if (authError) {
      return res.status(401).json({ 
        error: authError.message === 'Invalid login credentials' 
          ? 'Credenciales inválidas' 
          : authError.message 
      })
    }

    // Obtener información del usuario de la tabla users
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', authData.user.email)
      .single()

    if (userError || !userData) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado en el sistema' 
      })
    }

    // Retornar token y datos del usuario
    return res.status(200).json({
      success: true,
      data: {
        token: authData.session.access_token,
        refreshToken: authData.session.refresh_token,
        user: {
          id: userData.id,
          email: userData.email,
          name: userData.name,
          role: userData.role,
          avatarUrl: userData.avatar_url
        }
      }
    })
  } catch (error) {
    console.error('Error en login:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Logout de usuario
 * POST /api/auth/logout
 */
export const logout = async (req, res) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization
    const token = authHeader && authHeader.split(' ')[1]

    if (token) {
      // Cerrar sesión en Supabase
      await supabaseAnon.auth.signOut()
    }

    return res.status(200).json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    })
  } catch (error) {
    console.error('Error en logout:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener usuario actual
 * GET /api/auth/me
 */
export const getCurrentUser = async (req, res) => {
  try {
    // El middleware authenticateToken ya adjuntó req.user
    return res.status(200).json({
      success: true,
      data: req.user
    })
  } catch (error) {
    console.error('Error en getCurrentUser:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Refrescar token
 * POST /api/auth/refresh
 */
export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(400).json({ 
        error: 'Refresh token es requerido' 
      })
    }

    const { data, error } = await supabaseAnon.auth.refreshSession({
      refresh_token: refreshToken
    })

    if (error) {
      return res.status(401).json({ 
        error: 'Refresh token inválido o expirado' 
      })
    }

    return res.status(200).json({
      success: true,
      data: {
        token: data.session.access_token,
        refreshToken: data.session.refresh_token
      }
    })
  } catch (error) {
    console.error('Error en refreshToken:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}
