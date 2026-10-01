// Acceso a datos de caja (Supabase). ⚠️ removeCajaByID todavía escribe en Google Sheets.

import supabase from '../db/supabase.js';
import { sheets } from './googleSheetsClient.js';
import { fetchAllRows } from './helpers.js';

export async function updateCajaByID(id, nuevosDatos) {
  const patch = {};

  if (nuevosDatos.cerrar === true) {
    // Al cerrar la caja, calculamos los totales directo de la BD
    // para evitar que el frontend mande valores incorrectos (ej. pagos del mes entero)
    const { data: cajaActual, error: getCajaErr } = await supabase
      .from("caja")
      .select("fecha, turno, saldo_inicial")
      .eq("id", id)
      .single();

    if (getCajaErr) throw getCajaErr;

    const { data: pagos, error: pagosErr } = await supabase
      .from("pagos")
      .select("monto, metodo_de_pago")
      .eq("fecha_de_pago", cajaActual.fecha)
      .eq("turno", cajaActual.turno);

    if (pagosErr) throw pagosErr;

    const totalEfectivo = (pagos || [])
      .filter(p => p.metodo_de_pago?.toLowerCase() === "efectivo")
      .reduce((sum, p) => sum + Number(p.monto || 0), 0);

    const totalTarjeta = (pagos || [])
      .filter(p => p.metodo_de_pago?.toLowerCase() === "tarjeta")
      .reduce((sum, p) => sum + Number(p.monto || 0), 0);

    const saldoInicial = Number(cajaActual.saldo_inicial || 0);

    patch.total_efectivo = totalEfectivo;
    patch.total_tarjeta = totalTarjeta;
    patch.total_final = saldoInicial + totalEfectivo + totalTarjeta;

    const ahoraAR = new Date().toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    patch.hora_cierre = ahoraAR;
  } else {
    // Edición manual de la caja (no cierre)
    if (nuevosDatos["Saldo Inicial"] !== undefined) {
      patch.saldo_inicial = Number(nuevosDatos["Saldo Inicial"]) || 0;
    }

    if (nuevosDatos["Total Efectivo"] !== undefined) {
      patch.total_efectivo = Number(nuevosDatos["Total Efectivo"]) || 0;
    }

    if (nuevosDatos["Total Tarjeta"] !== undefined) {
      patch.total_tarjeta = Number(nuevosDatos["Total Tarjeta"]) || 0;
    }

    if (
      nuevosDatos["Total Efectivo"] !== undefined ||
      nuevosDatos["Total Tarjeta"] !== undefined
    ) {
      const saldoInicial = patch.saldo_inicial ??
        Number(nuevosDatos["Saldo Inicial"]) ?? 0;
      const efectivo = patch.total_efectivo ?? 0;
      const tarjeta = patch.total_tarjeta ?? 0;
      patch.total_final = saldoInicial + efectivo + tarjeta;
    }
  }

  const { data, error } = await supabase
    .from("caja")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  return !!data;
}

export async function removeCajaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Caja!A1:J',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 404044225,
              dimension: 'ROWS',
              startIndex: rowIndex + 1,
              endIndex: rowIndex + 2
            }
          }
        }
      ]
    }
  });

  return true;
}

export async function listCajas() {
  const data = await fetchAllRows(() => supabase
    .from("caja")
    .select("*")
    .order("id", { ascending: true }));

  // Mapear igual que en Sheets
  return data.map(caja => ({
    ID: caja.id,
    Fecha: caja.fecha || "",
    Turno: caja.turno || "",
    "Hora Apertura": caja.hora_apertura || "",
    "Saldo Inicial": caja.saldo_inicial?.toString() || "",
    "Total Efectivo": caja.total_efectivo?.toString() || "",
    "Total Tarjeta": caja.total_tarjeta?.toString() || "",
    "Total Final": caja.total_final?.toString() || "",
    Responsable: caja.responsable || "",
    "Hora Cierre": caja.hora_cierre || "",
  }));
}


// Deudas
