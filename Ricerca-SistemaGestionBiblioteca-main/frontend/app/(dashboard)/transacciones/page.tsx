"use client"

import React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { RoleGuard } from "@/components/role-guard"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { FormInput } from "@/components/form-input"
import { FormSelect } from "@/components/form-select"
import { BalanceChart } from "@/components/balance-chart"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, TrendingUp, TrendingDown } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface Maestro {
  id: string
  nombre: string
  saldo: number
}

interface Movement {
  id: string
  maestro_id: string
  maestro_nombre: string
  tipo: "ENTRADA" | "SALIDA"
  cantidad: number
  responsable: string
  fecha: string
}

export default function TransaccionesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [maestros, setMaestros] = useState<Maestro[]>([])
  const [movements, setMovements] = useState<Movement[]>([])
  const [selectedMaestro, setSelectedMaestro] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    tipo: "ENTRADA" as "ENTRADA" | "SALIDA",
    cantidad: "",
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const maestrosResponse = await api.getMaestros()
      const movementsResponse = await api.getMovements()
      setMaestros(maestrosResponse.data)
      setMovements(movementsResponse.data)
      if (maestrosResponse.data.length > 0 && !selectedMaestro) {
        setSelectedMaestro(maestrosResponse.data[0].id)
      }
    } catch (err: any) {
      console.error('Error loading data:', err)
      setError(err.message || "Error al cargar los datos")
    } finally {
      setLoading(false)
    }
  }

  const filteredMovements = selectedMaestro ? movements.filter((m) => m.maestro_id === selectedMaestro) : movements

  const selectedMaestroData = maestros.find((m) => m.id === selectedMaestro)

  // Calculate chart data
  const chartData = React.useMemo(() => {
    if (!selectedMaestro) return []

    const sorted = [...filteredMovements].sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

    let runningBalance = 0
    return sorted.map((movement) => {
      runningBalance += movement.tipo === "ENTRADA" ? movement.cantidad : -movement.cantidad
      return {
        fecha: new Date(movement.fecha).toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }),
        saldo: runningBalance,
      }
    })
  }, [selectedMaestro, filteredMovements])

  const handleCreateMovement = async () => {
    if (!selectedMaestroData || !user) return

    try {
      setIsCreating(true)
      await api.createMovement(
        selectedMaestro,
        selectedMaestroData.nombre,
        formData.tipo,
        Number.parseFloat(formData.cantidad)
      )

      // Recargar datos
      await loadData()

      toast({
        title: "Movimiento creado",
        description: `Se ha registrado un ${formData.tipo.toLowerCase()} de $${formData.cantidad}`,
      })

      setIsModalOpen(false)
      setFormData({ tipo: "ENTRADA", cantidad: "" })
    } catch (err: any) {
      console.error('Error creating movement:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo crear el movimiento",
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
      key: "fecha",
      label: "Fecha",
      render: (value: string) =>
        new Date(value).toLocaleDateString("es-ES", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      key: "tipo",
      label: "Tipo",
      render: (value: string) => (
        <Badge variant={value === "ENTRADA" ? "default" : "secondary"} className="gap-1">
          {value === "ENTRADA" ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {value}
        </Badge>
      ),
    },
    {
      key: "cantidad",
      label: "Cantidad",
      render: (value: number, row: Movement) => (
        <span className={row.tipo === "ENTRADA" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
          {row.tipo === "ENTRADA" ? "+" : "-"}${value.toLocaleString()}
        </span>
      ),
    },
    {
      key: "responsable",
      label: "Responsable",
    },
  ]

  if (loading) return <LoadingState message="Cargando transacciones..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN", "USER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Transacciones</h1>
            <p className="text-muted-foreground mt-1">Gestiona los movimientos de entrada y salida</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            Agregar Movimiento
          </Button>
        </div>

        {/* Maestro Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Seleccionar Maestro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <FormSelect
                  id="maestro"
                  label="Maestro"
                  value={selectedMaestro}
                  onChange={setSelectedMaestro}
                  options={maestros.map((m) => ({ value: m.id, label: m.nombre }))}
                />
              </div>
              {selectedMaestroData && (
                <div className="flex items-baseline gap-2 pt-8">
                  <span className="text-sm text-muted-foreground">Saldo actual:</span>
                  <span className="text-2xl font-bold text-foreground">
                    ${selectedMaestroData.saldo.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chart */}
        {chartData.length > 0 && <BalanceChart data={chartData} />}

        {/* Movements Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={filteredMovements} emptyMessage="No hay movimientos registrados" />
          </CardContent>
        </Card>

        {/* Create Movement Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Agregar Movimiento"
          description={`Registrar movimiento para ${selectedMaestroData?.nombre || "maestro seleccionado"}`}
          onConfirm={handleCreateMovement}
          onCancel={() => {
            setIsModalOpen(false)
            setFormData({ tipo: "ENTRADA", cantidad: "" })
          }}
          confirmText="Crear"
          loading={isCreating}
          confirmDisabled={!formData.cantidad || Number.parseFloat(formData.cantidad) <= 0}
        >
          <div className="space-y-4">
            <FormSelect
              id="tipo"
              label="Tipo de Movimiento"
              value={formData.tipo}
              onChange={(value) => setFormData({ ...formData, tipo: value as "ENTRADA" | "SALIDA" })}
              options={[
                { value: "ENTRADA", label: "Entrada" },
                { value: "SALIDA", label: "Salida" },
              ]}
              required
            />
            <FormInput
              id="cantidad"
              label="Cantidad"
              type="number"
              value={formData.cantidad}
              onChange={(value) => setFormData({ ...formData, cantidad: value })}
              placeholder="0.00"
              required
            />
            <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <p>
                <strong>Maestro:</strong> {selectedMaestroData?.nombre}
              </p>
              <p>
                <strong>Responsable:</strong> {user?.name}
              </p>
            </div>
          </div>
        </Modal>
      </div>
    </RoleGuard>
  )
}
