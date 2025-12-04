"use client"

import type React from "react"

import { useAuth, type UserRole } from "@/context/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

interface RoleGuardProps {
  allowedRoles: UserRole[]
  children: React.ReactNode
  redirectTo?: string
}

export function RoleGuard({ allowedRoles, children, redirectTo = "/transacciones" }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && user && !allowedRoles.includes(user.role)) {
      router.push(redirectTo)
    }
  }, [user, loading, allowedRoles, redirectTo, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-muted-foreground">Verificando permisos...</p>
        </div>
      </div>
    )
  }

  if (!user || !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
