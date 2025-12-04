// SUPABASE SERVER-SIDE INTEGRATION
// Este archivo debe crearse cuando conectes Supabase
// Instala las dependencias primero:
// npm install @supabase/supabase-js @supabase/ssr

 import { createServerClient } from '@supabase/ssr'
 import { cookies } from 'next/headers'

 export async function createClient() {
   const cookieStore = await cookies()

  return createServerClient(
     process.env.NEXT_PUBLIC_SUPABASE_URL!,
     process.env.SUPABASE_SERVICE_ROLE_KEY!,
     {
       cookies: {
        getAll() {
           return cookieStore.getAll()
         },
         setAll(cookiesToSet) {
           try {
             cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
           } catch {
             // Ignore errors in server components
           }
         },
       },
     }
   )
 }
//
// USO en Server Components:
// const supabase = await createClient()
// const { data, error } = await supabase.from('users').select('*')

export const PLACEHOLDER_SERVER = "Crear cuando conectes Supabase"
