# 🔗 Guía de Integración Backend-Frontend

## 📋 Arquitectura Correcta

```
┌─────────────────────┐        HTTP/REST         ┌──────────────────────┐
│                     │    ←──────────────────→   │                      │
│     FRONTEND        │                           │      BACKEND         │
│   (Next.js/React)   │    JSON + JWT Token       │   (Node.js/Express)  │
│                     │                           │                      │
└─────────────────────┘                           └──────────────────────┘
         │                                                     │
         │                                                     │
         ▼                                                     ▼
    localStorage                                        ┌─────────────┐
    (solo token)                                        │  SUPABASE   │
                                                        │ (PostgreSQL │
                                                        │    + Auth)  │
                                                        └─────────────┘
```

## ✅ Reglas de Oro

1. **NUNCA** conectes el frontend directamente a Supabase
2. **SIEMPRE** haz peticiones HTTP al backend
3. El **BACKEND** es el único que se conecta a Supabase
4. El **FRONTEND** solo guarda el token JWT en localStorage
5. Todas las operaciones de BD pasan por el backend

---

## 🚀 Paso 1: Configurar Backend

### 1.1 Instalar Backend

```bash
cd backend/
npm install
```

### 1.2 Configurar Variables de Entorno

```bash
cp .env.example .env
```

Editar `.env`:
```env
PORT=3001
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
FRONTEND_URL=http://localhost:3000
```

**IMPORTANTE**: El `SERVICE_ROLE_KEY` se obtiene en:
- Supabase → Settings → API → Service Role (secret)

### 1.3 Iniciar Backend

```bash
npm run dev
```

Verificar en: http://localhost:3001/health

---

## 🎨 Paso 2: Actualizar Frontend

### 2.1 Crear Servicio API

Crear `frontend/lib/api/client.js`:

```javascript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Helper para hacer peticiones autenticadas
async function fetchAPI(endpoint, options = {}) {
  const token = localStorage.getItem('authToken')
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Error en la petición')
  }

  return data
}

export const api = {
  // Auth
  login: (email, password) => 
    fetchAPI('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),
  
  logout: () => 
    fetchAPI('/auth/logout', { method: 'POST' }),
  
  getCurrentUser: () => 
    fetchAPI('/auth/me'),

  // Maestros
  getMaestros: () => 
    fetchAPI('/maestros'),
  
  createMaestro: (nombre, saldoInicial) => 
    fetchAPI('/maestros', {
      method: 'POST',
      body: JSON.stringify({ nombre, saldoInicial })
    }),

  // Movimientos
  getMovements: (maestroId) => 
    fetchAPI(`/movements${maestroId ? `?maestroId=${maestroId}` : ''}`),
  
  createMovement: (maestroId, maestroNombre, tipo, cantidad) => 
    fetchAPI('/movements', {
      method: 'POST',
      body: JSON.stringify({ maestroId, maestroNombre, tipo, cantidad })
    }),

  getDailyBalances: (maestroId, days = 30) =>
    fetchAPI(`/movements/daily-balances/${maestroId}?days=${days}`),

  // Usuarios
  getUsers: () => 
    fetchAPI('/users'),
  
  updateUserRole: (userId, role) => 
    fetchAPI(`/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role })
    })
}
```

### 2.2 Actualizar AuthContext

Actualizar `frontend/context/AuthContext.tsx`:

```typescript
"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { api } from "@/lib/api/client"

export type UserRole = "ADMIN" | "USER"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  avatarUrl: string | null
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token guardado
    const checkAuth = async () => {
      const token = localStorage.getItem('authToken')
      if (token) {
        try {
          const response = await api.getCurrentUser()
          setUser(response.data)
        } catch (error) {
          localStorage.removeItem('authToken')
        }
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const response = await api.login(email, password)
      
      // Guardar token
      localStorage.setItem('authToken', response.data.token)
      
      // Guardar usuario
      setUser(response.data.user)
      
      setLoading(false)
      return { success: true }
    } catch (error: any) {
      setLoading(false)
      return { 
        success: false, 
        error: error.message || 'Error al iniciar sesión' 
      }
    }
  }

  const logout = async () => {
    try {
      await api.logout()
    } catch (error) {
      console.error('Error during logout:', error)
    }
    
    localStorage.removeItem('authToken')
    setUser(null)
    router.push("/login")
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
```

### 2.3 Usar API en Componentes

Ejemplo en página de Maestros:

```typescript
'use client'

import { useEffect, useState } from 'react'
import { api } from '@/lib/api/client'
import { useAuth } from '@/context/AuthContext'

export default function MaestrosPage() {
  const { user } = useAuth()
  const [maestros, setMaestros] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadMaestros()
  }, [])

  const loadMaestros = async () => {
    try {
      const response = await api.getMaestros()
      setMaestros(response.data)
    } catch (error) {
      console.error('Error loading maestros:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (nombre: string, saldoInicial: number) => {
    try {
      await api.createMaestro(nombre, saldoInicial)
      await loadMaestros() // Recargar lista
    } catch (error) {
      console.error('Error creating maestro:', error)
    }
  }

  // ... resto del componente
}
```

---

## ⚙️ Paso 3: Variables de Entorno del Frontend

Actualizar `frontend/.env.local`:

```env
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# IMPORTANTE: NO poner credenciales de Supabase aquí
# El frontend YA NO se conecta directamente a Supabase
```

---

## 🔄 Flujo de Autenticación

### Login:

```
1. Usuario envía email/password desde frontend
   ↓
2. Frontend hace POST a /api/auth/login
   ↓
3. Backend valida con Supabase Auth
   ↓
4. Backend obtiene datos de usuario de tabla 'users'
   ↓
5. Backend retorna token JWT + datos de usuario
   ↓
6. Frontend guarda token en localStorage
   ↓
7. Frontend guarda usuario en estado
```

### Peticiones Autenticadas:

```
1. Frontend agrega header: Authorization: Bearer <token>
   ↓
2. Backend valida token con Supabase
   ↓
3. Backend verifica permisos del usuario
   ↓
4. Backend ejecuta operación en BD
   ↓
5. Backend retorna resultado
```

---

## 📝 Checklist de Integración

### Backend
- [ ] Backend instalado (`npm install`)
- [ ] Variables de entorno configuradas (`.env`)
- [ ] SERVICE_ROLE_KEY configurado
- [ ] Backend corriendo en puerto 3001
- [ ] Health check funciona: http://localhost:3001/health

### Frontend
- [ ] Cliente API creado (`lib/api/client.js`)
- [ ] AuthContext actualizado para usar API
- [ ] Variables de entorno configuradas (`NEXT_PUBLIC_API_URL`)
- [ ] Componentes actualizados para usar `api.*`
- [ ] Token guardado en localStorage (no en contexto de React)

### Testing
- [ ] Login funciona
- [ ] Token se guarda en localStorage
- [ ] Peticiones incluyen header Authorization
- [ ] Backend valida token correctamente
- [ ] CRUD de maestros funciona
- [ ] CRUD de movimientos funciona
- [ ] Gestión de usuarios funciona

---

## 🐛 Problemas Comunes

### Error CORS

**Síntoma**: "Access to fetch at 'http://localhost:3001' has been blocked by CORS policy"

**Solución**: Verificar en `backend/.env`:
```env
FRONTEND_URL=http://localhost:3000
```

### Error 401 Unauthorized

**Síntoma**: Todas las peticiones retornan 401

**Solución 1**: Verificar que el token está en localStorage:
```javascript
console.log(localStorage.getItem('authToken'))
```

**Solución 2**: Verificar que el header Authorization se está enviando

### Backend no inicia

**Síntoma**: "SUPABASE_URL no está configurado"

**Solución**: Crear `.env` desde `.env.example` y configurar

---

## 💡 Tips Importantes

1. **Nunca** guardes credenciales de Supabase en el frontend
2. **Siempre** envía el token en el header Authorization
3. **Maneja** errores 401 renovando el token o haciendo logout
4. **No guardes** datos sensibles en localStorage (solo el token)
5. **Usa** HTTPS en producción

---

## 🎯 Ventajas de Esta Arquitectura

✅ **Seguridad**: Credenciales solo en backend  
✅ **Control**: Todas las operaciones validadas en servidor  
✅ **Escalabilidad**: Fácil agregar rate limiting, caching, etc  
✅ **Mantenibilidad**: Lógica de negocio centralizada  
✅ **Testeable**: Backend se puede testear independientemente  

---

## 🚀 Deploy en Producción

### Backend (Railway/Render)

1. Subir código a GitHub
2. Conectar repositorio en Railway/Render
3. Configurar variables de entorno
4. Deploy automático

### Frontend (Vercel)

1. Configurar `NEXT_PUBLIC_API_URL` con URL del backend en producción
2. Deploy normalmente en Vercel
3. Actualizar `FRONTEND_URL` en backend con URL de Vercel

---

**¡Ahora tienes una arquitectura backend-frontend correcta!** 🎉
