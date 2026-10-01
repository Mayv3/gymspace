// Acceso a datos de alumnos (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';
import { fetchAllRows, toISODate, toInt } from './helpers.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function listAlumnos() {
  const data = await fetchAllRows(() => supabase
    .from('alumnos')
    .select('*')
    .is('deleted_at', null)
    .order('nombre')
    .order('id'));

  return data.map(mapAlumno);
}

export function mapAlumno(alumno) {
  return {
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
  };
}

// Solo las columnas del ranking de GymCoins, paginado (Supabase corta en 1000 filas por consulta)
export async function listAlumnosParaRanking() {
  const alumnos = await fetchAllRows(() => supabase
    .from('alumnos')
    .select('dni, nombre, plan, gymcoins')
    .is('deleted_at', null)
    .order('nombre')
    .order('id'));

  return alumnos.map((alumno) => ({
    DNI: alumno.dni,
    Nombre: alumno.nombre,
    Plan: alumno.plan,
    GymCoins: alumno.gymcoins,
  }));
}

// Nombres de un conjunto de DNIs
export async function findNombresByDNIs(dnis) {
  if (!dnis.length) return {};
  const { data, error } = await supabase
    .from('alumnos')
    .select('dni, nombre')
    .in('dni', dnis);

  if (error) throw error;
  return Object.fromEntries(data.map(a => [a.dni, a.nombre]));
}

// Obtener un alumno por DNI (1 sola fila, sin bajar toda la tabla)
export async function findAlumnoByDNI(dni) {
  const { data: alumno, error } = await supabase
    .from('alumnos')
    .select('*')
    .eq('dni', dni)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) throw error;
  if (!alumno) return null;

  return {
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
  };
}

// Insertar alumno
export async function insertAlumno(alumno) {
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
        referencia_origen: alumno["referencia_origen"] || "",
      },
    ])
    .select()
    .single();

  console.log(data)

  if (error) throw error;
  return data;
}

export async function updateAlumnoByDNI(dni, nuevosDatos) {
  const patch = {};

  if ('dni' in nuevosDatos) patch.dni = nuevosDatos['dni'];

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
export async function removeAlumnoByDNI(dni) {
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

