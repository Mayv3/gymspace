import { updateCajaByID, removeCajaByID, listCajas } from '../services/caja.service.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";
import supabase from '../db/supabase.js';

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

dayjs.extend(utc);
dayjs.extend(timezone);

export const crearCaja = async (req, res) => {
  try {
    const { turno, saldoInicial, responsable } = req.body;

    if (!turno || !responsable) {
      return res.status(400).json({ message: "Campos requeridos: turno, responsable" });
    }

    const hoy = dayjs().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");

    const { data: cajasExistentes, error: cajasErr } = await supabase
      .from("caja")
      .select("*")
      .eq("fecha", hoy)
      .eq("turno", turno);

    if (cajasErr) throw cajasErr;
    if (cajasExistentes.length > 0) {
      return res.status(409).json({
        message: `Ya existe una caja registrada para el turno "${turno}" hoy`,
      });
    }

    let saldoInicialFinal = Number(saldoInicial || 0);

    if (turno.toLowerCase() === "tarde") {
      const { data: cajaManiana, error: manianaErr } = await supabase
        .from("caja")
        .select("total_final")
        .eq("fecha", hoy)
        .eq("turno", "mañana")
        .single();

      if (manianaErr && manianaErr.code !== "PGRST116") throw manianaErr;
      if (cajaManiana) {
        saldoInicialFinal += Number(cajaManiana.total_final || 0);
      }
    }

    const ahoraAR = new Date().toLocaleTimeString("es-AR", {
      timeZone: "America/Argentina/Buenos_Aires",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    const { data, error } = await supabase
      .from("caja")
      .insert([
        {
          fecha: hoy,
          turno,
          hora_apertura: ahoraAR,
          saldo_inicial: saldoInicialFinal,
          total_efectivo: 0,
          total_tarjeta: 0,
          total_final: 0,
          responsable,
          hora_cierre: null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      id: data.id,
      message: `Caja de ${turno} registrada correctamente`,
      saldoInicial: saldoInicialFinal,
    });
  } catch (error) {
    console.error("Error al crear caja:", error);
    res.status(500).json({ message: "Error al registrar caja" });
  }
};

export const editarCaja = async (req, res) => {
  try {
    const id = req.params.id;
    const nuevosDatos = req.body;

    const editado = await updateCajaByID(id, nuevosDatos);
    if (!editado) return res.status(404).json({ message: 'Caja no encontrada' });

    res.json({ message: 'Caja actualizada correctamente' });
  } catch (error) {
    console.error('Error al editar caja:', error);
    res.status(500).json({ message: 'Error al editar caja' });
  }
};

export const eliminarCaja = async (req, res) => {
  try {
    const id = req.params.id;

    const eliminada = await removeCajaByID(id);
    if (!eliminada) return res.status(404).json({ message: 'Caja no encontrada' });

    res.json({ message: 'Caja eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar caja:', error);
    res.status(500).json({ message: 'Error al eliminar caja' });
  }
};

export const obtenerCaja = async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    const cajas = await listCajas();

    const filtradas = cajas.filter(c => {
      const coincideFecha = fecha ? c.Fecha === fecha : true;
      const coincideTurno = turno ? c.Turno?.toLowerCase() === turno.toLowerCase() : true;
      return coincideFecha && coincideTurno;
    });

    res.json(filtradas);
  } catch (error) {
    console.error('Error al obtener cajas:', error);
    res.status(500).json({ message: 'Error al obtener cajas' });
  }
};

export const obtenerCajaAbiertaPorTurno = async (req, res) => {
  try {
    const { turno } = req.params;

    const hoy = dayjs().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");

    const { data: cajaHoy, error } = await supabase
      .from("caja")
      .select("*")
      .eq("fecha", hoy)
      .eq("turno", turno)
      .maybeSingle();

    if (error) throw error;

    if (!cajaHoy) {
      return res.status(200).json({ existe: false, abierta: false });
    }

    if (!cajaHoy.hora_cierre) {
      return res.status(200).json({
        existe: true,
        abierta: true,
        id: cajaHoy.id,
        saldoInicial: cajaHoy.saldo_inicial || 0,
      });
    }

    console.log("Fecha backend Argentina:", hoy);

    return res.status(200).json({ existe: true, abierta: false });
  } catch (error) {
    console.error("Error al verificar caja abierta:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

