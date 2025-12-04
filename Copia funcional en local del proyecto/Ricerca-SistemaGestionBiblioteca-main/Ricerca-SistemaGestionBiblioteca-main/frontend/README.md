# Sistema de Gestión de Biblioteca - Ricerca AyD2

Sistema administrativo de gestión de bibliotecas construido con Next.js, React, TailwindCSS y preparado para integración con Supabase.

## Características

- **Autenticación**: Sistema de login con roles (ADMIN/USER)
- **Transacciones**: Gestión de movimientos con gráficas de evolución
- **Maestros**: CRUD de maestros con control de saldos
- **Usuarios**: Administración de usuarios y roles (solo ADMIN)
- **Protección de rutas**: Control de acceso basado en roles
- **UI Moderna**: Interfaz responsive con TailwindCSS y shadcn/ui

## Tecnologías

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Estilos**: TailwindCSS v4, shadcn/ui
- **Gráficas**: Recharts
- **Estado**: React Context API
- **Preparado para**: Supabase + Prisma (opcional)

## Estructura del Proyecto

\`\`\`
├── app/
│   ├── (dashboard)/        # Rutas protegidas con layout compartido
│   │   ├── transacciones/
│   │   ├── maestros/
│   │   └── usuarios/
│   ├── login/
│   ├── page.tsx           # Landing page
│   ├── layout.tsx
│   └── globals.css
├── components/
│   ├── ui/                # Componentes de shadcn/ui
│   ├── balance-chart.tsx
│   ├── data-table.tsx
│   ├── dashboard-layout.tsx
│   ├── error-state.tsx
│   ├── form-input.tsx
│   ├── form-select.tsx
│   ├── loading-state.tsx
│   ├── modal.tsx
│   ├── role-guard.tsx
│   └── sidebar.tsx
├── context/
│   └── AuthContext.tsx    # Contexto de autenticación
├── lib/
│   ├── mock-api.ts        # API simulada (reemplazar con Supabase)
│   ├── supabase/          # Clientes de Supabase (placeholders)
│   └── utils.ts
├── mock/
│   ├── users.json
│   ├── maestros.json
│   └── movements.json
└── prisma/
    └── schema.prisma      # Schema de Prisma (opcional)
\`\`\`

## Instalación y Ejecución

### Prerrequisitos

- Node.js 18+ 
- npm o pnpm

### Pasos

1. **Clonar o descargar el proyecto**

2. **Instalar dependencias**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configurar variables de entorno**
   \`\`\`bash
   cp .env.example .env.local
   \`\`\`
   
   Edita `.env.local` con tus valores (por ahora usa los placeholders, la app funciona con datos mock).

4. **Ejecutar en desarrollo**
   \`\`\`bash
   npm run dev
   \`\`\`
   
   La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

5. **Build para producción**
   \`\`\`bash
   npm run build
   npm start
   \`\`\`

## Credenciales de Prueba

El sistema actualmente usa autenticación simulada con datos mock:

- **ADMIN**: `admin@biblioteca.com` / `admin123`
- **USER**: `user@biblioteca.com` / `user123`

## Integración con Supabase

### 1. Crear proyecto en Supabase

Visita [https://supabase.com](https://supabase.com) y crea un nuevo proyecto.

### 2. Instalar dependencias

\`\`\`bash
npm install @supabase/supabase-js @supabase/ssr
\`\`\`

### 3. Configurar variables de entorno

Obtén tus credenciales desde el dashboard de Supabase y actualiza `.env.local`:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL="https://tu-proyecto.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key"
DATABASE_URL="postgresql://..."
\`\`\`

### 4. Crear tablas en Supabase

Ejecuta el siguiente SQL en el Editor SQL de Supabase:

\`\`\`sql
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

-- Habilitar Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE maestros ENABLE ROW LEVEL SECURITY;
ALTER TABLE movements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para users
CREATE POLICY "Users can read own data" ON users 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can read all users" ON users 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

CREATE POLICY "Admins can update users" ON users 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Políticas RLS para maestros
CREATE POLICY "Authenticated users can read maestros" ON maestros 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can insert maestros" ON maestros 
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN')
  );

-- Políticas RLS para movements
CREATE POLICY "Authenticated users can read movements" ON movements 
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert movements" ON movements 
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
\`\`\`

### 5. Implementar clientes de Supabase

Descomenta y completa el código en:
- `lib/supabase/client.ts` (para uso en cliente)
- `lib/supabase/server.ts` (para uso en servidor)

### 6. Reemplazar AuthContext

Actualiza `context/AuthContext.tsx` para usar Supabase Auth:

\`\`\`typescript
// Ejemplo simplificado:
const { data, error } = await supabase.auth.signInWithPassword({ email, password })
if (error) return { success: false, error: error.message }

const { data: userData } = await supabase
  .from('users')
  .select('*')
  .eq('id', data.user.id)
  .single()
\`\`\`

### 7. Crear API Routes o Server Actions

Reemplaza las llamadas a `mockApi` con Server Actions o API Routes que usen Supabase.

Ejemplo de Server Action:

\`\`\`typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createMaestro(nombre: string, saldo: number) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('maestros')
    .insert({ nombre, saldo, creado_por: 'current user' })
    .select()
    .single()
  
  if (error) throw error
  
  revalidatePath('/maestros')
  return data
}
\`\`\`

## Integración con Prisma (Opcional)

Si prefieres usar Prisma como ORM sobre Supabase:

\`\`\`bash
npm install prisma @prisma/client
npx prisma init
\`\`\`

Descomenta el schema en `prisma/schema.prisma` y ejecuta:

\`\`\`bash
npx prisma generate
npx prisma migrate dev --name initial
\`\`\`

## Scripts Disponibles

- `npm run dev` - Inicia servidor de desarrollo
- `npm run build` - Compila para producción
- `npm start` - Inicia servidor de producción
- `npm run lint` - Ejecuta linter

## Funcionalidades por Rol

### ADMIN (Administrador)
- Ver y crear transacciones
- Ver y crear maestros
- Ver y editar usuarios
- Acceso completo al sistema

### USER (Usuario)
- Ver y crear transacciones
- Ver maestros (no puede crear)
- No puede acceder a gestión de usuarios

## Notas Académicas

Este proyecto cumple con los requisitos académicos especificados:

1. ✅ Next.js con App Router
2. ✅ React + TypeScript
3. ✅ TailwindCSS para estilos
4. ✅ Autenticación con roles
5. ✅ CRUD completo con datos mock
6. ✅ Protección de rutas
7. ✅ Sidebar con información de usuario
8. ✅ Gráficas con Recharts
9. ✅ Modales con estados de loading
10. ✅ Preparado para Supabase + Prisma
11. ✅ Comentarios en código para integración
12. ✅ Variables de entorno configuradas

## Estructura de Archivos Clave

- **`context/AuthContext.tsx`**: Manejo de autenticación y sesión
- **`lib/mock-api.ts`**: API simulada (reemplazar con Supabase)
- **`components/role-guard.tsx`**: Protección de rutas por rol
- **`components/sidebar.tsx`**: Navegación lateral con info de usuario
- **`components/data-table.tsx`**: Tabla reutilizable
- **`components/modal.tsx`**: Modal reutilizable con estados
- **`mock/*.json`**: Datos de prueba

## Próximos Pasos

1. Conectar con Supabase siguiendo la guía de integración
2. Implementar autenticación real con Supabase Auth
3. Crear API Routes o Server Actions para operaciones CRUD
4. Configurar RLS (Row Level Security) en Supabase
5. (Opcional) Implementar Prisma como ORM
6. Agregar validaciones con Zod
7. Implementar testing con Vitest/Jest
8. Desplegar en Vercel

## Soporte

Para dudas sobre el proyecto académico, consulta los comentarios en el código que indican exactamente dónde y cómo integrar Supabase.

## Licencia

Proyecto académico - Ricerca AyD2
