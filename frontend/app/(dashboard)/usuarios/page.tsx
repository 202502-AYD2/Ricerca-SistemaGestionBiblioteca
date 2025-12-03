"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import { RoleGuard } from "@/components/role-guard"
import { DataTable } from "@/components/data-table"
import { Modal } from "@/components/modal"
import { FormSelect } from "@/components/form-select"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, UsersIcon, Shield, UserCircle } from "lucide-react"
import { api } from "@/lib/api/client"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  name: string
  role: "ADMIN" | "USER"
  created_at: string
}

export default function UsuariosPage() {
  const { user: currentUser } = useAuth()
  const { toast } = useToast()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState<"ADMIN" | "USER">("USER")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getUsers()
      setUsers(response.data as User[])
    } catch (err: any) {
      console.error('Error loading users:', err)
      setError(err.message || "Error al cargar los usuarios")
    } finally {
      setLoading(false)
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setNewRole(user.role)
    setIsModalOpen(true)
  }

  const handleUpdateRole = async () => {
    if (!selectedUser) return

    try {
      setIsUpdating(true)
      await api.updateUserRole(selectedUser.id, newRole)

      // Recargar datos
      await loadData()

      toast({
        title: "Usuario actualizado",
        description: `El rol de ${selectedUser.name} ha sido cambiado a ${newRole}`,
      })

      setIsModalOpen(false)
      setSelectedUser(null)
    } catch (err: any) {
      console.error('Error updating user:', err)
      toast({
        title: "Error",
        description: err.message || "No se pudo actualizar el usuario",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const columns = [
    {
      key: "id",
      label: "ID",
      render: (value: string) => <span className="font-mono text-sm">#{value.slice(0, 6)}</span>,
    },
    {
      key: "name",
      label: "Nombre",
      render: (value: string) => (
        <div className="flex items-center gap-2">
          <UserCircle className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">{value}</span>
        </div>
      ),
    },
    {
      key: "email",
      label: "Correo Electrónico",
      render: (value: string) => <span className="text-muted-foreground">{value}</span>,
    },
    {
      key: "role",
      label: "Rol",
      render: (value: string) => (
        <Badge variant={value === "ADMIN" ? "default" : "secondary"} className="gap-1">
          {value === "ADMIN" ? <Shield className="h-3 w-3" /> : <UserCircle className="h-3 w-3" />}
          {value}
        </Badge>
      ),
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
    {
      key: "actions",
      label: "Acciones",
      render: (_: any, row: User) => (
        <Button variant="outline" size="sm" onClick={() => handleEditUser(row)} className="gap-2">
          <Edit className="h-4 w-4" />
          Editar
        </Button>
      ),
    },
  ]

  const adminCount = users.filter((u) => u.role === "ADMIN").length
  const userCount = users.filter((u) => u.role === "USER").length

  if (loading) return <LoadingState message="Cargando usuarios..." />
  if (error) return <ErrorState message={error} onRetry={loadData} />

  return (
    <RoleGuard allowedRoles={["ADMIN"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Usuarios</h1>
            <p className="text-muted-foreground mt-1">Gestiona los usuarios y sus roles en el sistema</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usuarios</CardTitle>
              <UsersIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{adminCount}</div>
              <p className="text-xs text-muted-foreground">
                {((adminCount / users.length) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Usuarios Regulares</CardTitle>
              <UserCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userCount}</div>
              <p className="text-xs text-muted-foreground">
                {((userCount / users.length) * 100).toFixed(0)}% del total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Usuarios</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={users} emptyMessage="No hay usuarios registrados" />
          </CardContent>
        </Card>

        {/* Edit User Modal */}
        <Modal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          title="Editar Usuario"
          description={`Cambiar el rol de ${selectedUser?.name || "usuario"}`}
          onConfirm={handleUpdateRole}
          onCancel={() => {
            setIsModalOpen(false)
            setSelectedUser(null)
          }}
          confirmText="Guardar"
          loading={isUpdating}
          confirmDisabled={!selectedUser || newRole === selectedUser.role}
        >
          {selectedUser && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <UserCircle className="h-10 w-10 text-muted-foreground" />
                  <div>
                    <p className="font-semibold">{selectedUser.name}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                </div>
                <div className="text-sm">
                  <p className="text-muted-foreground">
                    Rol actual:{" "}
                    <Badge variant={selectedUser.role === "ADMIN" ? "default" : "secondary"}>{selectedUser.role}</Badge>
                  </p>
                </div>
              </div>

              <FormSelect
                id="role"
                label="Nuevo Rol"
                value={newRole}
                onChange={(value) => setNewRole(value as "ADMIN" | "USER")}
                options={[
                  { value: "ADMIN", label: "Administrador - Acceso completo al sistema" },
                  { value: "USER", label: "Usuario - Acceso limitado" },
                ]}
                required
              />

              <div className="text-sm text-muted-foreground bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                <p className="font-semibold text-amber-900 dark:text-amber-100 mb-1">⚠️ Importante</p>
                <p className="text-amber-800 dark:text-amber-200">
                  Los administradores tienen acceso completo a todas las funciones, incluida la gestión de usuarios y la
                  creación de maestros.
                </p>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </RoleGuard>
  )
}
