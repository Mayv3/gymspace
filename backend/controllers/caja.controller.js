import {
  appendCajaToSheet,
  updateCajaByID,
  deleteCajaByID,
  getCajasFromSheet,
  getPagosFromSheet
} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import timezone from 'dayjs/plugin/timezone.js';
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js";
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js";

dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

dayjs.extend(utc);
dayjs.extend(timezone);

export const crearCaja = async (req, res) => {
  try {
    const { turno, saldoInicial, responsable } = req.body;

    if (!turno || !responsable) {
      return res.status(400).json({ message: 'Campos requeridos: turno, responsable' });
    }

    const hoy = dayjs().tz("America/Argentina/Buenos_Aires").format("YYYY-MM-DD");
    const cajas = await getCajasFromSheet();

    const yaExiste = cajas.find(c => {
      const fechaCaja = dayjs(c.Fecha, "D/M/YYYY").format("YYYY-MM-DD");
      return fechaCaja === hoy && c.Turno.toLowerCase().trim() === turno.toLowerCase().trim();
    });
    if (yaExiste) {
      return res.status(409).json({
        message: `Ya existe una caja registrada para el turno "${turno}" hoy`
      });
    }

    let saldoInicialFinal = saldoInicial || '';

    if (turno.toLowerCase() === 'tarde' && !saldoInicial) {
      const cajaManiana = cajas.find(c => {
        const fechaCaja = dayjs(c.Fecha, "D/M/YYYY").format("YYYY-MM-DD");
        return fechaCaja === hoy && c.Turno.toLowerCase().trim() === 'mañana';
      });
      saldoInicialFinal = cajaManiana?.['Total Final'] || '0';
    }

    const ahoraAR = new Date().toLocaleTimeString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
    
    const nuevaCaja = {
      Fecha: hoy,
      Turno: turno,
      'Hora Apertura': ahoraAR,
      'Saldo Inicial': saldoInicialFinal,
      'Total Efectivo': '',
      'Total Tarjeta': '',
      'Total Final': '',
      Responsable: responsable,
      'Hora Cierre': ''
    };

    const result = await appendCajaToSheet(nuevaCaja);

    res.status(201).json({
      id: result.id,
      message: `Caja de ${turno} registrada correctamente`,
      saldoInicial: saldoInicialFinal,
    });
  } catch (error) {
    console.error('Error al crear caja:', error);
    res.status(500).json({ message: 'Error al registrar caja' });
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

    const eliminada = await deleteCajaByID(id);
    if (!eliminada) return res.status(404).json({ message: 'Caja no encontrada' });

    res.json({ message: 'Caja eliminada correctamente' });
  } catch (error) {
    console.error('Error al eliminar caja:', error);
    res.status(500).json({ message: 'Error al eliminar caja' });
  }
};

export const obtenerCajaPorID = async (req, res) => {
  try {
    const id = req.params.id;

    const cajas = await getCajasFromSheet();
    const caja = cajas.find(c => c.ID === id);

    if (!caja) return res.status(404).json({ message: 'Caja no encontrada' });

    res.json(caja);
  } catch (error) {
    console.error('Error al obtener caja por ID:', error);
    res.status(500).json({ message: 'Error al obtener caja' });
  }
};

export const obtenerCaja = async (req, res) => {
  try {
    const { fecha, turno } = req.query;
    const cajas = await getCajasFromSheet();

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
    const cajas = await getCajasFromSheet();

    const hoy = dayjs().tz('America/Argentina/Buenos_Aires').format("D/M/YYYY");

    const cajaHoy = cajas.find(caja =>
      caja.Turno === turno &&
      dayjs(caja.Fecha, "D/M/YYYY").format("D/M/YYYY") === hoy
    );

    if (!cajaHoy) {
      return res.status(200).json({ existe: false, abierta: false });
    }

    if (!cajaHoy["Hora Cierre"]) {
      return res.status(200).json({
        existe: true,
        abierta: true,
        id: cajaHoy.ID,
        saldoInicial: cajaHoy["Saldo Inicial"] || "0",
      });
    }

    console.log("Fecha backend Argentina:", hoy);

    return res.status(200).json({ existe: true, abierta: false });

  } catch (error) {
    console.error("Error al verificar caja abierta:", error);
    return res.status(500).json({ message: "Error interno del servidor" });
  }
};

export const getCajasPorMes = async (req, res) => {
  try {
    const { mes, anio } = req.query;

    const cajas = await getCajasFromSheet();
    const pagos = await getPagosFromSheet();

    const cajasConTotales = cajas
      .map(caja => {
        const fechaCaja = dayjs(caja.Fecha, ["D/M/YYYY", "DD/MM/YYYY"]);
        const horaApertura = dayjs(`${caja.Fecha} ${caja["Hora Apertura"]}`, "D/M/YYYY HH:mm");
        const horaCierre = dayjs(`${caja.Fecha} ${caja["Hora Cierre"]}`, "D/M/YYYY HH:mm");

        let totalGimnasio = 0;
        let totalClases = 0;

        pagos.forEach(pago => {
          const fechaPago = dayjs(pago.Fecha_de_Pago, ["D/M/YYYY", "DD/MM/YYYY"]);
          const horaPago = dayjs(`${pago.Fecha_de_Pago} ${pago.Hora}`, "D/M/YYYY HH:mm");
          const tipo = pago.Tipo?.toUpperCase();
          const monto = parseFloat(pago.Monto) || 0;

          const mismaFecha = fechaCaja.isSame(fechaPago, 'day');
          const enRango = horaPago.isSameOrAfter(horaApertura) && horaPago.isSameOrBefore(horaCierre);

          if (mismaFecha && enRango) {
            if (tipo === "GIMNASIO") totalGimnasio += monto;
            if (tipo === "CLASE") totalClases += monto;
          }
        });

        return {
          ...caja,
          TotalGimnasio: totalGimnasio,
          TotalClases: totalClases,
          _fechaCaja: fechaCaja
        };
      })
      .filter(caja => {
        if (!mes || !anio) return true;
        return (
          caja._fechaCaja.month() + 1 === Number(mes) &&
          caja._fechaCaja.year() === Number(anio)
        );
      })
      .map(caja => {
        const { _fechaCaja, ...resto } = caja;
        return resto;
      });

    res.json(cajasConTotales);
  } catch (error) {
    console.error("Error al calcular cajas detalladas:", error);
    res.status(500).json({ message: "Error interno" });
  }
};

