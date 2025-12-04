"use client"

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function PrestamosPage() {
  const prestamos = [
    { id: 1, usuario: "Ana López", libro: "El Principito", fecha: "2025-02-10" },
    { id: 2, usuario: "Carlos Ruiz", libro: "1984", fecha: "2025-02-14" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Préstamos Registrados</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Libro</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prestamos.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{p.usuario}</TableCell>
                <TableCell>{p.libro}</TableCell>
                <TableCell>{p.fecha}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
