import express from 'express'
import { getDashboardCompleto } from '../controllers/dashboard.controller.js'
import { getAlumnosFromSheet, getClasesDiariasFromSheet, getEgresosByMesYAnio, getPlanesFromSheet, getTurnosFromSheet } from '../services/googleSheets.js';
import dayjs from 'dayjs';
import supabase from '../db/supabase.js';

const router = express.Router()

router.get('/', getDashboardCompleto)

router.get('/datosBase', async (req, res) => {
  try {
    const fechaParam = req.query.fecha || dayjs().format("DD/MM/YYYY");
    const anio = dayjs(fechaParam, "DD/MM/YYYY").year();
    const mes = dayjs(fechaParam, "DD/MM/YYYY").month() + 1;

    const [
      alumnos,
      planes,
      turnos,
      asistencias,
      egresos
    ] = await Promise.all([
      getAlumnosFromSheet(),
      getPlanesFromSheet(),
      getTurnosFromSheet(fechaParam),
      getClasesDiariasFromSheet(),
      getEgresosByMesYAnio(anio, mes)
    ]);

    res.json({
      alumnos,
      planes,
      turnos,
      asistencias,
      egresos
    });
  } catch (err) {
    console.error("❌ Error interno en /datosBase:", err)
    res.status(500).json({ message: 'Error cargando dashboard', error: err });
  }
});

router.get('/rpc', async (req, res) => {
  try {
    const hoy = dayjs()
    const fecha = req.query.fecha ? dayjs(req.query.fecha) : hoy

    const params = {
      _fecha: fecha.format('YYYY-MM-DD'),
      _mes_cajas: Number(req.query.mesCajas ?? fecha.month() + 1),
      _anio_cajas: Number(req.query.anioCajas ?? fecha.year()),
      _mes_pers: Number(req.query.mesPersonalizados ?? fecha.month() + 1),
      _anio_pers: Number(req.query.anioPersonalizados ?? fecha.year()),
    }

    const { data, error } = await supabase.rpc('rpc_dashboard_gymspace', params)
    if (error) throw error

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')

    return res.json(data)
  } catch (e) {
    console.error('rpc_dashboard_gymspace error:', e)
    return res.status(500).json({ error: 'No se pudo obtener el dashboard (RPC)' })
  }
})

router.get('/facturacion', async (req, res) => {
  try {
    const anio = Number(req.query.anio ?? dayjs().year())

    const { data, error } = await supabase.rpc('rpc_dashboard_gymspace_by_year', {
      selected_year: anio
    })

    if (error) throw error

    res.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    return res.json({ anio, facturacion: data })
  } catch (e) {
    console.error('rpc_dashboard_gymspace_by_year error:', e)
    return res.status(500).json({ error: 'No se pudo obtener la facturación' })
  }
})

router.get("/edades/distribucion", async (req, res) => {
  try {
    const fecha = req.query.fecha ?? new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc(
      "rpc_edades_por_tipo_plan",
      { _fecha: fecha }
    );

    if (error) {
      console.error("RPC ERROR:", error);
      throw error;
    }

    return res.json(data);

  } catch (err) {
    console.error("Error edades distribucion:", err);
    return res
      .status(500)
      .json({ error: "No se pudo obtener la distribución de edades" });
  }
});

router.get("/asistencias/distribucion", async (req, res) => {
  try {
    const fecha =
      typeof req.query.fecha === "string"
        ? req.query.fecha
        : new Date().toISOString().slice(0, 10);

    const { data, error } = await supabase.rpc(
      "rpc_horarios_por_tipo_plan",
      { _fecha: fecha }
    );

    if (error) {
      console.error("RPC ERROR:", error);
      throw error;
    }

    return res.json(data);
  } catch (e) {
    console.error("Error asistencias distribucion:", e);
    return res
      .status(500)
      .json({ error: "No se pudo obtener la distribución de asistencias" });
  }
});

router.get("/altas-bajas", async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes) {
      return res.status(400).json({ error: "Debe enviar anio y mes" });
    }

    // Altas: from RPC (by fecha_inicio)
    const { data: rpcData, error: rpcError } = await supabase.rpc("rpc_altas_bajas_alumnos", { _anio: anio, _mes: mes });
    if (rpcError) throw rpcError;

    // Bajas: alumnos cuyo fecha_vencimiento cae en el mes (igual que abandonos)
    const paddedMonth = String(mes).padStart(2, '0');
    const daysInMonth = new Date(anio, mes, 0).getDate();
    const startDate = `${anio}-${paddedMonth}-01`;
    const endDate = `${anio}-${paddedMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const [{ data: alumnosVenc, error: alumnosError }, { data: planes, error: planesError }] = await Promise.all([
      supabase
        .from('alumnos')
        .select('dni, nombre, plan, profesor_asignado, fecha_vencimiento')
        .is('deleted_at', null)
        .gte('fecha_vencimiento', startDate)
        .lte('fecha_vencimiento', endDate),
      supabase.from('planes').select('plan_o_producto, tipo'),
    ]);

    if (alumnosError) throw alumnosError;
    if (planesError) throw planesError;

    const planTipoMap = {};
    for (const p of planes ?? []) {
      planTipoMap[(p.plan_o_producto || '').trim().toUpperCase()] = (p.tipo || '').trim().toUpperCase();
    }

    const bajas = { gimnasio: [], clase: [] };

    for (const a of alumnosVenc ?? []) {
      const tipo = planTipoMap[(a.plan || '').trim().toUpperCase()] || '';
      const entry = {
        nombre: a.nombre,
        dni: a.dni,
        plan: a.plan,
        profesor: a.profesor_asignado,
        fecha_baja: a.fecha_vencimiento,
      };
      if (tipo === 'GIMNASIO') bajas.gimnasio.push(entry);
      else if (tipo === 'CLASE') bajas.clase.push(entry);
      else bajas.gimnasio.push(entry); // fallback
    }

    return res.json({
      altas: rpcData?.altas ?? { gimnasio: [], clase: [] },
      bajas,
      totales: {
        altas: {
          gimnasio: (rpcData?.altas?.gimnasio ?? []).length,
          clase: (rpcData?.altas?.clase ?? []).length,
        },
        bajas: {
          gimnasio: bajas.gimnasio.length,
          clase: bajas.clase.length,
        },
      },
    });
  } catch (e) {
    console.error("Error altas-bajas:", e);
    return res.status(500).json({ error: "No se pudieron obtener las altas y bajas" });
  }
});

router.get("/promedios-asistencias", async (req, res) => {
  try {
    const fecha = req.query.fecha;
    const periodo = (req.query.periodo) || "30d";

    if (!fecha) {
      return res.status(400).json({
        error: "Debe enviar la fecha (YYYY-MM-DD)",
      });
    }

    if (!["30d", "anual"].includes(periodo)) {
      return res.status(400).json({
        error: "Periodo inválido. Use '30d' o 'anual'",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_promedio_asistencias_por_plan_real",
      {
        _fecha: fecha,
        _periodo: periodo,
      }
    );

    if (error) {
      console.error("RPC error promedios:", error);
      throw error;
    }

    return res.json(data);
  } catch (e) {
    console.error("Error promedios asistencias:", e);
    return res.status(500).json({
      error: "No se pudieron obtener los promedios de asistencias",
    });
  }
});

router.get("/detalle-promedios", async (req, res) => {
  try {
    const fecha =
      typeof req.query.fecha === "string"
        ? req.query.fecha
        : new Date().toISOString().slice(0, 10);

    const periodo = "anual";

    const { data, error } = await supabase.rpc(
      "rpc_dias_con_actividad_por_plan_y_turno",
      {
        _fecha: fecha,
        _periodo: periodo,
      }
    );

    if (error) {
      console.error("RPC error detalle-promedios:", error);
      throw error;
    }

    return res.json({
      fecha_hasta: fecha,
      periodo,
      dias: data, // lista de fechas con actividad
    });
  } catch (e) {
    console.error("Error detalle-promedios:", e);
    return res.status(500).json({
      error: "No se pudo obtener el detalle de promedios",
    });
  }
});

router.get("/ingresos-mensuales", async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = Number(req.query.mes);

    if (!anio || !mes) {
      return res.status(400).json({
        error: "Debe enviar anio y mes",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_ingresos_mensuales_desglosados",
      {
        _anio: anio,
        _mes: mes,
      }
    );

    if (error) {
      console.error("RPC ingresos mensuales error:", error);
      throw error;
    }

    return res.json(data ?? []);
  } catch (e) {
    console.error("Error ingresos mensuales:", e);
    return res.status(500).json({
      error: "No se pudieron obtener los ingresos del mes",
    });
  }
});

router.get("/abandonos-por-mes", async (req, res) => {
  try {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);

    if (!mes || !anio) {
      return res.status(400).json({ error: "Debe enviar mes y anio" });
    }

    const paddedMonth = String(mes).padStart(2, '0');
    const startDate = `${anio}-${paddedMonth}-01`;
    const daysInMonth = new Date(anio, mes, 0).getDate();
    const endDate = `${anio}-${paddedMonth}-${String(daysInMonth).padStart(2, '0')}`;

    // Abandonos del mes = alumnos cuyo vencimiento cayó dentro de ese mes
    const { data, error } = await supabase
      .from('alumnos')
      .select('dni, nombre, fecha_vencimiento')
      .is('deleted_at', null)
      .gte('fecha_vencimiento', startDate)
      .lte('fecha_vencimiento', endDate);

    if (error) throw error;

    const alumnos = (data ?? []).map(a => ({
      dni: a.dni,
      nombre: a.nombre,
      fecha_vencimiento: a.fecha_vencimiento,
    }));

    return res.json({ mes, anio, cantidad: alumnos.length, alumnos });
  } catch (e) {
    console.error("Error abandonos-por-mes:", e);
    return res.status(500).json({ error: "No se pudieron obtener los abandonos del mes" });
  }
});

router.get("/vencidos", async (req, res) => {
  try {
    const hoy = dayjs().format('YYYY-MM-DD');
    const hace30 = dayjs().subtract(30, 'day').format('YYYY-MM-DD');

    const { data, error } = await supabase
      .from('alumnos')
      .select('dni, nombre, fecha_vencimiento, plan')
      .is('deleted_at', null)
      .gte('fecha_vencimiento', hace30)
      .lte('fecha_vencimiento', hoy)
      .order('fecha_vencimiento', { ascending: false });

    if (error) throw error;

    return res.json({ cantidad: data.length, alumnos: data });
  } catch (e) {
    console.error("Error vencidos:", e);
    return res.status(500).json({ error: "No se pudieron obtener los vencidos" });
  }
});

router.get("/activos-por-mes", async (req, res) => {
  try {
    const mes = Number(req.query.mes);
    const anio = Number(req.query.anio);

    if (!mes || !anio) {
      return res.status(400).json({ error: "Debe enviar mes y anio" });
    }

    const paddedMonth = String(mes).padStart(2, '0');
    const daysInMonth = new Date(anio, mes, 0).getDate();
    const startDate = `${anio}-${paddedMonth}-01`;
    const endDate = `${anio}-${paddedMonth}-${String(daysInMonth).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from("pagos")
      .select("socio_dni, nombre, fecha_de_pago, tipo")
      .gte("fecha_de_pago", startDate)
      .lte("fecha_de_pago", endDate)
      .in("tipo", ["GIMNASIO", "DEUDA GIMNASIO", "CLASE", "DEUDA CLASES"]);

    if (error) throw error;

    const vistos = new Set();
    const alumnos = [];
    for (const p of data) {
      const key = p.socio_dni || p.nombre;
      if (!vistos.has(key)) {
        vistos.add(key);
        alumnos.push({ dni: p.socio_dni, nombre: p.nombre });
      }
    }

    return res.json({ mes, anio, cantidad: alumnos.length, alumnos });
  } catch (e) {
    console.error("Error activos-por-mes:", e);
    return res.status(500).json({ error: "No se pudieron obtener los activos del mes" });
  }
});

router.get("/altas-por-referencia", async (req, res) => {
  try {
    const anio = Number(req.query.anio);
    const mes = req.query.mes ? Number(req.query.mes) : null;

    if (!anio) {
      return res.status(400).json({
        error: "Debe enviar el año",
      });
    }

    const { data, error } = await supabase.rpc(
      "rpc_altas_por_mes_referencia",
      {
        _anio: anio,
        _mes: mes,
      }
    );

    if (error) {
      console.error("RPC altas por referencia error:", error);
      throw error;
    }

    return res.json(data ?? []);
  } catch (e) {
    console.error("Error altas por referencia:", e);
    return res.status(500).json({
      error: "No se pudieron obtener las altas por referencia",
    });
  }
});

export default router