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
import { Plus, FolderOpen } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface Maestro {
  id: string
  nombre: string
  saldo: number
  creado_por: string
  created_at: string
}

export default function MaestrosPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    saldo: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getMaestros()
      setMaestros(response.data)
    } catch (err: any) {
      console.error('Error loading maestros:', err)
      setError(err.message || "Error al cargar los maestros")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMaestro = async () => {
    if (!user) return

    try {
      setIsCreating(true)
      await api.createMaestro(
        formData.nombre,
        Number.parseFloat(formData.saldo)
      )

      // Recargar la lista de maestros
      await loadData()

      toast({
        title: "Maestro creado",
        description: `Se ha creado el maestro "${formData.nombre}" con saldo inicial de $${formData.saldo}`,
      })

      setIsModalOpen(false)
      setFormData({ nombre: "", saldo: "" })
    } catch (err: any) {
      console.error('Error creating maestro:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear el maestro",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: string) => <span className="font-mono text-sm">#{value.slice(0, 6)}</span>,
    },
    {
      key: "nombre",
      label: "Nombre",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "saldo",
      label: "Saldo",
      render: (value: number) => <span className="font-semibold text-foreground">${value.toLocaleString()}</span>,
    },
    {
      key: "creado_por",
      label: "Creado Por",
    },
    {
      key: "created_at",
      label: "Fecha de Creación",
      render: (value: string) =>
        new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
  ]

  if (loading) return <LoadingState message="Cargando maestros..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Maestros</h1>
            <p className="text-muted-foreground mt-1">Gestiona los diferentes maestros del sistema</p>
          </div>
          {user?.role === "ADMIN" && (
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Agregar Maestro
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Maestros</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{maestros.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
              <span className="text-2xl">💰</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${maestros.reduce((sum, m) => sum + m.saldo, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Saldo Promedio</CardTitle>
              <span className="text-2xl">📊</span>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                $
                {maestros.length > 0
                  ? Math.round(maestros.reduce((sum, m) => sum + m.saldo, 0) / maestros.length).toLocaleString()
                  : 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Maestros Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Maestros</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={maestros} emptyMessage="No hay maestros registrados" />
          </CardContent>
        </Card>

        {/* Create Maestro Modal - Only for ADMIN */}
        {user?.role === "ADMIN" && (
          <Modal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Agregar Maestro"
            description="Crear un nuevo maestro en el sistema"
            onConfirm={handleCreateMaestro}
            onCancel={() => {
              setIsModalOpen(false)
              setFormData({ nombre: "", saldo: "" })
            }}
            confirmText="Crear"
            loading={isCreating}
            confirmDisabled={!formData.nombre || !formData.saldo || Number.parseFloat(formData.saldo) < 0}
          >
            <div className="space-y-4">
              <FormInput
                id="nombre"
                label="Nombre del Maestro"
                type="text"
                value={formData.nombre}
                onChange={(value) => setFormData({ ...formData, nombre: value })}
                placeholder="Ej: Biblioteca Central"
                required
              />
              <FormInput
                id="saldo"
                label="Saldo Inicial"
                type="number"
                value={formData.saldo}
                onChange={(value) => setFormData({ ...formData, saldo: value })}
                placeholder="0.00"
                required
              />
              <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                <p>
                  <strong>Creador:</strong> {user.name}
                </p>
                <p className="text-xs mt-1">
                  El maestro será visible para todos los usuarios, pero solo los administradores pueden crear nuevos
                  maestros.
                </p>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </RoleGuard>
  )
}
