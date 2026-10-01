import { insertPago, updatePagoByID, removePagoByID } from '../services/pagos.service.js';
import { findAlumnoByDNI, updateAlumnoByDNI } from '../services/alumnos.service.js';
import { listPlanes } from '../services/planes.service.js';
import { insertRegistroPunto } from '../services/puntos.service.js';
import supabase from '../db/supabase.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import "dayjs/locale/es.js";

dayjs.locale("es");
dayjs.extend(customParseFormat);

// Alumno de prueba: nunca se le suman puntos/coins. NO BORRAR (dni 7777777).
const DNI_PRUEBA = "7777777";

function formatFechaDB(dateStr) {
    if (!dateStr) return "";
    if (dateStr.includes("-")) {
        const [year, month, day] = dateStr.split("-");
        return `${parseInt(day)}/${parseInt(month)}/${year}`;
    }
    return dateStr;
}

// Rango de fechas (YYYY-MM-DD) y turno a partir de los filtros dia/mes/anio/turno de la pantalla de pagos
function filtrosDePagos({ dia, mes, anio, turno }) {
    let desde = null;
    let hasta = null;

    if (anio) {
        const year = parseInt(anio, 10);
        if (mes) {
            const month = parseInt(mes, 10);
            const paddedMonth = String(month).padStart(2, '0');
            if (dia) {
                const day = parseInt(dia, 10);
                desde = hasta = `${year}-${paddedMonth}-${String(day).padStart(2, '0')}`;
            } else {
                const daysInMonth = new Date(year, month, 0).getDate();
                desde = `${year}-${paddedMonth}-01`;
                hasta = `${year}-${paddedMonth}-${String(daysInMonth).padStart(2, '0')}`;
            }
        } else {
            desde = `${year}-01-01`;
            hasta = `${year}-12-31`;
        }
    }

    const turnoParam = turno?.toLowerCase();
    return { desde, hasta, turno: turnoParam && turnoParam !== 'todos' ? turnoParam : null };
}

const PAGE_SIZE_MAX = 100;

// GET /api/pagos → una página de pagos: { data, total, page, pageSize }
export const getPagos = async (req, res) => {
    try {
        const { desde, hasta, turno } = filtrosDePagos(req.query);
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), PAGE_SIZE_MAX);
        // Sacar caracteres que rompen la sintaxis de .or() de PostgREST
        const search = (req.query.search || '').replace(/[,()*%\\]/g, ' ').trim();
        const tipo = req.query.tipo && req.query.tipo !== 'todos' ? req.query.tipo : null;

        const consulta = (opciones) => {
            let query = supabase.from("pagos").select("*", opciones);
            if (desde) query = query.gte("fecha_de_pago", desde);
            if (hasta) query = query.lte("fecha_de_pago", hasta);
            if (turno) query = query.eq("turno", turno);
            if (tipo) query = query.eq("tipo", tipo);
            if (search) query = query.or(`nombre.ilike.%${search}%,ultimo_plan.ilike.%${search}%`);
            return query;
        };

        const from = (page - 1) * pageSize;
        let { data, count, error } = await consulta({ count: "exact" })
            .order("fecha_de_pago", { ascending: false })
            .order("hora", { ascending: false })
            .order("id", { ascending: false })
            .range(from, from + pageSize - 1);

        // Página fuera de rango (ej. se borró el último pago de la última página): devolver vacía con el total real
        if (error?.code === 'PGRST103') {
            ({ count, error } = await consulta({ count: "exact", head: true }));
            data = [];
        }
        if (error) throw error;

        const pagosFiltrados = data.map((pago) => ({
            ID: String(pago.id),
            "Socio DNI": pago.socio_dni || "",
            Nombre: pago.nombre || "",
            Monto: String(pago.monto || ""),
            Metodo_de_Pago: pago.metodo_de_pago || "",
            Fecha_de_Pago: formatFechaDB(pago.fecha_de_pago),
            Fecha_de_Vencimiento: formatFechaDB(pago.fecha_de_vencimiento),
            Responsable: pago.responsable || "",
            Turno: pago.turno || "",
            Hora: pago.hora || "",
            Tipo: pago.tipo || "",
            Ultimo_Plan: pago.ultimo_plan || "",
        }));

        res.json({ data: pagosFiltrados, total: count ?? 0, page, pageSize });
    } catch (error) {
        console.error('Error al filtrar pagos:', error);
        res.status(500).json({ message: 'Error al filtrar pagos' });
    }
}

// GET /api/pagos/resumen → totales por tipo y método del mismo filtro (los suma Postgres)
export const getResumenPagos = async (req, res) => {
    try {
        const { desde, hasta, turno } = filtrosDePagos(req.query);

        const { data, error } = await supabase.rpc('rpc_resumen_pagos', {
            _desde: desde,
            _hasta: hasta,
            _turno: turno,
        });
        if (error) throw error;

        res.json(data.map(r => ({
            tipo: r.tipo,
            metodo: r.metodo_de_pago,
            total: Number(r.total),
            cantidad: Number(r.cantidad),
        })));
    } catch (error) {
        console.error('Error al obtener resumen de pagos:', error);
        res.status(500).json({ message: 'Error al obtener el resumen de pagos' });
    }
}

// POST

export async function obtenerCoinsPorPlan() {
    const planes = await listPlanes();

    const coinsPorPlan = {};

    planes.forEach(plan => {
        const coins = parseInt(plan.Coins, 10) || 0;
        coinsPorPlan[plan['Plan o Producto']] = coins;
    });

    return coinsPorPlan;
}

const calcularCoinsPorPago = (alumno, pago, coinsPorPlan) => {
    let coins = 0;

    const coinsPlan = coinsPorPlan[pago['Ultimo_Plan']] || 0;
    coins += coinsPlan;

    const fechaInicio = dayjs(alumno['Fecha_inicio'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const fechaPago = dayjs(pago['Fecha de Pago'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const fechaVencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const hoy = dayjs();

    const antiguedad = hoy.diff(fechaInicio, 'year');
    const pagoAntesVencimiento = fechaPago.isBefore(fechaVencimiento);

    let coinsAntiguedad = 0;
    let coinsPagoAnticipado = 0;

    if (["GIMNASIO", "CLASE"].includes(pago['Tipo'])) {
        if (antiguedad >= 1) {
            coinsAntiguedad = 100;
            coins += coinsAntiguedad;
        }

        if (pagoAntesVencimiento) {
            coinsPagoAnticipado = 100;
            coins += coinsPagoAnticipado;
        }

        console.log('Fecha inicio alumno:', fechaInicio.format('DD/MM/YYYY'));
        console.log('Fecha pago:', fechaPago.format('DD/MM/YYYY'));
        console.log('Fecha vencimiento:', fechaVencimiento.format('DD/MM/YYYY'));
        console.log('Antigüedad (años):', antiguedad);
        console.log('Pago antes de vencimiento:', pagoAntesVencimiento);
        console.log('Coins por antigüedad:', coinsAntiguedad);
        console.log('Coins por pago anticipado:', coinsPagoAnticipado);
    }

    console.log('=== Cálculo de coins ===');
    console.log('Alumno:', alumno.Nombre, 'DNI:', alumno.DNI);
    console.log('Plan pagado:', pago['Ultimo_Plan']);
    console.log('Coins base plan:', coinsPlan);

    console.log('Total coins calculados:', coins);
    console.log('========================');

    return coins;
};

export const addPago = async (req, res) => {
  try {
    const pago = req.body;

    if (
      !pago["Socio DNI"] ||
      !pago.Nombre ||
      !pago.Monto ||
      !pago["Fecha de Pago"] ||
      !pago["Fecha de Vencimiento"] ||
      !pago["Ultimo_Plan"]
    ) {
      return res.status(400).json({ message: "Faltan campos obligatorios" });
    }

    // A) Insertar pago + leer alumno (por DNI, no toda la tabla) + planes EN PARALELO
    const [nuevoPago, alumno, coinsPorPlan] = await Promise.all([
      insertPago(pago),
      findAlumnoByDNI(pago["Socio DNI"]),
      obtenerCoinsPorPlan(),
    ]);

    if (!alumno) {
      // El pago ya quedó guardado; solo no se pudieron actualizar coins/plan.
      return res.status(201).json({
        message: "Pago registrado. Alumno no encontrado para actualizar coins/plan.",
        coinsSumados: 0,
      });
    }

    const coinsDelPlan = coinsPorPlan[pago["Ultimo_Plan"]] ?? 0;
    const esGymOClase =
      pago.Tipo?.toUpperCase() === "GIMNASIO" ||
      pago.Tipo?.toUpperCase() === "CLASE";
    const esAlumnoPrueba = String(pago["Socio DNI"]) === DNI_PRUEBA;

    let coinsASumar = 0;
    if (esAlumnoPrueba) {
      // Regla: el alumno de prueba nunca acumula puntos.
      coinsASumar = 0;
    } else if (esGymOClase) {
      coinsASumar = calcularCoinsPorPago(alumno, pago, coinsPorPlan);
    } else {
      coinsASumar = Number(coinsDelPlan);
    }

    const gymCoinsActuales = parseInt(alumno["GymCoins"] || "0", 10);
    const gymCoinsNuevos = gymCoinsActuales + coinsASumar;

    // B) Un solo UPDATE del alumno: coins + (si aplica) plan/fecha/clases.
    // Esto reemplaza el PUT /api/alumnos separado que hacía el frontend.
    const alumnoPatch = { gymcoins: gymCoinsNuevos };
    if (esGymOClase) {
      alumnoPatch.Plan = pago["Ultimo_Plan"] || "";
      if (pago["Fecha de Vencimiento"]) {
        alumnoPatch.Fecha_vencimiento = pago["Fecha de Vencimiento"];
      }
      if (pago["Clases_pagadas"] !== undefined) {
        alumnoPatch.Clases_pagadas = pago["Clases_pagadas"];
      }
      alumnoPatch.Clases_realizadas = 0;
    }

    await updateAlumnoByDNI(alumno.DNI, alumnoPatch);

    // Responder ya. El registro de puntos es secundario.
    res.status(201).json({
      message: "Pago registrado correctamente y coins actualizados",
      coinsSumados: coinsASumar,
      coinsTotales: gymCoinsNuevos,
    });

    // D) Registro de puntos en background (fire-and-forget). No bloquea la respuesta.
    if (coinsASumar > 0) {
      insertRegistroPunto({
        DNI: pago["Socio DNI"],
        Nombre: pago.Nombre,
        Puntos: coinsASumar,
        Motivo: `Pago del plan ${pago["Ultimo_Plan"]}`,
        Responsable: pago.Responsable,
        PagoID: String(nuevoPago.id),
      }).catch((err) =>
        console.error("Error al registrar puntos (background):", err)
      );
    }

    return;
  } catch (error) {
    console.error("Error al registrar pago:", error);
    res.status(500).json({ message: "Error al registrar el pago" });
  }
};


// PUT

export const updatePago = async (req, res) => {
    try {
        const id = req.params.id;
        const nuevosDatos = req.body;

        const actualizado = await updatePagoByID(id, nuevosDatos);

        if (!actualizado) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }

        res.json({ message: 'Pago actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar pago:', error);
        res.status(500).json({ message: 'Error al actualizar el pago' });
    }
};

// DELETE

export const deletePago = async (req, res) => {
    try {
        const id = req.params.id;

        const eliminado = await removePagoByID(id);

        if (!eliminado) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }

        res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        res.status(500).json({ message: 'Error al eliminar el pago' });
    }
};