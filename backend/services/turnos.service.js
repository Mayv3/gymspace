// Acceso a datos de turnos (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';
import { fetchAllRows, formatDate } from './helpers.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function listTurnos() {
  const data = await fetchAllRows(() => supabase
    .from("turnos")
    .select("*")
    .order("id", { ascending: true }))

  return data.map(t => ({
    ID: String(t.id),
    Fecha: formatDate(t.fecha),
    Tipo: t.tipo || "",
    Fecha_turno: formatDate(t.fecha_turno),
    Profesional: t.profesional || "",
    Responsable: t.responsable || "",
    Hora: t.hora ? t.hora.slice(0, 5) : "",
  }))
}

export async function insertTurno(turno) {
  const { data, error } = await supabase
    .from("turnos")
    .insert([
      {
        fecha: dayjs(turno.Fecha, "D/M/YYYY").format("YYYY-MM-DD"),
        tipo: turno.Tipo,
        fecha_turno: dayjs(turno.Fecha_turno, "D/M/YYYY").format("YYYY-MM-DD"),
        profesional: turno.Profesional,
        responsable: turno.Responsable,
        hora: turno.Hora,
      },
    ])
    .select()
    .single()

  if (error) throw error

  return {
    ID: String(data.id),
    Fecha: formatDate(data.fecha),
    Tipo: data.tipo,
    Fecha_turno: formatDate(data.fecha_turno),
    Profesional: data.profesional,
    Responsable: data.responsable,
    Hora: data.hora,
  }
}

export async function updateTurnoByID(id, nuevosDatos) {
  const patch = {}
  if (nuevosDatos.Fecha !== undefined)
    patch.fecha = dayjs(nuevosDatos.Fecha, "D/M/YYYY").format("YYYY-MM-DD")
  if (nuevosDatos.Tipo !== undefined) patch.tipo = nuevosDatos.Tipo
  if (nuevosDatos.Fecha_turno !== undefined)
    patch.fecha_turno = dayjs(nuevosDatos.Fecha_turno, "D/M/YYYY").format("YYYY-MM-DD")
  if (nuevosDatos.Profesional !== undefined) patch.profesional = nuevosDatos.Profesional
  if (nuevosDatos.Responsable !== undefined) patch.responsable = nuevosDatos.Responsable
  if (nuevosDatos.Hora !== undefined) patch.hora = nuevosDatos.Hora

  const { data, error } = await supabase
    .from("turnos")
    .update(patch)
    .eq("id", id)
    .select()
    .single()

  if (error) throw error
  return !!data
}

export async function removeTurnoByID(id) {
  const { error } = await supabase.from("turnos").delete().eq("id", id)
  if (error) throw error
  return true
}

// Egresos
