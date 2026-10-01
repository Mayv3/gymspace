// Registro e historial de puntos / GymCoins (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';
import { formatDate, toISODate } from './helpers.js';

dayjs.extend(utc);
dayjs.extend(timezone);

// Insertar un nuevo registro
export async function insertRegistroPunto(data) {
  const { data: inserted, error } = await supabase
    .from("registro_puntos")
    .insert([
      {
        dni: data.DNI || "",
        nombre: data.Nombre || "",
        fecha: toISODate(data.Fecha) || dayjs().format("YYYY-MM-DD"),
        puntos: Number(data.Puntos || 0),
        motivo: data.Motivo || "",
        responsable: data.Responsable || "",
        pago_id: data.PagoID ? Number(data.PagoID) : null
      }
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    ID: String(inserted.id),
    DNI: inserted.dni,
    Nombre: inserted.nombre,
    Fecha: formatDate(inserted.fecha),
    Puntos: String(inserted.puntos),
    Motivo: inserted.motivo || "",
    Responsable: inserted.responsable || "",
    PagoID: inserted.pago_id ? String(inserted.pago_id) : ""
  };
}

// Historial de puntos por DNI (solo del mes/año actual)
export async function listHistorialPuntosByDNI(dni) {
  const { data, error } = await supabase
    .from("registro_puntos")
    .select("*")
    .eq("dni", dni)
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })

  if (error) throw error;

  const now = dayjs();
  const currentMonth = now.month();
  const currentYear = now.year();

  const filtrados = data.filter(r => {
    const fecha = dayjs(r.fecha);
    return fecha.isValid() && fecha.month() === currentMonth && fecha.year() === currentYear;
  });

  return filtrados.map(r => ({
    ID: String(r.id),
    DNI: r.dni,
    Nombre: r.nombre,
    Fecha: formatDate(r.fecha),
    Puntos: String(r.puntos),
    Motivo: r.motivo || "",
    Responsable: r.responsable || "",
    PagoID: r.pago_id ? String(r.pago_id) : "",
    Hora: r.hora
  }));
}
