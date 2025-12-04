import Link from "next/link"
import { Button } from "@/components/ui/button"
import { BookOpen, BarChart3, Users, Shield } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: "url(/placeholder.svg?height=600&width=1920&query=biblioteca+con+estantes+de+libros)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/60" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 text-balance">
            Sistema de gestión de biblioteca
          </h1>
          <p className="text-xl md:text-2xl text-white/90 mb-8 text-balance">
            Administra tu biblioteca de forma eficiente con control de transacciones, maestros y usuarios
          </p>
          <Link href="/login">
            <Button size="lg" className="text-lg px-8 py-6">
              Iniciar sesión
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
            Características principales
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-lg border border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="mb-4 inline-flex p-3 rounded-lg bg-primary/10">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-card-foreground">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p>Sistema de Gestión de Biblioteca - Ricerca AyD2</p>
          <p className="text-sm mt-2">Proyecto académico de Next.js + React + Supabase</p>
        </div>
      </footer>
    </div>
  )
}

const features = [
  {
    icon: BarChart3,
    title: "Transacciones",
    description: "Registra y visualiza movimientos de entrada y salida con gráficas en tiempo real",
  },
  {
    icon: BookOpen,
    title: "Maestros",
    description: "Gestiona diferentes maestros con control de saldos y responsables",
  },
  {
    icon: Users,
    title: "Usuarios",
    description: "Administra usuarios con diferentes roles y permisos (ADMIN/USER)",
  },
  {
    icon: Shield,
    title: "Seguridad",
    description: "Sistema de autenticación y autorización basado en roles",
  },
]
