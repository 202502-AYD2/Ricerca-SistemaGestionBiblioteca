# Guía de Integración con Supabase y Prisma

Esta guía proporciona instrucciones paso a paso para conectar el proyecto con Supabase y opcionalmente Prisma.

## Tabla de Contenidos

1. [Configuración de Supabase](#1-configuración-de-supabase)
2. [Instalación de Dependencias](#2-instalación-de-dependencias)
3. [Configuración de Variables de Entorno](#3-configuración-de-variables-de-entorno)
4. [Creación de Tablas](#4-creación-de-tablas)
5. [Implementación de Clientes](#5-implementación-de-clientes)
6. [Actualización de AuthContext](#6-actualización-de-authcontext)
7. [Creación de API Routes/Server Actions](#7-creación-de-api-routesserver-actions)
8. [Integración con Prisma (Opcional)](#8-integración-con-prisma-opcional)
9. [Testing de Integración](#9-testing-de-integración)

---

## 1. Configuración de Supabase

### Paso 1.1: Crear Proyecto

1. Visita [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Haz clic en "New Project"
4. Completa:
   - **Name**: biblioteca-ricerca
   - **Database Password**: (guarda esto de forma segura)
   - **Region**: Elige la más cercana
   - **Pricing Plan**: Free tier es suficiente

### Paso 1.2: Obtener Credenciales

1. Ve a Settings → API
2. Copia:
   - **Project URL**: Tu `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key**: Tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ve a Settings → Database
4. Copia:
   - **Connection string**: Tu `DATABASE_URL`

---

## 2. Instalación de Dependencias

\`\`\`bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Prisma (opcional)
npm install prisma @prisma/client
npm install -D prisma

# Validación (recomendado)
npm install zod
\`\`\`

---

## 3. Configuración de Variables de Entorno

Crea `.env.local` en la raíz del proyecto:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-aqui"

# Database
DATABASE_URL="postgresql://postgres:tu-password@db.tu-proyecto.supabase.co:5432/postgres"

# JWT (genera uno seguro)
JWT_SECRET="tu-secreto-jwt-super-seguro"
\`\`\`

**Generar JWT_SECRET seguro:**

\`\`\`bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
\`\`\`

---

## 4. Creación de Tablas

### Paso 4.1: Ejecutar SQL en Supabase

1. Ve a SQL Editor en tu dashboard de Supabase
2. Crea una nueva query
3. Pega el siguiente SQL:

\`\`\`sql
-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de usuarios
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'USER')),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de maestros
CREATE TABLE maestros (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre TEXT NOT NULL,
  saldo DECIMAL(10, 2) NOT NULL DEFAULT 0,
  creado_por TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos
CREATE TABLE movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maestro_id UUID REFERENCES maestros(id) ON DELETE CASCADE,
  maestro_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('ENTRADA', 'SALIDA')),
  cantidad DECIMAL(10, 2) NOT NULL,
  responsable TEXT NOT NULL,
  fecha TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX idx_movements_maestro_id ON movements(maestro_id);
CREATE INDEX idx_movements_fecha ON movements(fecha);
CREATE INDEX idx_users_email ON users(email);

-- Datos de prueba
INSERT INTO users (email, name, role, avatar_url) VALUES
  ('admin@biblioteca.com', 'Carlos Rodríguez', 'ADMIN', NULL),
  ('user@biblioteca.com', 'María González', 'USER', NULL);

INSERT INTO maestros (nombre, saldo, creado_por) VALUES
  ('Biblioteca Central', 15000, 'Carlos Rodríguez'),
  ('Sucursal Norte', 8500, 'Carlos Rodríguez');
\`\`\`

4. Ejecuta la query (Run)

### Paso 4.2: Configurar Row Level Security (RLS)

\`\`\`sql
-- Habilitar RLS en todas las tablas
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" 
  ON users FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update users" 
  ON users FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Políticas para maestros
CREATE POLICY "Authenticated users can read maestros" 
  ON maestros FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can create maestros" 
  ON maestros FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Políticas para movements
CREATE POLICY "Authenticated users can read movements" 
  ON movements FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create movements" 
  ON movements FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');
\`\`\`

---

## 5. Implementación de Clientes

### Paso 5.1: Cliente Browser

Actualiza `lib/supabase/client.ts`:

\`\`\`typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
\`\`\`

### Paso 5.2: Cliente Server

Actualiza `lib/supabase/server.ts`:

\`\`\`typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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
            // Ignorar errores en server components
          }
        },
      },
    }
  )
}
\`\`\`

---

## 6. Actualización de AuthContext

Reemplaza `context/AuthContext.tsx` con autenticación real:

\`\`\`typescript
'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

// ... tipos existentes ...

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Verificar sesión actual
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      
      if (authUser) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (userData) {
          setUser({
            id: userData.id,
            email: userData.email,
            name: userData.name,
            role: userData.role,
            avatarUrl: userData.avatar_url
          })
        }
      }
      
      setLoading(false)
    }

    getUser()

    // Suscribirse a cambios de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session) {
          await getUser()
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      setLoading(false)
      return { success: false, error: error.message }
    }
    
    const { data: userData } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()
    
    if (userData) {
      setUser({
        id: userData.id,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        avatarUrl: userData.avatar_url
      })
    }
    
    setLoading(false)
    return { success: true }
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}
\`\`\`

---

## 7. Creación de API Routes/Server Actions

### Opción A: Server Actions (Recomendado)

Crea `lib/actions/maestros.ts`:

\`\`\`typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getMaestros() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('maestros')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

export async function createMaestro(formData: {
  nombre: string
  saldo: number
  creadoPor: string
}) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maestros')
    .insert({
      nombre: formData.nombre,
      saldo: formData.saldo,
      creado_por: formData.creadoPor
    })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/maestros')
  return data
}
\`\`\`

### Opción B: API Routes

Crea `app/api/maestros/route.ts`:

\`\`\`typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maestros')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('maestros')
    .insert({
      nombre: body.nombre,
      saldo: body.saldo,
      creado_por: body.creadoPor
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
\`\`\`

---

## 8. Integración con Prisma (Opcional)

### Paso 8.1: Inicializar Prisma

\`\`\`bash
npx prisma init
\`\`\`

### Paso 8.2: Actualizar DATABASE_URL

En `.env.local`, asegúrate de tener:

\`\`\`env
DATABASE_URL="postgresql://postgres:password@db.project.supabase.co:5432/postgres"
\`\`\`

### Paso 8.3: Descomenta el Schema

El archivo `prisma/schema.prisma` ya contiene el schema comentado. Descoméntalo.

### Paso 8.4: Generar Cliente

\`\`\`bash
npx prisma generate
\`\`\`

### Paso 8.5: Sincronizar con DB

\`\`\`bash
npx prisma db pull  # Sincroniza schema desde Supabase
npx prisma generate # Regenera cliente
\`\`\`

### Paso 8.6: Crear Cliente Prisma

Crea `lib/prisma.ts`:

\`\`\`typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
\`\`\`

### Paso 8.7: Usar Prisma

\`\`\`typescript
import { prisma } from '@/lib/prisma'

// Obtener maestros
const maestros = await prisma.maestro.findMany()

// Crear maestro
const maestro = await prisma.maestro.create({
  data: {
    nombre: 'Biblioteca Central',
    saldo: 10000,
    creadoPor: 'Admin'
  }
})
\`\`\`

---

## 9. Testing de Integración

### Paso 9.1: Verificar Conexión

Crea un archivo de prueba `app/test/page.tsx`:

\`\`\`typescript
import { createClient } from '@/lib/supabase/server'

export default async function TestPage() {
  const supabase = await createClient()
  const { data, error } = await supabase.from('maestros').select('*')
  
  return (
    <div className="p-8">
      <h1>Test de Conexión</h1>
      {error ? (
        <pre className="text-red-500">{JSON.stringify(error, null, 2)}</pre>
      ) : (
        <pre>{JSON.stringify(data, null, 2)}</pre>
      )}
    </div>
  )
}
\`\`\`

Visita `/test` para verificar la conexión.

### Paso 9.2: Verificar Auth

Usa las credenciales de prueba:
- Email: `admin@biblioteca.com`
- Password: (el que configuraste en Supabase Auth)

### Paso 9.3: Configurar Usuarios para Auth

En Supabase Dashboard:
1. Ve a Authentication → Users
2. Crea usuarios manualmente con los mismos emails de tu tabla `users`
3. Establece contraseñas

---

## Checklist de Integración

- [ ] Proyecto de Supabase creado
- [ ] Variables de entorno configuradas
- [ ] Dependencias instaladas
- [ ] Tablas creadas en Supabase
- [ ] RLS configurado
- [ ] Clientes de Supabase implementados
- [ ] AuthContext actualizado
- [ ] Server Actions/API Routes creados
- [ ] (Opcional) Prisma configurado
- [ ] Conexión verificada
- [ ] Auth verificada
- [ ] CRUD funcionando

---

## Troubleshooting

### Error: "Invalid API key"
- Verifica que las variables NEXT_PUBLIC_SUPABASE_* estén correctas
- Reinicia el servidor de desarrollo

### Error: "Row Level Security"
- Verifica que las políticas RLS estén creadas
- Verifica que el usuario esté autenticado

### Error: "relation does not exist"
- Verifica que las tablas estén creadas en Supabase
- Ejecuta el SQL de creación de tablas nuevamente

### Prisma sync issues
- Ejecuta `npx prisma db pull` para sincronizar
- Ejecuta `npx prisma generate` para regenerar cliente

---

## Recursos Adicionales

- [Documentación de Supabase](https://supabase.com/docs)
- [Next.js con Supabase](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Prisma con Supabase](https://supabase.com/docs/guides/integrations/prisma)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
\`\`\`

```json file="" isHidden
