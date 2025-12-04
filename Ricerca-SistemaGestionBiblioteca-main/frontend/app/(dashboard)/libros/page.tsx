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

export default function InventarioPage() {
  // Datos de prueba — luego los traerás del backend
  const libros = [
    { id: 1, titulo: "Cien Años de Soledad", autor: "Gabriel García Márquez", cantidad: 12 },
    { id: 2, titulo: "1984", autor: "George Orwell", cantidad: 5 },
    { id: 3, titulo: "El Principito", autor: "Antoine de Saint-Exupéry", cantidad: 7 },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventario de Libros</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead className="text-right">Cantidad</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {libros.map((libro) => (
              <TableRow key={libro.id}>
                <TableCell>{libro.titulo}</TableCell>
                <TableCell>{libro.autor}</TableCell>
                <TableCell className="text-right">{libro.cantidad}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
