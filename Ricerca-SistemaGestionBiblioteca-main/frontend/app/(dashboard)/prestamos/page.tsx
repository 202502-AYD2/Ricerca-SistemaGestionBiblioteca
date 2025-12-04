"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { RoleGuard } from "@/components/role-guard"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { FormInput } from "@/components/form-input"
import { FormSelect } from "@/components/form-select"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, BookOpen, CheckCircle, XCircle } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface Libro {
  id: number
  titulo: string
  autor: string
  cantidad: number
}

interface User {
  id: string
  name: string
  email: string
}

interface Prestamo {
  id: number
  libro_id: number
  usuario_id: string
  fecha_prestamo: string
  fecha_devolucion: string
  devuelto: boolean
  libros?: { titulo: string; autor: string }
  users?: { name: string; email: string }
}

export default function PrestamosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [libros, setLibros] = useState<Libro[]>([])
  const [usuarios, setUsuarios] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    libro_id: "",
    usuario_id: "",
    fecha_devolucion: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [prestamosRes, librosRes, usersRes] = await Promise.all([
        api.getPrestamos(),
        api.getLibros(),
        api.getUsers()
      ])
      
      setPrestamos(prestamosRes.data)
      setLibros(librosRes.data.filter((l: Libro) => l.cantidad > 0)) // Solo libros disponibles
      setUsuarios(usersRes.data)
      
      // Si es USER, preseleccionar su ID
      if (user?.role === 'USER') {
        setFormData(prev => ({ ...prev, usuario_id: user.id }))
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePrestamo = async () => {
    try {
      setIsCreating(true)
      
      // Calcular fecha de préstamo (hoy)
      const fechaPrestamo = new Date().toISOString().split('T')[0]
      
      await api.createPrestamo({
        libro_id: parseInt(formData.libro_id),
        usuario_id: formData.usuario_id,
        fecha_prestamo: fechaPrestamo,
        fecha_devolucion: formData.fecha_devolucion
      })

      await loadData()

      const libroSeleccionado = libros.find(l => l.id === parseInt(formData.libro_id))
      
      toast({
        title: "Préstamo creado",
        description: `Préstamo de "${libroSeleccionado?.titulo}" creado exitosamente`,
      })

      setIsModalOpen(false)
      setFormData({ 
        libro_id: "", 
        usuario_id: user?.role === 'USER' ? user.id : "", 
        fecha_devolucion: "" 
      })
    } catch (err: any) {
      console.error('Error creating prestamo:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear el préstamo",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDevolver = async (id: number, titulo: string) => {
    if (!confirm(`¿Marcar como devuelto el libro "${titulo}"?`)) return

    try {
      await api.devolverPrestamo(id)
      await loadData()
      toast({
        title: "Libro devuelto",
        description: `El libro "${titulo}" ha sido marcado como devuelto`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo devolver el libro",
        variant: "destructive",
      })
    }
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: number) => <span className="font-mono text-sm">#{value}</span>,
    },
    {
      key: "libros",
      label: "Libro",
      render: (libro: any) => (
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{libro?.titulo || 'N/A'}</div>
            <div className="text-xs text-muted-foreground">{libro?.autor || ''}</div>
          </div>
        </div>
      ),
    },
    {
      key: "users",
      label: "Usuario",
      render: (usuario: any) => (
        <div>
          <div className="font-medium">{usuario?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{usuario?.email || ''}</div>
        </div>
      ),
    },
    {
      key: "fecha_prestamo",
      label: "Fecha Préstamo",
      render: (value: string) =>
        new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "fecha_devolucion",
      label: "Fecha Devolución",
      render: (value: string) =>
        new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "devuelto",
      label: "Estado",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className="gap-1">
          {value ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
          {value ? 'Devuelto' : 'Prestado'}
        </Badge>
      ),
    },
    {
      key: "actions",
      label: "Acciones",
      render: (_: any, row: Prestamo) => (
        !row.devuelto && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleDevolver(row.id, row.libros?.titulo || 'libro')}
            className="gap-2"
          >
            <CheckCircle className="h-4 w-4" />
            Devolver
          </Button>
        )
      ),
    },
  ]

  // Calcular fecha mínima (mañana) y máxima (30 días después)
  const getFechaMinima = () => {
    const mañana = new Date()
    mañana.setDate(mañana.getDate() + 1)
    return mañana.toISOString().split('T')[0]
  }

  const getFechaMaxima = () => {
    const treintaDias = new Date()
    treintaDias.setDate(treintaDias.getDate() + 30)
    return treintaDias.toISOString().split('T')[0]
  }

  if (loading) return <LoadingState message="Cargando préstamos..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Préstamos</h1>
            <p className="text-muted-foreground mt-1">Gestión de préstamos de libros</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Préstamo
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Préstamos</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{prestamos.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activos</CardTitle>
              <XCircle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {prestamos.filter(p => !p.devuelto).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Devueltos</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {prestamos.filter(p => p.devuelto).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Prestamos Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Préstamos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={prestamos} 
              emptyMessage="No hay préstamos registrados" 
            />
          </CardContent>
        </Card>

        {/* Create Prestamo Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Nuevo Préstamo"
          description="Registrar un nuevo préstamo de libro"
          onConfirm={handleCreatePrestamo}
          onCancel={() => {
            setIsModalOpen(false)
            setFormData({ 
              libro_id: "", 
              usuario_id: user?.role === 'USER' ? user.id : "", 
              fecha_devolucion: "" 
            })
          }}
          confirmText="Crear Préstamo"
          loading={isCreating}
          confirmDisabled={!formData.libro_id || !formData.usuario_id || !formData.fecha_devolucion}
        >
          <div className="space-y-4">
            <FormSelect
              id="libro"
              label="Libro"
              value={formData.libro_id}
              onChange={(value) => setFormData({ ...formData, libro_id: value })}
              options={libros.map((libro) => ({ 
                value: libro.id.toString(), 
                label: `${libro.titulo} - ${libro.autor} (${libro.cantidad} disponibles)` 
              }))}
              required
            />
            
            {user?.role === "ADMIN" && (
              <FormSelect
                id="usuario"
                label="Usuario"
                value={formData.usuario_id}
                onChange={(value) => setFormData({ ...formData, usuario_id: value })}
                options={usuarios.map((usuario) => ({ 
                  value: usuario.id, 
                  label: `${usuario.name} (${usuario.email})` 
                }))}
                required
              />
            )}

            {user?.role === "USER" && (
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p><strong>Solicitante:</strong> {user.name}</p>
                <p className="text-xs mt-1">{user.email}</p>
              </div>
            )}

            <FormInput
              id="fecha_devolucion"
              label="Fecha de Devolución"
              type="date"
              value={formData.fecha_devolucion}
              onChange={(value) => setFormData({ ...formData, fecha_devolucion: value })}
              placeholder="Seleccionar fecha"
              required
              min={getFechaMinima()}
              max={getFechaMaxima()}
            />

            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
              <strong>Nota:</strong> El préstamo se puede realizar por un máximo de 30 días.
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}