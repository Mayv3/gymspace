// Acceso a datos de pagos (Supabase). ⚠️ updatePagoByID todavía escribe en Google Sheets.

import supabase from '../db/supabase.js';
import { sheets } from './googleSheetsClient.js';
import { formatDate, toISODate } from './helpers.js';

// Pagos de un solo socio (sin bajar toda la tabla, que además viene cortada en 1000 filas)
export async function listPagosByDNI(dni) {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("socio_dni", dni)
    .order("fecha_de_pago", { ascending: false })
    .order("hora", { ascending: false });

  if (error) throw error;

  return data.map(mapPago);
}

function mapPago(pago) {
  return {
    ID: String(pago.id),
    "Socio DNI": pago.socio_dni || "",
    Nombre: pago.nombre || "",
    Monto: String(pago.monto || ""),
    Metodo_de_Pago: pago.metodo_de_pago || "",
    Fecha_de_Pago: formatDate(pago.fecha_de_pago),
    Fecha_de_Vencimiento: formatDate(pago.fecha_de_vencimiento),
    Responsable: pago.responsable || "",
    Turno: pago.turno || "",
    Hora: pago.hora || "",
    Tipo: pago.tipo || "",
    Ultimo_Plan: pago.ultimo_plan || "",
  };
}

export async function insertPago(pago) {
  const horaActual = new Date().toLocaleTimeString("es-AR", {
    timeZone: "America/Argentina/Buenos_Aires",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  pago.Hora = horaActual;

  const { data, error } = await supabase
    .from("pagos")
    .insert([{
      socio_dni: pago["Socio DNI"] || "",
      nombre: pago.Nombre || "",
      monto: Number(pago.Monto || 0),
      metodo_de_pago: pago["Método de Pago"] ?? pago["Metodo_de_Pago"] ?? "",
      fecha_de_pago: toISODate(pago["Fecha de Pago"] ?? pago["Fecha_de_Pago"] ?? ""),
      fecha_de_vencimiento: toISODate(pago["Fecha de Vencimiento"] ?? pago["Fecha_de_Vencimiento"] ?? ""),
      responsable: pago.Responsable || "",
      turno: pago.Turno || "",
      hora: pago.Hora || "",
      tipo: pago["Tipo"] || "",
      ultimo_plan: pago["Ultimo_Plan"] || "",
    }])
    .select()
    .single();

  if (error) throw error;

  return { id: data.id, ...pago };
}

export async function updatePagoByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Pagos!A1:H',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Pagos!A${rowIndex + 2}:H${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function removePagoByID(id) {
  const { data: pago, error: readErr } = await supabase
    .from("pagos")
    .select("id, socio_dni")
    .eq("id", id)
    .single();

  if (readErr) {
    if (readErr.code === "PGRST116") return false;
    throw readErr;
  }

  const dniAlumno = pago.socio_dni;

  const { data: registros, error: puntosErr } = await supabase
    .from("registro_puntos")
    .select("puntos")
    .eq("pago_id", String(id));

  if (puntosErr) throw puntosErr;

  const puntosARestar = registros.reduce(
    (acc, r) => acc + Number(r.puntos || 0),
    0
  );

  const { error: delPuntosErr } = await supabase
    .from("registro_puntos")
    .delete()
    .eq("pago_id", String(id));

  if (delPuntosErr) throw delPuntosErr;

  const { error: delPagoErr } = await supabase
    .from("pagos")
    .delete()
    .eq("id", id);

  if (delPagoErr) throw delPagoErr;

  if (puntosARestar > 0 && dniAlumno) {
    const { data: alumno, error: alumnoErr } = await supabase
      .from("alumnos")
      .select("gymcoins")
      .eq("dni", dniAlumno)
      .single();

    if (!alumnoErr && alumno) {
      const coinsActuales = Number(alumno.gymcoins || 0);
      const nuevoTotal = Math.max(coinsActuales - puntosARestar, 0);

      const { error: updErr } = await supabase
        .from("alumnos")
        .update({ gymcoins: nuevoTotal })
        .eq("dni", dniAlumno);

      if (updErr) throw updErr;
    }
  }

  return true;
}

// Caja
