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
import { Plus, AlertTriangle, DollarSign, CheckCircle } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface Prestamo {
  id: number
  libros?: { titulo: string }
  users?: { name: string; email: string }
}

interface Multa {
  id: number
  prestamo_id: number
  monto: number
  pagada: boolean
  fecha_multa: string
  prestamos?: {
    libros?: { titulo: string; autor: string }
    users?: { name: string; email: string }
  }
}

export default function MultasPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [multas, setMultas] = useState<Multa[]>([])
  const [prestamos, setPrestamos] = useState<Prestamo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [stats, setStats] = useState<any>(null)

  // Form state
  const [formData, setFormData] = useState({
    prestamo_id: "",
    monto: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [multasRes, prestamosRes, statsRes] = await Promise.all([
        api.getMultas(),
        api.getPrestamos(),
        api.getMultasStats()
      ])
      
      setMultas(multasRes.data)
      // Solo préstamos no devueltos para crear multas
      setPrestamos(prestamosRes.data.filter((p: any) => !p.devuelto))
      setStats(statsRes.data)
    } catch (err: any) {
      console.error('Error loading multas:', err)
      setError(err.message || "Error al cargar las multas")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateMulta = async () => {
    try {
      setIsCreating(true)
      
      const fechaMulta = new Date().toISOString().split('T')[0]
      
      await api.createMulta({
        prestamo_id: parseInt(formData.prestamo_id),
        monto: parseFloat(formData.monto),
        fecha_multa: fechaMulta
      })

      await loadData()

      toast({
        title: "Multa creada",
        description: `Multa de $${formData.monto} creada exitosamente`,
      })

      setIsModalOpen(false)
      setFormData({ prestamo_id: "", monto: "" })
    } catch (err: any) {
      console.error('Error creating multa:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear la multa",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handlePagar = async (id: number, monto: number) => {
    if (!confirm(`¿Marcar como pagada la multa de $${monto}?`)) return

    try {
      await api.pagarMulta(id)
      await loadData()
      toast({
        title: "Multa pagada",
        description: `La multa de $${monto} ha sido marcada como pagada`,
      })
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "No se pudo pagar la multa",
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
      key: "prestamos",
      label: "Usuario",
      render: (prestamo: any) => (
        <div>
          <div className="font-medium">{prestamo?.users?.name || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{prestamo?.users?.email || ''}</div>
        </div>
      ),
    },
    {
      key: "prestamos",
      label: "Libro",
      render: (prestamo: any) => (
        <div>
          <div className="font-medium">{prestamo?.libros?.titulo || 'N/A'}</div>
          <div className="text-xs text-muted-foreground">{prestamo?.libros?.autor || ''}</div>
        </div>
      ),
    },
    {
      key: "monto",
      label: "Monto",
      render: (value: number) => (
        <span className="font-semibold text-red-600">
          ${parseFloat(value.toString()).toFixed(2)}
        </span>
      ),
    },
    {
      key: "fecha_multa",
      label: "Fecha",
      render: (value: string) =>
        new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "pagada",
      label: "Estado",
      render: (value: boolean) => (
        <Badge variant={value ? "default" : "secondary"} className="gap-1">
          {value ? <CheckCircle className="h-3 w-3" /> : <AlertTriangle className="h-3 w-3" />}
          {value ? 'Pagada' : 'Pendiente'}
        </Badge>
      ),
    },
    ...(user?.role === "ADMIN" ? [{
      key: "actions",
      label: "Acciones",
      render: (_: any, row: Multa) => (
        !row.pagada && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handlePagar(row.id, row.monto)}
            className="gap-2"
          >
            <DollarSign className="h-4 w-4" />
            Marcar Pagada
          </Button>
        )
      ),
    }] : []),
  ]

  if (loading) return <LoadingState message="Cargando multas..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Multas</h1>
            <p className="text-muted-foreground mt-1">Gestión de multas por retrasos y daños</p>
          </div>
          {user?.role === "ADMIN" && (
            <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nueva Multa
            </Button>
          )}
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Multas</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{stats.pendientes}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.monto_pendiente.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pagadas</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{stats.pagadas}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  ${stats.monto_recaudado.toFixed(2)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monto Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${stats.monto_total.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Multas Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Multas</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={columns} 
              data={multas} 
              emptyMessage="No hay multas registradas" 
            />
          </CardContent>
        </Card>

        {/* Create Multa Modal - Only for ADMIN */}
        {user?.role === "ADMIN" && (
          <Modal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            title="Nueva Multa"
            description="Registrar una nueva multa"
            onConfirm={handleCreateMulta}
            onCancel={() => {
              setIsModalOpen(false)
              setFormData({ prestamo_id: "", monto: "" })
            }}
            confirmText="Crear Multa"
            loading={isCreating}
            confirmDisabled={!formData.prestamo_id || !formData.monto}
          >
            <div className="space-y-4">
              <FormSelect
                id="prestamo"
                label="Préstamo"
                value={formData.prestamo_id}
                onChange={(value) => setFormData({ ...formData, prestamo_id: value })}
                options={prestamos.map((prestamo) => ({ 
                  value: prestamo.id.toString(), 
                  label: `${prestamo.libros?.titulo || 'N/A'} - ${prestamo.users?.name || 'N/A'}` 
                }))}
                required
              />

              <FormInput
                id="monto"
                label="Monto de la Multa"
                type="number"
                value={formData.monto}
                onChange={(value) => setFormData({ ...formData, monto: value })}
                placeholder="0.00"
                required
                min="0"
                step="0.01"
              />

              <div className="text-xs text-muted-foreground bg-yellow-50 dark:bg-yellow-950 p-3 rounded-lg">
                <strong>Nota:</strong> La multa se creará con fecha de hoy y estará pendiente de pago.
              </div>
            </div>
          </Modal>
        )}
      </div>
    </RoleGuard>
  )
}