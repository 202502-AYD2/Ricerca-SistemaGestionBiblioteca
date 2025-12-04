import { supabase } from "../config/supabase.js";

/**
 * Obtener todos los libros
 */
export const getLibros = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtener libro por ID
 */
export const getLibroById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("libros")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return res.status(404).json({ error: "Libro no encontrado" });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Crear libro
 */
export const createLibro = async (req, res) => {
  try {
    const { titulo, autor, categoria } = req.body;

    const { data, error } = await supabase
      .from("libros")
      .insert([{ titulo, autor, categoria }])
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Actualizar libro
 */
export const updateLibro = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("libros")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Eliminar libro
 */
export const deleteLibro = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("libros")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true, message: "Libro eliminado" });
  } catch (err) {
    res.status(500).json({ error: "Error interno del servidor" });
  }
};
