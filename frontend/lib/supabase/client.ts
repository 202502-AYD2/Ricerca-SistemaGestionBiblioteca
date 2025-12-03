// SUPABASE CLIENT-SIDE INTEGRATION
// Este archivo debe crearse cuando conectes Supabase
// Instala las dependencias primero:
// npm install @supabase/supabase-js @supabase/ssr

import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
   )
 }

// USO:
// const supabase = createClient()
// const { data, error } = await supabase.from('maestros').select('*')

export const PLACEHOLDER_CLIENT = "Crear cuando conectes Supabase"
