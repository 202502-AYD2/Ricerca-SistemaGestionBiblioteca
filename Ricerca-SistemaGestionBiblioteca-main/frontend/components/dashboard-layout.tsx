"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/context/AuthContext"

interface DashboardLayoutProps {
  children: ReactNode
  title?: string
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const { loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" />
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-64 p-8">
        {title && (
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
