import { supabase } from "../config/supabase.js";

/**
 * Obtener todas las multas
 */
export const getMultas = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("multas")
      .select("*")
      .order("id", { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Obtener multa por ID
 */
export const getMultaById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("multas")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Multa no encontrada" });
    }

    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Crear una nueva multa
 */
export const createMulta = async (req, res) => {
  try {
    const { prestamo_id, monto } = req.body;

    if (!prestamo_id || !monto) {
      return res.status(400).json({ error: "prestamo_id y monto son obligatorios" });
    }

    const { data, error } = await supabase
      .from("multas")
      .insert({
        prestamo_id,
        monto,
        pagada: false
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.status(201).json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Actualizar multa
 */
export const updateMulta = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("multas")
      .update(req.body)
      .eq("id", id)
      .select()
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "No se pudo actualizar la multa" });
    }

    return res.json({ success: true, data });
  } catch (e) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};

/**
 * Eliminar multa
 */
export const deleteMulta = async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from("multas")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    return res.json({ success: true, message: "Multa eliminada" });
  } catch (e) {
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
