import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todos los préstamos
 * GET /api/prestamos
 */
export const getPrestamos = async (req, res) => {
  try {
    const { devuelto } = req.query

    // Primero obtener préstamos
    let query = supabase
      .from('prestamos')
      .select('*')
      .order('id', { ascending: false })

    if (devuelto !== undefined) {
      query = query.eq('devuelto', devuelto === 'true')
    }

    const { data: prestamos, error } = await query

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener préstamos: ${error.message}` 
      })
    }

    // Luego obtener datos relacionados manualmente
    const prestamosConDatos = await Promise.all(
      prestamos.map(async (prestamo) => {
        // Obtener libro
        const { data: libro } = await supabase
          .from('libros')
          .select('titulo, autor')
          .eq('id', prestamo.libro_id)
          .single()

        // Obtener usuario
        const { data: usuario } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', prestamo.usuario_id)
          .single()

        return {
          ...prestamo,
          libros: libro,
          users: usuario
        }
      })
    )

    return res.status(200).json({
      success: true,
      data: prestamosConDatos
    })
  } catch (error) {
    console.error('Error en getPrestamos:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Crear un nuevo préstamo
 * POST /api/prestamos
 */
export const createPrestamo = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { libro_id, usuario_id, fecha_prestamo, fecha_devolucion } = req.body

    // Verificar que el libro existe
    const { data: libro, error: libroError } = await supabase
      .from('libros')
      .select('titulo, cantidad')
      .eq('id', libro_id)
      .single()

    if (libroError || !libro) {
      return res.status(404).json({ 
        error: 'Libro no encontrado' 
      })
    }

    if (libro.cantidad <= 0) {
      return res.status(400).json({ 
        error: `No hay ejemplares disponibles de "${libro.titulo}"` 
      })
    }

    // Verificar que el usuario existe
    const { data: usuario, error: usuarioError } = await supabase
      .from('users')
      .select('name')
      .eq('id', usuario_id)
      .single()

    if (usuarioError || !usuario) {
      return res.status(404).json({ 
        error: 'Usuario no encontrado' 
      })
    }

    // Crear el préstamo
    const { data, error } = await supabase
      .from('prestamos')
      .insert({
        libro_id,
        usuario_id,
        fecha_prestamo: fecha_prestamo || new Date().toISOString().split('T')[0],
        fecha_devolucion,
        devuelto: false
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al crear préstamo: ${error.message}` 
      })
    }

    // Actualizar cantidad disponible del libro (restar 1)
    await supabase
      .from('libros')
      .update({ cantidad: libro.cantidad - 1 })
      .eq('id', libro_id)

    return res.status(201).json({
      success: true,
      data,
      message: 'Préstamo creado exitosamente'
    })
  } catch (error) {
    console.error('Error en createPrestamo:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Devolver un libro (marcar préstamo como devuelto)
 * PUT /api/prestamos/:id/devolver
 */
export const devolverPrestamo = async (req, res) => {
  try {
    const { id } = req.params

    // Obtener el préstamo
    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .select('*, libros (cantidad)')
      .eq('id', id)
      .single()

    if (prestamoError || !prestamo) {
      return res.status(404).json({ 
        error: 'Préstamo no encontrado' 
      })
    }

    if (prestamo.devuelto) {
      return res.status(400).json({ 
        error: 'Este préstamo ya fue devuelto' 
      })
    }

    // Marcar como devuelto
    const { data, error } = await supabase
      .from('prestamos')
      .update({ devuelto: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al devolver préstamo: ${error.message}` 
      })
    }

    // Incrementar cantidad disponible del libro
    await supabase
      .from('libros')
      .update({ 
        cantidad: prestamo.libros.cantidad + 1 
      })
      .eq('id', prestamo.libro_id)

    return res.status(200).json({
      success: true,
      data,
      message: 'Libro devuelto exitosamente'
    })
  } catch (error) {
    console.error('Error en devolverPrestamo:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener préstamos vencidos (no devueltos y fecha pasada)
 * GET /api/prestamos/vencidos
 */
export const getPrestamosVencidos = async (req, res) => {
  try {
    const hoy = new Date().toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('prestamos')
      .select(`
        *,
        libros (titulo, autor),
        users (name, email)
      `)
      .eq('devuelto', false)
      .lt('fecha_devolucion', hoy)
      .order('fecha_devolucion', { ascending: true })

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener préstamos vencidos: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getPrestamosVencidos:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar un préstamo
 * DELETE /api/prestamos/:id
 * Requiere rol ADMIN
 */
export const deletePrestamo = async (req, res) => {
  try {
    const { id } = req.params

    // Obtener el préstamo antes de eliminar
    const { data: prestamo } = await supabase
      .from('prestamos')
      .select('libro_id, devuelto, libros (cantidad)')
      .eq('id', id)
      .single()

    // Si no estaba devuelto, devolver el libro al inventario
    if (prestamo && !prestamo.devuelto) {
      await supabase
        .from('libros')
        .update({ cantidad: prestamo.libros.cantidad + 1 })
        .eq('id', prestamo.libro_id)
    }

    const { error } = await supabase
      .from('prestamos')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar préstamo: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Préstamo eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error en deletePrestamo:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}