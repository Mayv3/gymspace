import dayjs from 'dayjs'
import {
  getAlumnosFromSheet,
  getPlanesFromSheet,
  getAsistenciasFromSheet,
  getPagosFromSheet
} from '../services/googleSheets.js'

export const getDashboardCompleto = async (req, res) => {
  try {
    const hoy = dayjs()

    const [alumnos, planesBD, asistencias, pagos] = await Promise.all([
      getAlumnosFromSheet(),
      getPlanesFromSheet(),
      getAsistenciasFromSheet(),
      getPagosFromSheet()
    ])

    // ---- Alumnos ----
    let activos = 0, vencidos = 0, abandonos = 0
    const edades = {}
    const planesConteo = {}

    const planesBDMap = {}
    for (const p of planesBD) {
      const nombre = (p['Plan o Producto'] || '').trim().toUpperCase()
      planesBDMap[nombre] = p.Tipo?.trim().toUpperCase() || 'OTRO'
    }

    for (const alumno of alumnos) {
      const fechaStr = (alumno.Fecha_vencimiento || '').trim()
      const fechaVenc = dayjs(fechaStr, ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'], true)
      const clasesPagadas = Number(alumno.Clases_pagadas || 0)
      const clasesRealizadas = Number(alumno.Clases_realizadas || 0)

      const tieneVencimiento = fechaVenc.isValid()
      const vencidoPorFecha = tieneVencimiento && fechaVenc.isBefore(hoy, 'day')
      const vencidoPorClases = clasesPagadas > 0 && clasesRealizadas >= clasesPagadas
      const diasDesdeVencimiento = tieneVencimiento ? hoy.diff(fechaVenc, 'day') : 0

      if (vencidoPorFecha || vencidoPorClases) {
        if (diasDesdeVencimiento > 30) abandonos++
        else vencidos++
      } else {
        activos++
      }

      const fechaNac = dayjs(alumno.Fecha_nacimiento, ['D/M/YYYY', 'DD/MM/YYYY'], true)
      if (fechaNac.isValid()) {
        const edad = hoy.diff(fechaNac, 'year')
        edades[edad] = (edades[edad] || 0) + 1
      }

      const planNombre = (alumno.Plan || '').trim().toUpperCase()
      const tipo = planesBDMap[planNombre] || 'OTRO'
      const key = `${planNombre}__${tipo}`

      planesConteo[key] = (planesConteo[key] || 0) + 1
    }

    const planes = Object.entries(planesConteo).map(([key, cantidad]) => {
      const [plan, tipo] = key.split('__')
      return { plan, tipo, cantidad }
    })

    // ---- Asistencias por Hora ----
    const { fecha } = req.query
    const fechaBase = fecha ? dayjs(fecha, ['YYYY-MM-DD', 'D/M/YYYY', 'DD/MM/YYYY'], true) : hoy

    const asistenciasPorHora = {}
    for (let i = 7; i <= 22; i++) {
      const hora = `${i.toString().padStart(2, '0')}:00`
      asistenciasPorHora[hora] = 0
    }

    for (const a of asistencias) {
      const fechaAsistencia = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'])
      if (fechaAsistencia.isSame(fechaBase, 'day')) {
        const hora = dayjs(a.Hora, 'H:mm').format('HH:00')
        if (asistenciasPorHora[hora] !== undefined) asistenciasPorHora[hora]++
      }
    }

    // ---- Promedios por Rango Horario ----
    const desde = fechaBase.subtract(30, 'day')
    const rangos = { manana: 0, tarde: 0, noche: 0 }

    for (const a of asistencias) {
      const fechaAsistencia = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY'])
      if (fechaAsistencia.isAfter(desde) && fechaAsistencia.isSameOrBefore(fechaBase)) {
        const hora = dayjs(a.Hora, 'H:mm').hour()
        if (hora >= 7 && hora < 12) rangos.manana++
        else if (hora >= 15 && hora < 18) rangos.tarde++
        else if (hora >= 18 && hora <= 22) rangos.noche++
      }
    }

    const promedios = {
      manana: { total: rangos.manana, promedio: +(rangos.manana / 31).toFixed(2) },
      tarde: { total: rangos.tarde, promedio: +(rangos.tarde / 31).toFixed(2) },
      noche: { total: rangos.noche, promedio: +(rangos.noche / 31).toFixed(2) }
    }

    // ---- Facturación Anual ----
    const anioActual = hoy.year()
    const meses = Array.from({ length: 12 }, (_, i) => ({
      mes: dayjs().month(i).format('MMMM'),
      gimnasio: 0,
      clase: 0
    }))

    for (const p of pagos) {
      const fechaPagoStr = p.Fecha_pago || p.Fecha_de_Pago || p["Fecha de Pago"] || ""
      const fechaPago = dayjs(fechaPagoStr, ['D/M/YYYY', 'DD/MM/YYYY'], true)

      if (!fechaPago.isValid()) {
        console.warn("Pago con fecha inválida:", p)
        continue
      }

      if (fechaPago.year() === anioActual) {
        const mesIndex = fechaPago.month()
        const tipo = (p.Tipo || "").trim().toUpperCase()
        const monto = parseFloat(p.Monto || "0")

        if (tipo === "GIMNASIO") meses[mesIndex].gimnasio += monto
        else if (tipo === "CLASE") meses[mesIndex].clase += monto
      }
    }

    res.json({
      estado: { activos, vencidos, abandonos },
      edades,
      planes,
      asistenciasPorHora,
      promedios,
      facturacion: meses
    })
  } catch (error) {
    console.error('Error en getDashboardCompleto:', error)
    res.status(500).json({ message: 'Error al obtener el dashboard completo' })
  }
}
