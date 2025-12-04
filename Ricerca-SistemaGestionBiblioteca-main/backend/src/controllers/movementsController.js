import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todos los movimientos (opcionalmente filtrados por maestro)
 * GET /api/movements?maestroId=xxx
 */
export const getMovements = async (req, res) => {
  try {
    const { maestroId } = req.query

    let query = supabase
      .from('movements')
      .select('*')
      .order('fecha', { ascending: false })

    if (maestroId) {
      query = query.eq('maestro_id', maestroId)
    }

    const { data, error } = await query

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener movimientos: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getMovements:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener un movimiento por ID
 * GET /api/movements/:id
 */
export const getMovementById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'Movimiento no encontrado' 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getMovementById:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Crear un nuevo movimiento
 * POST /api/movements
 */
export const createMovement = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { maestroId, maestroNombre, tipo, cantidad } = req.body

    // Si es una salida, verificar que haya saldo suficiente
    if (tipo === 'SALIDA') {
      const { data: maestro } = await supabase
        .from('maestros')
        .select('saldo')
        .eq('id', maestroId)
        .single()

      if (!maestro) {
        return res.status(404).json({ 
          error: 'Maestro no encontrado' 
        })
      }

      if (maestro.saldo < cantidad) {
        return res.status(400).json({ 
          error: `Saldo insuficiente. Saldo actual: ${maestro.saldo}` 
        })
      }
    }

    // Crear el movimiento (el trigger actualizará el saldo automáticamente)
    const { data, error } = await supabase
      .from('movements')
      .insert({
        maestro_id: maestroId,
        maestro_nombre: maestroNombre,
        tipo,
        cantidad,
        responsable: req.user.name,
        fecha: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al crear movimiento: ${error.message}` 
      })
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Movimiento creado exitosamente'
    })
  } catch (error) {
    console.error('Error en createMovement:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar un movimiento
 * DELETE /api/movements/:id
 */
export const deleteMovement = async (req, res) => {
  try {
    const { id } = req.params

    // Obtener el movimiento antes de eliminarlo
    const { data: movement } = await supabase
      .from('movements')
      .select('*')
      .eq('id', id)
      .single()

    if (!movement) {
      return res.status(404).json({ 
        error: 'Movimiento no encontrado' 
      })
    }

    // Eliminar el movimiento
    const { error } = await supabase
      .from('movements')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar movimiento: ${error.message}` 
      })
    }

    // Ajustar el saldo del maestro manualmente
    const adjustment = movement.tipo === 'ENTRADA' ? -movement.cantidad : movement.cantidad
    
    const { data: maestro } = await supabase
      .from('maestros')
      .select('saldo')
      .eq('id', movement.maestro_id)
      .single()

    if (maestro) {
      await supabase
        .from('maestros')
        .update({ saldo: maestro.saldo + adjustment })
        .eq('id', movement.maestro_id)
    }

    return res.status(200).json({
      success: true,
      message: 'Movimiento eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteMovement:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener saldos diarios de un maestro
 * GET /api/movements/daily-balances/:maestroId?days=30
 */
export const getDailyBalances = async (req, res) => {
  try {
    const { maestroId } = req.params
    const { days = 30 } = req.query

    const { data, error } = await supabase
      .rpc('get_daily_balances', {
        maestro_uuid: maestroId,
        days_back: parseInt(days)
      })

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener saldos diarios: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getDailyBalances:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener estadísticas de movimientos para un maestro
 * GET /api/movements/stats/:maestroId
 */
export const getMovementStats = async (req, res) => {
  try {
    const { maestroId } = req.params

    const { data, error } = await supabase
      .from('movements')
      .select('tipo, cantidad')
      .eq('maestro_id', maestroId)

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener estadísticas: ${error.message}` 
      })
    }

    const stats = data.reduce(
      (acc, mov) => {
        if (mov.tipo === 'ENTRADA') {
          acc.totalEntradas += mov.cantidad
          acc.countEntradas++
        } else {
          acc.totalSalidas += mov.cantidad
          acc.countSalidas++
        }
        return acc
      },
      {
        totalEntradas: 0,
        totalSalidas: 0,
        countEntradas: 0,
        countSalidas: 0
      }
    )

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        totalMovimientos: stats.countEntradas + stats.countSalidas,
        balanceNeto: stats.totalEntradas - stats.totalSalidas
      }
    })
  } catch (error) {
    console.error('Error en getMovementStats:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener movimientos recientes
 * GET /api/movements/recent?limit=10
 */
export const getRecentMovements = async (req, res) => {
  try {
    const { limit = 10 } = req.query

    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .order('fecha', { ascending: false })
      .limit(parseInt(limit))

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener movimientos recientes: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getRecentMovements:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}
