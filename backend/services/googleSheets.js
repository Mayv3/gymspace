import { google } from 'googleapis';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dotenv.config();

const auth = new google.auth.GoogleAuth({
  credentials: {
    type: 'service_account',
    project_id: process.env.GOOGLE_PROJECT_ID,
    private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_PRIVATE_KEY,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    auth_uri: process.env.GOOGLE_AUTH_URI,
    token_uri: process.env.GOOGLE_TOKEN_URI,
    auth_provider_x509_cert_url: process.env.GOOGLE_AUTH_PROVIDER_CERT_URL,
    client_x509_cert_url: process.env.GOOGLE_CLIENT_CERT_URL,
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function getNextId(range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range,
  });
  const existingIds = (res.data.values ?? [])
    .flat()
    .map(id => parseInt(id, 10))
    .filter(n => !isNaN(n));
  return (existingIds.length ? Math.max(...existingIds) : 0) + 1;
}

function toInt(n, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

function toISODate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-");
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  }
  return dateStr;
}

// ================== ALUMNOS ==================

export async function getAlumnosFromSheet() {
  const { data, error } = await supabase
    .from('alumnos')
    .select('*')
    .is('deleted_at', null)
    .order('nombre');

  if (error) throw error;

  return data.map((alumno) => ({
    ID: alumno.id,
    DNI: alumno.dni,
    Nombre: alumno.nombre,
    Email: alumno.email,
    Telefono: alumno.telefono,
    Sexo: alumno.sexo,
    Fecha_nacimiento: alumno.fecha_nacimiento
      ? dayjs(alumno.fecha_nacimiento).format('DD/MM/YYYY')
      : null,
    Plan: alumno.plan,
    Clases_pagadas: alumno.clases_pagadas,
    Clases_realizadas: alumno.clases_realizadas,
    Fecha_inicio: alumno.fecha_inicio
      ? dayjs(alumno.fecha_inicio).format('DD/MM/YYYY')
      : null,
    Fecha_vencimiento: alumno.fecha_vencimiento
      ? dayjs(alumno.fecha_vencimiento).format('DD/MM/YYYY')
      : null,
    Profesor_asignado: alumno.profesor_asignado,
    GymCoins: alumno.gymcoins,
  }));
}

// Insertar alumno
export async function appendAlumnoToSheet(alumno) {
  const { data: existing, error: checkError } = await supabase
    .from("alumnos")
    .select("dni")
    .eq("dni", alumno.DNI)
    .maybeSingle();

  if (checkError) throw checkError;
  if (existing) throw new Error("El DNI ya está registrado");

  const { data, error } = await supabase
    .from("alumnos")
    .insert([
      {
        dni: alumno.DNI || "",
        nombre: alumno["Nombre"] || "",
        email: alumno.Email || "",
        telefono: alumno.Telefono || "",
        sexo: alumno.Sexo || "",
        fecha_nacimiento: toISODate(alumno["Fecha_nacimiento"]),
        plan: alumno.Plan || null,
        clases_pagadas: alumno["Clases_pagadas"] || 0,
        clases_realizadas: alumno["Clases_realizadas"] || 0,
        fecha_inicio: toISODate(alumno["Fecha_inicio"]),
        fecha_vencimiento: toISODate(alumno["Fecha_vencimiento"]),
        profesor_asignado: alumno["Profesor_asignado"] || "",
        gymcoins: alumno["GymCoins"] || 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateAlumnoByDNI(dni, nuevosDatos) {
  const patch = {};

  if ('Nombre' in nuevosDatos) patch.nombre = nuevosDatos['Nombre'];
  if ('nombre' in nuevosDatos) patch.nombre = nuevosDatos['nombre'];
  if ('name' in nuevosDatos) patch.nombre = nuevosDatos['name'];

  if ('Nombre' in nuevosDatos) patch.nombre = nuevosDatos['Nombre'];
  if ('nombre' in nuevosDatos) patch.nombre = nuevosDatos['nombre'];
  if ('name' in nuevosDatos) patch.nombre = nuevosDatos['name'];

  if ('Email' in nuevosDatos) patch.email = nuevosDatos['Email'];
  if ('email' in nuevosDatos) patch.email = nuevosDatos['email'];

  if ('Telefono' in nuevosDatos) patch.telefono = nuevosDatos['Telefono'];
  if ('telefono' in nuevosDatos) patch.telefono = nuevosDatos['telefono'];

  if ('Sexo' in nuevosDatos) patch.sexo = nuevosDatos['Sexo'];

  if ('Fecha_nacimiento' in nuevosDatos) patch.fecha_nacimiento = toISODate(nuevosDatos['Fecha_nacimiento']);
  if ('Fecha_inicio' in nuevosDatos) patch.fecha_inicio = toISODate(nuevosDatos['Fecha_inicio']);
  if ('Fecha_vencimiento' in nuevosDatos) patch.fecha_vencimiento = toISODate(nuevosDatos['Fecha_vencimiento']);

  if ('Plan' in nuevosDatos) patch.plan = nuevosDatos['Plan'];
  if ('Profesor_asignado' in nuevosDatos) patch.profesor_asignado = nuevosDatos['Profesor_asignado'];

  if ('Clases_pagadas' in nuevosDatos) patch.clases_pagadas = toInt(nuevosDatos['Clases_pagadas']);
  if ('Clases_realizadas' in nuevosDatos) patch.clases_realizadas = toInt(nuevosDatos['Clases_realizadas']);
  if ('GymCoins' in nuevosDatos) patch.gymcoins = toInt(nuevosDatos['GymCoins']);

  if ('clases_pagadas' in nuevosDatos) patch.clases_pagadas = toInt(nuevosDatos['clases_pagadas']);
  if ('clases_realizadas' in nuevosDatos) patch.clases_realizadas = toInt(nuevosDatos['clases_realizadas']);
  if ('gymcoins' in nuevosDatos) patch.gymcoins = toInt(nuevosDatos['gymcoins']);
  if ('fecha_nacimiento' in nuevosDatos) patch.fecha_nacimiento = toISODate(nuevosDatos['fecha_nacimiento']);
  if ('fecha_inicio' in nuevosDatos) patch.fecha_inicio = toISODate(nuevosDatos['fecha_inicio']);
  if ('fecha_vencimiento' in nuevosDatos) patch.fecha_vencimiento = toISODate(nuevosDatos['fecha_vencimiento']);
  if ('plan' in nuevosDatos) patch.plan = nuevosDatos['plan'];
  if ('profesor_asignado' in nuevosDatos) patch.profesor_asignado = nuevosDatos['profesor_asignado'];

  if (Object.keys(patch).length === 0) {
    return true;
  }

  console.log(patch)

  const { data, error } = await supabase
    .from('alumnos')
    .update(patch)
    .eq('dni', dni)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false;
    throw error;
  }
  return !!data;
}

// Eliminar alumno por DNI (soft delete)
export async function deleteAlumnoByDNI(dni) {
  const { data, error } = await supabase
    .from('alumnos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('dni', dni)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return false; // no encontrado
    throw error;
  }

  return data ? true : false;
}

// Reiniciar puntos (GymCoins = 0)

export async function reiniciarPuntosAlumnos() {
  try {
    console.log('🔄 Iniciando reinicio de puntos...');

    const { error } = await supabase
      .from('alumnos')
      .update({ gymcoins: 0 })
      .is('deleted_at', null);

    if (error) throw error;

    console.log('✅ Puntos reiniciados para todos los alumnos');
    return true;
  } catch (error) {
    console.error('❌ Error al reiniciar puntos:', error);
    throw error;
  }
}

// ================== PAGOS ==================




export async function getPagosFromSheet() {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .order("fecha_de_pago", { ascending: false })
    .order("hora", { ascending: false })

  if (error) throw error;

  return data.map((pago) => ({
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
  }));
}

export async function appendPagoToSheet(pago) {
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

export async function deletePagoByID(id) {
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

export async function appendCajaToSheet(caja) {
  const { data, error } = await supabase
    .from("caja")
    .insert([
      {
        fecha: toISODate(caja.Fecha),
        turno: caja.Turno || null,
        hora_apertura: caja["Hora Apertura"] || null,
        saldo_inicial: Number(caja["Saldo Inicial"] || 0),
        total_efectivo: Number(caja["Total Efectivo"] || 0),
        total_tarjeta: Number(caja["Total Tarjeta"] || 0),
        total_final: Number(caja["Total Final"] || 0),
        responsable: caja.Responsable || null,
        hora_cierre: caja["Hora Cierre"] || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    ID: String(data.id),
    Fecha: formatDate(data.fecha),
    Turno: data.turno,
    "Hora Apertura": data.hora_apertura,
    "Saldo Inicial": String(data.saldo_inicial),
    "Total Efectivo": String(data.total_efectivo),
    "Total Tarjeta": String(data.total_tarjeta),
    "Total Final": String(data.total_final),
    Responsable: data.responsable,
    "Hora Cierre": data.hora_cierre,
  };
}

export async function updateCajaByID(id, nuevosDatos) {
  const patch = {};

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

    const efectivo = patch.total_efectivo ??
      Number(nuevosDatos["Total Efectivo"]) ?? 0;

    const tarjeta = patch.total_tarjeta ??
      Number(nuevosDatos["Total Tarjeta"]) ?? 0;

    patch.total_final = saldoInicial + efectivo + tarjeta;
  }

  if (nuevosDatos.cerrar === true) {
    const ahoraAR = new Date().toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    patch.hora_cierre = ahoraAR;
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


export async function deleteCajaByID(id) {
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

export async function getCajasFromSheet() {
  const { data, error } = await supabase
    .from("caja")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

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

export async function getDeudasFromSheet() {
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

export async function appendDeudaToSheet(deuda) {
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

export async function deleteDeudaByID(id) {
  const { error } = await supabase
    .from("deudas")
    .delete()
    .eq("id", id);

  if (error) throw error;
  return true;
}


// Planes 

export async function getPlanesFromSheet() {
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

  return data.map((p) => ({
    ID: String(p.id),
    Tipo: p.tipo || "",
    "Plan o Producto": p.plan_o_producto || "",
    Precio: String(p.precio ?? 0),
    numero_Clases: String(p.numero_clases || ""),
    Coins: String(p.coins || ""),
  }));
}

export async function appendPlanToSheet(data) {
  const { data: inserted, error } = await supabase
    .from("planes")
    .insert([
      {
        tipo: data.Tipo,
        plan_o_producto: data["Plan o Producto"],
        precio: Number(data.Precio) || 0,
        numero_clases: Number(data.numero_Clases) || 0,
        coins: Number(data.Coins) || 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    ID: String(inserted.id),
    Tipo: inserted.tipo,
    "Plan o Producto": inserted.plan_o_producto,
    Precio: String(inserted.precio),
    numero_Clases: String(inserted.numero_clases),
    Coins: String(inserted.coins),
  };
}

export async function updatePlanInSheet(id, nuevosDatos) {
  const { data: planActual, error: getError } = await supabase
    .from("planes")
    .select("*")
    .eq("id", id)
    .single();

  if (getError) throw getError;
  if (!planActual) throw new Error("Plan no encontrado");

  const patch = {};
  if (nuevosDatos.Tipo !== undefined) patch.tipo = nuevosDatos.Tipo;
  if (nuevosDatos["Plan o Producto"] !== undefined)
    patch.plan_o_producto = nuevosDatos["Plan o Producto"];
  if (nuevosDatos.Precio !== undefined)
    patch.precio = Number(nuevosDatos.Precio) || 0;
  if (nuevosDatos.numero_Clases !== undefined)
    patch.numero_clases = Number(nuevosDatos.numero_Clases) || 0;
  if (nuevosDatos.Coins !== undefined)
    patch.coins = Number(nuevosDatos.Coins) || 0;

  const { data: planNuevo, error } = await supabase
    .from("planes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // 👇 Solo registrar aumento si cambió el precio
  if (patch.precio !== undefined && planActual.precio !== patch.precio) {
    const precioAnterior = Number(planActual.precio) || 0;
    const precioNuevo = Number(patch.precio) || 0;

    let porcentaje = 0;
    if (precioAnterior > 0) {
      porcentaje = ((precioNuevo - precioAnterior) / precioAnterior) * 100;
    }

    const { error: aumentoErr } = await supabase
      .from("aumentos_planes")
      .insert([
        {
          fecha: new Date().toISOString().split("T")[0],
          precio_anterior: precioAnterior,
          precio_actualizado: precioNuevo,
          porcentaje_aumento: parseFloat(porcentaje.toFixed(2)),
          plan: planNuevo.plan_o_producto,
        },
      ]);

    if (aumentoErr) throw aumentoErr;

    console.log(`Precio anterior vs nuevo: ${precioAnterior} → ${precioNuevo}`);
  }

  return true;
}

export async function deletePlanInSheet(id) {
  const { error } = await supabase.from("planes").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function getAumentosPlanesFromSheet() {
  const { data, error } = await supabase
    .from("aumentos_planes")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;

  return data.map((a) => ({
    Fecha: a.fecha ? dayjs(a.fecha).format("DD/MM/YYYY") : "",
    Precio_anterior: String(a.precio_anterior || ""),
    Precio_actualizado: String(a.precio_actualizado || ""),
    Porcentaje_aumento: `${a.porcentaje_aumento}%`,
    Plan: a.plan || "",
  }));
}

// Turnos

export async function getTurnosFromSheet() {
  const { data, error } = await supabase
    .from("turnos")
    .select("*")
    .order("id", { ascending: true })

  if (error) throw error

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

export async function appendTurnoToSheet(turno) {
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

export async function deleteTurnoByID(id) {
  const { error } = await supabase.from("turnos").delete().eq("id", id)
  if (error) throw error
  return true
}

// Egresos

export async function getEgresosFromSheet() {
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

export async function appendEgresoToSheet(data) {
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

export async function deleteEgresoByID(id) {
  const { error } = await supabase.from("egresos").delete().eq("id", id)
  if (error) throw error
  return true
}

export async function getEgresosByMesYAnio(anio, mes) {
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

export async function appendAsistenciaToSheet(asistencia) {
  const { data, error } = await supabase
    .from("asistencias")
    .insert([
      {
        fecha: dayjs(asistencia.Fecha, ["D/M/YYYY", "DD/MM/YYYY"]).format("YYYY-MM-DD"),
        hora: asistencia.Hora, // formato HH:mm
        dni: asistencia.DNI,
        nombre: asistencia.Nombre,
        plan: asistencia.Plan,
      },
    ])
    .select()
    .single()

  if (error) throw error

  const inserted = {
    ID: String(data.id),
    Fecha: dayjs(data.fecha).format("D/M/YYYY"),
    Hora: data.hora?.slice(0, 5),
    DNI: data.dni,
    Nombre: data.nombre,
    Plan: data.plan,
    Responsable: asistencia.Responsable || "",
  }

  await supabase.from("registro_puntos").insert([
    {
      dni: inserted.DNI,
      nombre: inserted.Nombre,
      puntos: 25,
      motivo: "Asistencia registrada",
      responsable: inserted.Responsable,
    },
  ])

  return inserted
}

export async function getAsistenciasFromSheet() {
  const { data, error } = await supabase
    .from("asistencias")
    .select("*")
    .order("fecha", { ascending: false })
    .order("hora", { ascending: false })

  if (error) throw error

  return data.map((a) => ({
    ID: String(a.id),
    Fecha: dayjs(a.fecha).format("D/M/YYYY"),
    Hora: a.hora?.slice(0, 5),
    DNI: a.dni,
    Nombre: a.nombre,
    Plan: a.plan,
  }))
}

export async function getAllAsistenciasService() {
  return await getAsistenciasFromSheet()
}

export async function getAsistenciasHoyService() {
  const hoy = dayjs().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD")

  const { data, error } = await supabase
    .from("asistencias")
    .select("*")
    .eq("fecha", hoy)

  if (error) throw error

  return data.map((a) => ({
    ID: String(a.id),
    Fecha: dayjs(a.fecha).format("D/M/YYYY"),
    Hora: a.hora?.slice(0, 5),
    DNI: a.dni,
    Nombre: a.nombre,
    Plan: a.plan,
    Responsable: "",
  }))
}



///////// GOOGLE SHEETS //////////


// Roles 

export async function getRolesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Roles!A1:C', // Asegurate que el nombre de la hoja sea correcto
  });

  const [headers, ...rows] = res.data.values;

  const roles = rows.map((row) => {
    const user = {};
    headers.forEach((header, i) => {
      user[header] = row[i] || '';
    });
    return user;
  });

  return roles;
}

// Clases diarias 

export async function appendClaseDiariaToSheet(clase) {
  const nuevoID = await getNextId('ClasesDiarias!A2:A');

  const values = [[
    String(nuevoID),
    clase.Fecha,
    clase.Tipo,
    String(clase.Cantidad),
    clase.Responsable
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values },
  });
}

export async function updateClaseDiariaByID(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((header, i) => nuevosDatos[header] || rows[rowIndex][i]);

  sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `ClasesDiarias!A${rowIndex + 2}:E${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function deleteClaseDiariaByID(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
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
              sheetId: 801252478,
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

export async function getClasesDiariasFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesDiarias!A1:E',
  });

  const [headers, ...rows] = res.data.values;

  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] || '';
    });
    return obj;
  });
}


// Anotaciones

export async function getAnotacionesFromSheet() {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1000',
  });

  const [headers, ...rows] = res.data.values;
  return rows.map(row => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = row[i] || '');
    return obj;
  });
}

export async function appendAnotacionToSheet(data) {
  const registros = await getAnotacionesFromSheet();
  const nuevoID = String((registros.length || 0) + 1);

  const values = [[
    nuevoID,
    data.Fecha,
    data.Hora,
    data['Alumno DNI'],
    data.Nota,
    data.ProfeaCargo
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    resource: { values }
  });
}

export async function updateAnotacionInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  const nuevaFila = headers.map((h, i) => nuevosDatos[h] || rows[rowIndex][i]);

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `Anotaciones!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] }
  });

  return true;
}

export async function deleteAnotacionInSheet(id) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'Anotaciones!A1:F',
  });

  const rows = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);
  if (rowIndex === -1) return false;

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1095798724,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1
            }
          }
        }
      ]
    }
  });

  return true;
}

// Clases del Club

export async function getClasesElClubFromSheet() {
  const alumnos = await getAlumnosFromSheet();
  const alumnosMap = alumnos.reduce((map, alumno) => {
    map[alumno.DNI] = alumno.Nombre;
    return map;
  }, {});

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesElClub!A1:F',
  });
  const [headers, ...rows] = res.data.values;
  if (!headers || !rows) {
    throw new Error('No se encontraron datos en la hoja de Clases del Club.');
  }

  const inscriptosIdx = headers.findIndex(h => h === 'Inscriptos');

  return rows.map(row => {
    const clase = headers.reduce((obj, header, i) => {
      obj[header] = row[i] || '';
      return obj;
    }, {});

    const dniList = (clase.Inscriptos || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const nombreList = dniList.map(dni =>
      alumnosMap[dni] || `(DNI ${dni} no encontrado)`
    );

    clase.InscriptosNombres = nombreList.join(', ');

    return clase;
  });
}


export async function updateClaseElClubInSheet(id, nuevosDatos) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'ClasesElClub!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const rowIndex = rows.findIndex(row => row[0] === id);

  if (rowIndex === -1) return false;

  const actual = rows[rowIndex];

  const nuevaFila = headers.map((header, i) =>
    nuevosDatos[header] !== undefined ? nuevosDatos[header] : actual[i]
  );

  await sheets.spreadsheets.values.update({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: `ClasesElClub!A${rowIndex + 2}:F${rowIndex + 2}`,
    valueInputOption: 'USER_ENTERED',
    resource: { values: [nuevaFila] },
  });

  return true;
}

export async function appendToRegistrosClasesSheet(registro) {
  const sheets = google.sheets({ version: 'v4', auth });

  const values = [[
    registro.IDClase,
    registro['Nombre de clase'],
    registro.Fecha,
    registro.Hora,
    registro['DNI Alumno'],
    registro['Nombre Alumno']
  ]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'RegistrosClasesElClub!A1',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values
    }
  });
}

export async function eliminarRegistroDeClase({ IDClase, DNI, Fecha }) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    range: 'RegistrosClasesElClub!A1:F',
  });

  const [headers, ...rows] = res.data.values;
  const idIndex = headers.indexOf('ID');
  const dniIndex = headers.indexOf('DNI Alumno');
  const fechaIndex = headers.indexOf('Fecha');

  const rowIndex = rows.findIndex(row =>
    String(row[idIndex]) === String(IDClase) &&
    String(row[dniIndex]) === String(DNI) &&
    dayjs(row[fechaIndex], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).format('D/M/YYYY') ===
    dayjs(Fecha, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']).format('D/M/YYYY')
  );

  if (rowIndex === -1) {
    console.log("❌ No se encontró el registro a eliminar");
    return false;
  }

  console.log("✅ Eliminando fila:", rowIndex + 2);

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: process.env.GOOGLE_SHEET_ID,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: 1279938571,
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






// Puntos

export async function getRegistroPuntosFromSheet() {
  const { data, error } = await supabase
    .from("registro_puntos")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

  return data.map(r => ({
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

// Insertar un nuevo registro
export async function appendRegistroPuntoToSheet(data) {
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
export async function getHistorialPuntosByDNI(dni) {
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
