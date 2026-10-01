// Acceso a datos de deudas (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function listDeudas() {
  const { data, error } = await supabase
    .from("deudas")
    .select("*")
    .order('fecha', { ascending: false })

  if (error) throw error;

  return data.map((d) => ({
    ID: String(d.id),
    DNI: d.dni || "",
    Nombre: d.nombre || "",
    Tipo: d.tipo || "",
    Monto: String(d.monto || ""),
    Motivo: d.motivo || "",
    Fecha: d.fecha ? dayjs(d.fecha).format("DD/MM/YYYY") : "",
    Estado: d.estado || "",
    Responsable: d.responsable || "",
  }));
}

export async function insertDeuda(deuda) {
  const { data, error } = await supabase
    .from("deudas")
    .insert([
      {
        dni: deuda.DNI,
        nombre: deuda.Nombre,
        tipo: deuda.Tipo,
        monto: Number(deuda.Monto || 0),
        motivo: deuda.Motivo,
        fecha: deuda.Fecha ? dayjs(deuda.Fecha, ["D/M/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD") : null,
        estado: deuda.Estado,
        responsable: deuda.Responsable,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    ID: String(data.id),
    DNI: data.dni || "",
    Nombre: data.nombre || "",
    Tipo: data.tipo || "",
    Monto: String(data.monto || ""),
    Motivo: data.motivo || "",
    Fecha: data.fecha ? dayjs(data.fecha).format("D/M/YYYY") : "",
    Estado: data.estado || "",
    Responsable: data.responsable || "",
  };
}

export async function updateDeudaByID(id, nuevosDatos) {
  const patch = {};

  if ("DNI" in nuevosDatos) patch.dni = nuevosDatos.DNI;
  if ("Nombre" in nuevosDatos) patch.nombre = nuevosDatos.Nombre;
  if ("Tipo" in nuevosDatos) patch.tipo = nuevosDatos.Tipo;
  if ("Monto" in nuevosDatos) patch.monto = Number(nuevosDatos.Monto || 0);
  if ("Motivo" in nuevosDatos) patch.motivo = nuevosDatos.Motivo;
  if ("Fecha" in nuevosDatos) {
    patch.fecha = nuevosDatos.Fecha
      ? dayjs(nuevosDatos.Fecha, ["D/M/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD")
      : null;
  }
  if ("Estado" in nuevosDatos) patch.estado = nuevosDatos.Estado;
  if ("Responsable" in nuevosDatos) patch.responsable = nuevosDatos.Responsable;

  const { data, error } = await supabase
    .from("deudas")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    if (error.code === "PGRST116") return false; // no encontrado
    throw error;
  }

  return !!data;
}

export async function removeDeudaByID(id) {
  const { error } = await supabase
    .from("deudas")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}


// Planes 
