import {
    getPagosFromSheet,
    appendPagoToSheet,
    updatePagoByID,
    deletePagoByID,
    getAlumnosFromSheet,
    getPlanesFromSheet,
    updateAlumnoByDNI,
    appendRegistroPuntoToSheet
} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import "dayjs/locale/es.js";

dayjs.locale("es");
dayjs.extend(customParseFormat);

export const getPagosPorDNI = async (req, res) => {
    try {
        const dni = req.params.dni;
        const pagos = await getPagosFromSheet();
        const pagosFiltrados = pagos.filter(pago => pago['Socio DNI'] === dni);
        res.json(pagosFiltrados);
    } catch (error) {
        console.error('Error al obtener pagos:', error);
        res.status(500).json({ message: 'Error al obtener los pagos' });
    }
};

export const getTodosLosPagos = async (req, res) => {
    try {
        const pagos = await getPagosFromSheet();
        res.json(pagos);
    } catch (error) {
        console.error('Error al obtener todos los pagos:', error);
        res.status(500).json({ message: 'Error al obtener los pagos' });
    }
};

export const getPagosPorMes = async (req, res) => {
    try {
        const numeroMes = parseInt(req.params.numeroMes); // 1 a 12

        if (isNaN(numeroMes) || numeroMes < 1 || numeroMes > 12) {
            return res.status(400).json({ message: 'Mes inválido (1 a 12)' });
        }

        const pagos = await getPagosFromSheet();

        const pagosFiltrados = pagos.filter(pago => {
            const fechaPago = dayjs(pago['Fecha de Pago']);
            return fechaPago.isValid() && fechaPago.month() + 1 === numeroMes;
        });

        res.json(pagosFiltrados);
    } catch (error) {
        console.error('Error al obtener pagos por mes:', error);
        res.status(500).json({ message: 'Error al obtener los pagos por mes' });
    }
};

export const getFacturacionPorMes = async (req, res) => {
    try {
        const numeroMes = parseInt(req.params.numeroMes);
        if (isNaN(numeroMes) || numeroMes < 1 || numeroMes > 12) {
            return res.status(400).json({ message: 'Mes inválido (1 a 12)' });
        }

        const pagos = await getPagosFromSheet();

        const total = pagos.reduce((acc, pago) => {
            const fecha = dayjs(pago['Fecha de Pago']);
            const monto = parseFloat(pago.Monto || '0');

            if (fecha.isValid() && fecha.month() + 1 === numeroMes) {
                return acc + monto;
            }

            return acc;
        }, 0);

        res.json({ mes: numeroMes, totalFacturado: total });
    } catch (error) {
        console.error('Error en facturación mensual:', error);
        res.status(500).json({ message: 'Error al calcular la facturación mensual' });
    }
};

export const getFacturacionPorMetodo = async (req, res) => {
    try {
        const pagos = await getPagosFromSheet();

        const agrupado = pagos.reduce((acc, pago) => {
            const metodo = pago['Método de Pago'] || 'Desconocido';
            const monto = parseFloat(pago.Monto || '0');

            if (!acc[metodo]) acc[metodo] = 0;
            acc[metodo] += monto;

            return acc;
        }, {});

        res.json(agrupado);
    } catch (error) {
        console.error('Error en facturación por método:', error);
        res.status(500).json({ message: 'Error al calcular la facturación por método de pago' });
    }
};

export const getFacturacionPorMetodoYMes = async (req, res) => {
    try {
        const numeroMes = parseInt(req.params.numeroMes);
        if (isNaN(numeroMes) || numeroMes < 1 || numeroMes > 12) {
            return res.status(400).json({ message: 'Mes inválido (1 a 12)' });
        }

        const pagos = await getPagosFromSheet();

        const agrupado = pagos.reduce((acc, pago) => {
            const metodo = pago['Método de Pago'] || 'Desconocido';
            const monto = parseFloat(pago.Monto || '0');
            const fecha = dayjs(pago['Fecha de Pago']);

            if (fecha.isValid() && fecha.month() + 1 === numeroMes) {
                if (!acc[metodo]) acc[metodo] = 0;
                acc[metodo] += monto;
            }

            return acc;
        }, {});

        res.json({
            mes: numeroMes,
            facturacion: agrupado
        });
    } catch (error) {
        console.error('Error en facturación por método y mes:', error);
        res.status(500).json({ message: 'Error al calcular la facturación por método y mes' });
    }
};

export const getPagosPorFechaYTurno = async (req, res) => {
    try {
        const { dia, mes, anio, turno } = req.params;
        const fechaBuscada = `${parseInt(dia)}/${parseInt(mes)}/${anio}`;
        const turnoBuscado = turno.toLowerCase();

        const pagos = await getPagosFromSheet();

        const pagosFiltrados = pagos.filter(pago => {
            const fechaPago = dayjs(pago['Fecha_de_Pago'], 'D/M/YYYY').format('D/M/YYYY');

            return fechaPago === fechaBuscada &&
                pago.Turno?.toLowerCase() === turnoBuscado;
        });

        res.json(pagosFiltrados);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ message: 'Error al filtrar pagos' });
    }
};

export const getPagos = async (req, res) => {
    try {
        const { dia, mes, anio, turno } = req.query;
        const pagos = await getPagosFromSheet();

        const pagosFiltrados = pagos.filter(pago => {
            const fecha = dayjs(pago['Fecha_de_Pago'], 'D/M/YYYY');

            if (dia && fecha.date() !== parseInt(dia, 10)) {
                return false;
            }
            if (mes && (fecha.month() + 1) !== parseInt(mes, 10)) {
                return false;
            }
            if (anio && fecha.year() !== parseInt(anio, 10)) {
                return false;
            }
            const turnoParam = turno?.toLowerCase();
            if (
                turnoParam &&
                turnoParam !== 'todos' &&
                pago.Turno?.toLowerCase() !== turnoParam
            ) {
                return false;
            }

            return true;
        });

        res.json(pagosFiltrados);
    } catch (error) {
        console.error('Error al filtrar pagos:', error);
        res.status(500).json({ message: 'Error al filtrar pagos' });
    }
}

export const getPagosFiltrados = async (req, res) => {
    try {
        const { fecha, tipo } = req.query;

        const pagos = await getPagosFromSheet();

        const filtrados = pagos.filter(pago => {
            const coincideFecha = fecha ? pago['Fecha de Pago'] === fecha : true;
            const coincideTipo = tipo ? (pago.Tipo || '').toLowerCase() === tipo.toLowerCase() : true;
            return coincideFecha && coincideTipo;
        });

        res.json(filtrados);
    } catch (error) {
        console.error('Error al filtrar pagos:', error);
        res.status(500).json({ message: 'Error al filtrar pagos' });
    }
};

export const getFacturacionPorTipoYMes = async (req, res) => {
    try {
        const { mes, anio } = req.params;
        const pagos = await getPagosFromSheet();

        const totalesPorTipo = {};
        let totalGeneral = 0;

        for (const pago of pagos) {
            const fecha = dayjs(pago.Fecha_de_Pago, ['D/M/YYYY', 'DD/MM/YYYY'], true);
            if (!fecha.isValid()) continue;

            if (fecha.month() + 1 !== parseInt(mes) || fecha.year() !== parseInt(anio)) continue;

            const tipo = pago.Tipo?.trim().toUpperCase() || "OTRO";
            const monto = parseFloat(pago.Monto) || 0;

            if (!totalesPorTipo[tipo]) {
                totalesPorTipo[tipo] = 0;
            }

            totalesPorTipo[tipo] += monto;
            totalGeneral += monto;
        }
        const nombreMes = dayjs(`${anio}-${mes}-01`).format('MMMM');

        res.json({
            mes: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
            anio: parseInt(anio),
            totales: totalesPorTipo,
            totalGeneral: +totalGeneral.toFixed(2)
        });
    } catch (error) {
        console.error("Error al calcular facturación por tipo:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

export const getFacturacionAnual = async (req, res) => {
    try {
        const anio = parseInt(req.query.anio)

        if (isNaN(anio)) {
            return res.status(400).json({ message: 'Año inválido' })
        }

        const pagos = await getPagosFromSheet()

        const meses = Array.from({ length: 12 }, (_, i) => ({
            mes: dayjs(`${anio}-${i + 1}-01`).format('MMMM'),
            gimnasio: 0,
            clase: 0,
        }))

        for (const pago of pagos) {
            const fecha = dayjs(pago.Fecha_de_Pago, ['D/M/YYYY', 'DD/MM/YYYY'], true)
            if (!fecha.isValid()) continue

            if (fecha.year() !== anio) continue

            const mesIndex = fecha.month();
            const tipo = (pago.Tipo || "").toUpperCase().trim()
            const monto = parseFloat(pago.Monto) || 0

            console.log(`Tipo leído: "${tipo}" | Monto: ${monto}`);

            if (["GIMNASIO", "DEUDA GIMNASIO"].includes(tipo)) {
                meses[mesIndex].gimnasio += monto;
                console.log(`Monto gimnasio: ${monto}`)
            }

            if (["CLASE", "DEUDA CLASES"].includes(tipo)) {
                meses[mesIndex].clase += monto;
                console.log(`Monto clases: ${monto}`)
            }
        }

        res.json(meses)
    } catch (error) {
        console.error('Error en facturación anual:', error)
        res.status(500).json({ message: 'Error interno del servidor' })
    }
}

export const getPagosUltimaSemana = async (req, res) => {
    try {
        const { fecha } = req.query;
        if (!fecha) return res.status(400).json({ message: "Fecha requerida" });

        const fechaFin = dayjs(fecha);
        const fechaInicio = fechaFin.subtract(7, "day");

        const pagos = await getPagosFromSheet();

        const filtrados = pagos.filter(pago => {
            const fechaPago = dayjs(pago['Fecha_de_Pago'], ['D/M/YYYY', 'DD/MM/YYYY']);
            return fechaPago.isValid() &&
                fechaPago.isAfter(fechaInicio) &&
                fechaPago.isBefore(fechaFin.add(1, "day"));
        });

        res.json(filtrados);
    } catch (error) {
        console.error("Error al obtener pagos de la última semana:", error);
        res.status(500).json({ message: "Error interno del servidor" });
    }
};

// POST

export async function obtenerCoinsPorPlan() {
    const planes = await getPlanesFromSheet();

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

    const nuevoPago = await appendPagoToSheet(pago);

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find((a) => a.DNI === pago["Socio DNI"]);
    if (!alumno) {
      return res
        .status(404)
        .json({ message: "Alumno no encontrado para actualizar coins" });
    }

    const coinsPorPlan = await obtenerCoinsPorPlan();
    const coinsDelPlan = coinsPorPlan[pago["Ultimo_Plan"]] ?? 0;

    let coinsASumar = 0;
    if (
      pago.Tipo?.toUpperCase() === "GIMNASIO" ||
      pago.Tipo?.toUpperCase() === "CLASE"
    ) {
      coinsASumar = calcularCoinsPorPago(alumno, pago, coinsPorPlan);
    } else {
      coinsASumar = Number(coinsDelPlan);
    }

    const gymCoinsActuales = parseInt(alumno["GymCoins"] || "0", 10);
    const gymCoinsNuevos = gymCoinsActuales + coinsASumar;

    await updateAlumnoByDNI(alumno.DNI, {
      gymcoins: gymCoinsNuevos,
    });

    if (coinsASumar > 0) {
      await appendRegistroPuntoToSheet({
        DNI: pago["Socio DNI"],
        Nombre: pago.Nombre,
        Puntos: coinsASumar,
        Motivo: `Pago del plan ${pago["Ultimo_Plan"]}`,
        Responsable: pago.Responsable,
        PagoID: String(nuevoPago.id),
      });
    }

    res.status(201).json({
      message: "Pago registrado correctamente y coins actualizados",
      coinsSumados: coinsASumar,
      coinsTotales: gymCoinsNuevos,
    });
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

        const eliminado = await deletePagoByID(id);

        if (!eliminado) {
            return res.status(404).json({ message: 'Pago no encontrado' });
        }

        res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar pago:', error);
        res.status(500).json({ message: 'Error al eliminar el pago' });
    }
};