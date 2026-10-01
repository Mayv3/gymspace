import { listAlumnos } from '../services/alumnos.service.js';
import dayjs from 'dayjs';
import isBetween from 'dayjs/plugin/isBetween.js'
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import weekOfYear from 'dayjs/plugin/weekOfYear.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import supabase from '../db/supabase.js';

dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore)
dayjs.extend(isBetween)
dayjs.extend(weekOfYear)
dayjs.extend(customParseFormat);

const PLANES_ILIMITADOS = ['Pase libre', 'Personalizado premium', 'Libre', 'Personalizado gold'];

export const registrarAsistencia = async (req, res) => {
  console.time("⏱️ registrarAsistencia - total");
  try {
    const { dni } = req.body;
    if (!dni) {
      console.timeEnd("⏱️ registrarAsistencia - total");
      return res.status(400).json({ message: "DNI es requerido" });
    }

    console.time("⏱️ registrarAsistencia - rpc"); // mide solo el RPC
    const { data, error } = await supabase
      .rpc("registrar_asistencia", { p_dni: dni });
    console.timeEnd("⏱️ registrarAsistencia - rpc");

    if (error) throw error;

    console.timeEnd("⏱️ registrarAsistencia - total");
    return res.status(data.status).json(data);
  } catch (err) {
    console.timeEnd("⏱️ registrarAsistencia - total");
    console.error("Error RPC registrar_asistencia:", err);
    return res.status(500).json({ message: "Error al registrar asistencia" });
  }
};


export const verificarAlumno = async (req, res) => {
  const start = Date.now();
  const tz = "America/Argentina/Cordoba";

  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ message: "DNI es requerido" });

    const alumnos = await listAlumnos();
    const alumno = alumnos.find((a) => String(a.DNI) === String(dni));

    if (!alumno) return res.status(404).json({ message: "Alumno no encontrado" });

    const vencimiento = dayjs.tz(
      alumno["Fecha_vencimiento"],
      ["D/M/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"],
      tz
    );

    if (!vencimiento.isValid()) {
      return res.status(400).json({ message: "Fecha de vencimiento inválida" });
    }

    const hoy = dayjs().tz(tz);

    const pagadas = parseInt(alumno["Clases_pagadas"] || "0", 10);
    const realizadas = parseInt(alumno["Clases_realizadas"] || "0", 10);
    const gymCoins = parseInt(alumno["GymCoins"] || "0", 10);

    const data = {
      nombre: alumno.Nombre,
      dni: alumno.DNI,
      plan: alumno.Plan,
      clasesPagadas: pagadas,
      clasesRealizadas: realizadas + 1,
      gymCoins: gymCoins + 25,
      fechaVencimiento: vencimiento.format("DD/MM/YYYY"),
    };

    // Regla: vence a las 00:00 del día indicado (el día ya está vencido)
    const vencio = !hoy.isBefore(vencimiento.startOf("day"));

    if (vencio) {
      const elapsed = Date.now() - start;
      console.log(`❌ Plan vencido:`, { ...data, ahora: hoy.format() }, `⏱️ ${elapsed}ms`);
      return res.status(403).json({
        message: `El plan de ${alumno.Nombre} venció el ${vencimiento.format("DD/MM/YYYY")}`,
        ...data,
      });
    }

    const esIlimitado = PLANES_ILIMITADOS.includes(alumno.Plan);
    if (!esIlimitado && realizadas + 1 > pagadas) {
      const elapsed = Date.now() - start;
      console.log(`⚠️ Clases agotadas:`, data, `⏱️ ${elapsed}ms`);
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre} ya agotó sus clases pagadas`,
        ...data,
      });
    }

    return res.status(200).json({
      message: "Alumno activo",
      ...data,
    });
  } catch (error) {
    console.error("Error al verificar alumno:", error);
    return res.status(500).json({ message: "Error en la verificación" });
  }
};

