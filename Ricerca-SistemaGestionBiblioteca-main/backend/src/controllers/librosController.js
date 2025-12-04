import { supabase } from '../config/supabase.js'
import { validationResult } from 'express-validator'

/**
 * Obtener todos los libros
 * GET /api/libros
 */
export const getLibros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('libros')
      .select('*')
      .order('id', { ascending: false })

    if (error) {
      return res.status(500).json({ 
        error: `Error al obtener libros: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getLibros:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Obtener un libro por ID
 * GET /api/libros/:id
 */
export const getLibroById = async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('libros')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return res.status(404).json({ 
        error: 'Libro no encontrado' 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en getLibroById:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Crear un nuevo libro
 * POST /api/libros
 * Requiere rol ADMIN
 */
export const createLibro = async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Datos de entrada inválidos',
        details: errors.array() 
      })
    }

    const { titulo, autor, fecha_publicacion, categoria, cantidad } = req.body

    const { data, error } = await supabase
      .from('libros')
      .insert({
        titulo,
        autor,
        fecha_publicacion,
        categoria,
        cantidad: cantidad || 1
      })
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al crear libro: ${error.message}` 
      })
    }

    return res.status(201).json({
      success: true,
      data,
      message: 'Libro creado exitosamente'
    })
  } catch (error) {
    console.error('Error en createLibro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Actualizar un libro
 * PUT /api/libros/:id
 * Requiere rol ADMIN
 */
export const updateLibro = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('libros')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ 
        error: `Error al actualizar libro: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data,
      message: 'Libro actualizado exitosamente'
    })
  } catch (error) {
    console.error('Error en updateLibro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Eliminar un libro
 * DELETE /api/libros/:id
 * Requiere rol ADMIN
 */
export const deleteLibro = async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('libros')
      .delete()
      .eq('id', id)

    if (error) {
      return res.status(500).json({ 
        error: `Error al eliminar libro: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      message: 'Libro eliminado exitosamente'
    })
  } catch (error) {
    console.error('Error en deleteLibro:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}

/**
 * Buscar libros
 * GET /api/libros/search?q=término
 */
export const searchLibros = async (req, res) => {
  try {
    const { q } = req.query

    if (!q) {
      return res.status(400).json({ 
        error: 'Se requiere un término de búsqueda' 
      })
    }

    const { data, error } = await supabase
      .from('libros')
      .select('*')
      .or(`titulo.ilike.%${q}%,autor.ilike.%${q}%`)

    if (error) {
      return res.status(500).json({ 
        error: `Error al buscar libros: ${error.message}` 
      })
    }

    return res.status(200).json({
      success: true,
      data
    })
  } catch (error) {
    console.error('Error en searchLibros:', error)
    return res.status(500).json({ 
      error: 'Error interno del servidor' 
    })
  }
}