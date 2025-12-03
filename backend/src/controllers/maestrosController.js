import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todos los maestros
 * GET /api/maestros
 */
export const getMaestros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('maestros')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener maestros: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getMaestros:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener un maestro por ID
 * GET /api/maestros/:id
 */
export const getMaestroById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('maestros')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'Maestro no encontrado' 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getMaestroById:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Crear un nuevo maestro
 * POST /api/maestros
 * Requiere rol ADMIN
 */
export const createMaestro = async (req, res) => {
  try {
    // Validar errores de express-validator
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { nombre, saldoInicial } = req.body

    // Verificar si el nombre ya existe
    const { data: existing } = await supabase
      .from('maestros')
      .select('id')
      .eq('nombre', nombre.trim())
      .single()

    if (existing) {
      return res.status(409).json({ 
        error: 'Ya existe un maestro con ese nombre' 
      })
    }

    // Crear el maestro
    const { data, error } = await supabase
      .from('maestros')
      .insert({
        nombre: nombre.trim(),
        saldo: saldoInicial,
        creado_por: req.user.name
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al crear maestro: ${error.message}` 
      })
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Maestro creado exitosamente'
    })
  } catch (error) {
    console.error('Error en createMaestro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Actualizar un maestro
 * PUT /api/maestros/:id
 * Requiere rol ADMIN
 */
export const updateMaestro = async (req, res) => {
  try {
    const { id } = req.params
    const { nombre, saldo } = req.body

    // Construir objeto de actualización
    const updates = {}
    if (nombre !== undefined) updates.nombre = nombre.trim()
    if (saldo !== undefined) updates.saldo = saldo

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ 
        error: 'No se proporcionaron datos para actualizar' 
      })
    }

    const { data, error } = await supabase
      .from('maestros')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al actualizar maestro: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Maestro actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error en updateMaestro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar un maestro
 * DELETE /api/maestros/:id
 * Requiere rol ADMIN
 */
export const deleteMaestro = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('maestros')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar maestro: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Maestro eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteMaestro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener estadísticas de un maestro
 * GET /api/maestros/:id/stats
 */
export const getMaestroStats = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('v_maestros_summary')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'Maestro no encontrado' 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getMaestroStats:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}
