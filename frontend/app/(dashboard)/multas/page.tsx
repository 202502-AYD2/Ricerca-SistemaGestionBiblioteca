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

export default function MultasPage() {
  const multas = [
    { id: 1, usuario: "Ana López", monto: 15, motivo: "Libro atrasado" },
    { id: 2, usuario: "Carlos Ruiz", monto: 20, motivo: "Libro dañado" },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Multas</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuario</TableHead>
              <TableHead>Motivo</TableHead>
              <TableHead className="text-right">Monto ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {multas.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.usuario}</TableCell>
                <TableCell>{m.motivo}</TableCell>
                <TableCell className="text-right">{m.monto}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
