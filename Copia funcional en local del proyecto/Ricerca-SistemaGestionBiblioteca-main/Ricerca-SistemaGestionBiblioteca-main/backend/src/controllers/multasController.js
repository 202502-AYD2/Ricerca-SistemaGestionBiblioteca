import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todas las multas
 * GET /api/multas
 */
export const getMultas = async (req, res) => {
  try {
    const { pagada, usuario_id } = req.query

    let query = supabase
      .from('multas')
      .select('*')
      .order('id', { ascending: false })

    if (pagada !== undefined) {
      query = query.eq('pagada', pagada === 'true')
    }

    const { data: multas, error } = await query

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener multas: ${error.message}` 
      })
    }

    // Obtener datos relacionados manualmente
    const multasConDatos = await Promise.all(
      multas.map(async (multa) => {
        // Obtener préstamo
        const { data: prestamo } = await supabase
          .from('prestamos')
          .select('id, libro_id, usuario_id')
          .eq('id', multa.prestamo_id)
          .single()

        if (prestamo) {
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
            ...multa,
            prestamos: {
              libros: libro,
              users: usuario
            }
          }
        }

        return multa
      })
    )

    return res.status(200).json({
      success: true,
      data: multasConDatos
    })
  } catch (error) {
    console.error('Error en getMultas:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Crear una nueva multa
 * POST /api/multas
 * Requiere rol ADMIN
 */
export const createMulta = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { prestamo_id, monto, fecha_multa } = req.body

    // Verificar que el préstamo existe
    const { data: prestamo, error: prestamoError } = await supabase
      .from('prestamos')
      .select('id, devuelto')
      .eq('id', prestamo_id)
      .single()

    if (prestamoError || !prestamo) {
      return res.status(404).json({ 
        error: 'Préstamo no encontrado' 
      })
    }

    const { data, error } = await supabase
      .from('multas')
      .insert({
        prestamo_id,
        monto,
        pagada: false,
        fecha_multa: fecha_multa || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al crear multa: ${error.message}` 
      })
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Multa creada exitosamente'
    })
  } catch (error) {
    console.error('Error en createMulta:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Pagar una multa
 * PUT /api/multas/:id/pagar
 */
export const pagarMulta = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('multas')
      .update({ pagada: true })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al pagar multa: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Multa pagada exitosamente'
    })
  } catch (error) {
    console.error('Error en pagarMulta:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener estadísticas de multas
 * GET /api/multas/stats
 */
export const getMultasStats = async (req, res) => {
  try {
    const { data: multas, error } = await supabase
      .from('multas')
      .select('pagada, monto')

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener estadísticas: ${error.message}` 
      })
    }

    const stats = {
      total: multas.length,
      pendientes: multas.filter(m => !m.pagada).length,
      pagadas: multas.filter(m => m.pagada).length,
      monto_total: multas.reduce((sum, m) => sum + parseFloat(m.monto), 0),
      monto_pendiente: multas
        .filter(m => !m.pagada)
        .reduce((sum, m) => sum + parseFloat(m.monto), 0),
      monto_recaudado: multas
        .filter(m => m.pagada)
        .reduce((sum, m) => sum + parseFloat(m.monto), 0)
    }

    return res.status(200).json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Error en getMultasStats:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Generar multas automáticas por préstamos vencidos
 * POST /api/multas/generar-automaticas
 * Requiere rol ADMIN
 */
export const generarMultasAutomaticas = async (req, res) => {
  try {
    const { monto_por_dia = 5 } = req.body
    const hoy = new Date().toISOString().split('T')[0]

    // Obtener préstamos vencidos sin devolver
    const { data: prestamosVencidos, error: prestamosError } = await supabase
      .from('prestamos')
      .select('*')
      .eq('devuelto', false)
      .lt('fecha_devolucion', hoy)

    if (prestamosError) {
      return res.status(500).json({ 
        error: `Error al obtener préstamos vencidos: ${prestamosError.message}` 
      })
    }

    const multasCreadas = []

    for (const prestamo of prestamosVencidos) {
      // Verificar si ya tiene multa
      const { data: multaExistente } = await supabase
        .from('multas')
        .select('id')
        .eq('prestamo_id', prestamo.id)
        .single()

      if (!multaExistente) {
        // Calcular días de retraso
        const diasRetraso = Math.floor(
          (new Date() - new Date(prestamo.fecha_devolucion)) / (1000 * 60 * 60 * 24)
        )

        const monto = diasRetraso * monto_por_dia

        const { data: nuevaMulta } = await supabase
          .from('multas')
          .insert({
            prestamo_id: prestamo.id,
            monto,
            pagada: false,
            fecha_multa: hoy
          })
          .select()
          .single()

        if (nuevaMulta) {
          multasCreadas.push(nuevaMulta)
        }
      }
    }

    return res.status(200).json({
      success: true,
      data: multasCreadas,
      message: `Se generaron ${multasCreadas.length} multas automáticas`
    })
  } catch (error) {
    console.error('Error en generarMultasAutomaticas:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar una multa
 * DELETE /api/multas/:id
 * Requiere rol ADMIN
 */
export const deleteMulta = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('multas')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar multa: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Multa eliminada exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteMulta:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}