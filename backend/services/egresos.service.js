// Acceso a datos de egresos (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function listEgresos() {
  const { data, error } = await supabase
    .from("egresos")
    .select("*")
    .order("fecha", { ascending: false })

  if (error) throw error

  return data.map((e) => ({
    ID: String(e.id),
    Fecha: e.fecha ? dayjs(e.fecha).format("DD/MM/YYYY") : "",
    Motivo: e.motivo || "",
    Monto: String(e.monto ?? "0"),
    Responsable: e.responsable || "",
    Tipo: e.tipo || "",
  }))
}

export async function insertEgreso(data) {
  const { data: inserted, error } = await supabase
    .from("egresos")
    .insert([
      {
        fecha: dayjs(data.Fecha, ["D/M/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).format("YYYY-MM-DD"),
        motivo: data.Motivo || "",
        monto: Number(data.Monto) || 0,
        responsable: data.Responsable || "",
        tipo: data.Tipo || "",
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    ID: String(inserted.id),
    Fecha: dayjs(inserted.fecha).format("DD/MM/YYYY"),
    Motivo: inserted.motivo,
    Monto: String(inserted.monto),
    Responsable: inserted.responsable,
    Tipo: inserted.tipo,
  }
}

export async function removeEgresoByID(id) {
  const { error } = await supabase.from("egresos").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function listEgresosByMesYAnio(anio, mes) {
  const { data, error } = await supabase
    .from("egresos")
    .select("*")
    .gte("fecha", dayjs(`${anio}-${mes}-01`).startOf("month").format("YYYY-MM-DD"))
    .lte("fecha", dayjs(`${anio}-${mes}-01`).endOf("month").format("YYYY-MM-DD"))

  if (error) throw error

  return data.map((e) => ({
    ID: String(e.id),
    Fecha: e.fecha ? dayjs(e.fecha).format("DD/MM/YYYY") : "",
    Motivo: e.motivo || "",
    Monto: String(e.monto ?? "0"),
    Responsable: e.responsable || "",
    Tipo: e.tipo || "",
  }))
}

// Asistencias 

///////// GOOGLE SHEETS //////////


// Roles 
