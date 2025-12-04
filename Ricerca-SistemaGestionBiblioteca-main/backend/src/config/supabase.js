import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Cargar variables de entorno
dotenv.config({ path: '.env.example' })

// Validar que las variables de entorno estén configuradas
if (!process.env.SUPABASE_URL) {
  throw new Error('SUPABASE_URL no está configurado en las variables de entorno')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurado en las variables de entorno')
}

/**
 * Cliente de Supabase con service_role key
 * Esto permite bypass de Row Level Security para operaciones del servidor
 * IMPORTANTE: Nunca exponer este cliente al frontend
 */
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Cliente de Supabase con anon key
 * Usar solo cuando sea necesario respetar RLS
 */
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
)

export default supabase
