"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { RoleGuard } from "@/components/role-guard"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { FormInput } from "@/components/form-input"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Book, Trash2 } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface Libro {
  id: number
  titulo: string
  autor: string
  fecha_publicacion: string
  categoria: string
  cantidad: number
}

export default function LibrosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [libros, setLibros] = useState<Libro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    titulo: "",
    autor: "",
    fecha_publicacion: "",
    categoria: "",
    cantidad: "1",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getLibros()
      setLibros(response.data)
    } catch (err: any) {
      console.error('Error loading libros:', err)
      setError(err.message || "Error al cargar los libros")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLibro = async () => {
    try {
      setIsCreating(true)
      await api.createLibro({
        titulo: formData.titulo,
        autor: formData.autor,
        fecha_publicacion: formData.fecha_publicacion,
        categoria: formData.categoria,
        cantidad: parseInt(formData.cantidad)
      })

      await loadData()

      toast({
        title: "Libro creado",
        description: `Se ha creado el libro "${formData.titulo}"`,
      })

      setIsModalOpen(false)
      setFormData({ titulo: "", autor: "", fecha_publicacion: "", categoria: "", cantidad: "1" })
    } catch (err: any) {
      console.error('Error creating libro:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear el libro",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDelete = async (id: number, titulo: string) => {
    if (!confirm(`¿Estás seguro de eliminar el libro "${titulo}"?`)) return

    try {
      await api.deleteLibro(id)
      await loadData()
      toast({
        title: "Libro eliminado",
        description: `Se ha eliminado "${titulo}"`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo eliminar el libro",
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
      key: "titulo",
      label: "Título",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <Book className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "autor",
      label: "Autor",
    },
    {
      key: "categoria",
      label: "Categoría",
    },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value: number) => (
        <span className={`font-semibold ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
          {value} {value === 1 ? 'ejemplar' : 'ejemplares'}
        </span>
      ),
    },
    ...(user?.role === "ADMIN" ? [{
      key: "actions",
      label: "Acciones",
      render: (_: any, row: Libro) => (
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => handleDelete(row.id, row.titulo)}
          className="gap-2 text-red-600 hover:text-red-700"
        >
          <Trash2 className="h-4 w-4" />
          Eliminar
        </Button>
      ),
    }] : []),
  ]

  if (loading) return <LoadingState message="Cargando libros..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Inventario de Libros</h1>
            <p className="text-muted-foreground mt-1">Catálogo completo de la biblioteca</p>
          </div>
          {user?.role === "ADMIN" && (
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Agregar Libro
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Libros</CardTitle>
              <Book className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{libros.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Ejemplares</CardTitle>
              <span className="text-2xl">📚</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {libros.reduce((sum, l) => sum + l.cantidad, 0)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Disponibles</CardTitle>
              <span className="text-2xl">✅</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {libros.filter(l => l.cantidad > 0).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Libros Table */}
        <Card>
          <CardHeader>
            <CardTitle>Catálogo de Libros</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={libros} 
              emptyMessage="No hay libros registrados" 
            />
          </CardContent>
        </Card>

        {/* Create Libro Modal - Only for ADMIN */}
        {user?.role === "ADMIN" && (
          <Modal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Agregar Libro"
            description="Registrar un nuevo libro en el inventario"
            onConfirm={handleCreateLibro}
            onCancel={() => {
              setIsModalOpen(false)
              setFormData({ titulo: "", autor: "", fecha_publicacion: "", categoria: "", cantidad: "1" })
            }}
            confirmText="Crear"
            loading={isCreating}
            confirmDisabled={!formData.titulo || !formData.autor}
          >
            <div className="space-y-4">
              <FormInput
                id="titulo"
                label="Título"
                type="text"
                value={formData.titulo}
                onChange={(value) => setFormData({ ...formData, titulo: value })}
                placeholder="Ej: Cien Años de Soledad"
                required
              />
              <FormInput
                id="autor"
                label="Autor"
                type="text"
                value={formData.autor}
                onChange={(value) => setFormData({ ...formData, autor: value })}
                placeholder="Ej: Gabriel García Márquez"
                required
              />
              <FormInput
                id="fecha_publicacion"
                label="Fecha de Publicación"
                type="date"
                value={formData.fecha_publicacion}
                onChange={(value) => setFormData({ ...formData, fecha_publicacion: value })}
              />
              <FormInput
                id="categoria"
                label="Categoría"
                type="text"
                value={formData.categoria}
                onChange={(value) => setFormData({ ...formData, categoria: value })}
                placeholder="Ej: Ficción, Historia, Ciencia"
              />
              <FormInput
                id="cantidad"
                label="Cantidad de Ejemplares"
                type="number"
                value={formData.cantidad}
                onChange={(value) => setFormData({ ...formData, cantidad: value })}
                placeholder="1"
                required
              />
            </div>
          </Modal>
        )}
      </div>
    </RoleGuard>
  )
}