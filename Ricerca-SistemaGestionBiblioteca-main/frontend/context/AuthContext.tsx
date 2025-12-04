"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api/client'

interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'USER'
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await api.getCurrentUser()
      if (response && response.data) {
        setUser(response.data)
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.login(email, password)
      
      console.log('Login response:', response) // Para debug
      
      // Verificar que la respuesta tenga token
      if (!response || !response.token) {
        throw new Error('Respuesta inválida del servidor')
      }
      
      // Guardar el token
      localStorage.setItem('token', response.token)
      
      // Guardar usuario
      if (response.user) {
        setUser(response.user)
      }
      
      // Redirigir al dashboard
      router.push('/transacciones')
    } catch (error: any) {
      console.error('Login failed:', error)
      // Limpiar cualquier token inválido
      localStorage.removeItem('token')
      throw new Error(error.message || 'Error al iniciar sesión')
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}