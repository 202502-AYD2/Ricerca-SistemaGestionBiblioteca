import { supabase } from "../config/supabase.js";

/** Obtener todos los préstamos */
export const getPrestamos = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("prestamos")
      .select("*")
      .order("id", { ascending: false });

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** Obtener préstamo por ID */
export const getPrestamoById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("prestamos")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return res.status(404).json({ error: "Préstamo no encontrado" });

    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** Crear préstamo */
export const createPrestamo = async (req, res) => {
  try {
    const { libro_id, usuario_id } = req.body;

    if (!libro_id || !usuario_id)
      return res.status(400).json({ error: "libro_id y usuario_id son obligatorios" });

    const { data, error } = await supabase
      .from("prestamos")
      .insert({
        libro_id,
        usuario_id,
        devuelto: false
      })
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });

    return res.status(201).json({ success: true, data });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** Actualizar préstamo */
export const updatePrestamo = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("prestamos")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();

    if (error) return res.status(404).json({ error: "No se pudo actualizar" });

    return res.json({ success: true, data });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/** Eliminar préstamo */
export const deletePrestamo = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("prestamos")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });

    return res.json({ success: true, message: "Préstamo eliminado" });
  } catch {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};