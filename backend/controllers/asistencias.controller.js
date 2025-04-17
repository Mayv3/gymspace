import {
  getAlumnosFromSheet,
  getAsistenciasFromSheet,
  appendAsistenciaToSheet,
  updateAlumnoByDNI
} from '../services/googleSheets.js';
import dayjs from 'dayjs';

const PLANES_ILIMITADOS = ['Pase libre', 'Personalizado premium', 'Libre', 'Personalizado gold'];

export const registrarAsistencia = async (req, res) => {
  try {
    const { dni } = req.body;
    if (!dni) return res.status(400).json({ message: 'DNI es requerido' });

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find(a => a.DNI === dni);

    if (!alumno) {
      return res.status(404).json({ message: 'Alumno no encontrado' });
    }

    const vencimiento = dayjs(alumno['Fecha_vencimiento'], ['D/M/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD']);
    const hoyDate = dayjs();

    if (hoyDate.isAfter(vencimiento, 'day')) {
      return res.status(403).json({
        message: `El plan de ${alumno.Nombre || alumno['Nombre']} venció el ${vencimiento.format('DD/MM/YYYY')}`,
        fechaVencimiento: vencimiento.format('DD/MM/YYYY'),
      });
    }


    const hoy = dayjs().format('DD-MM-YYYY');
    const asistencias = await getAsistenciasFromSheet();

    const asistenciasFormateadas = asistencias.map(a => {
      const fecha = dayjs(a.Fecha, ['D/M/YYYY', 'DD/MM/YYYY']);
      return { ...a, Fecha: fecha.format('DD-MM-YYYY') };
    });

    const yaAsistioHoy = asistenciasFormateadas.some(a => a.DNI === dni && a.Fecha === hoy);

    if (yaAsistioHoy) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre || alumno['Nombre']} ya registró asistencia hoy`
      });
    }

    const nuevaAsistencia = {
      Fecha: hoy,
      Hora: dayjs().format('HH:mm'),
      DNI: alumno.DNI,
      Nombre: alumno.Nombre || alumno['Nombre'],
      Plan: alumno.Plan,
      Responsable: ''
    };

    await appendAsistenciaToSheet(nuevaAsistencia);

    // Emite el evento de asistencia registrada a través de Socket.IO
    const io = req.app.get('socketio');
    io.emit('asistencia-registrada', { dni, nuevaAsistencia });

    const plan = alumno.Plan;
    const esIlimitado = PLANES_ILIMITADOS.includes(plan);

    if (esIlimitado) {
      return res.status(201).json({
        message: 'Asistencia registrada correctamente',
        plan,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    const pagadas = parseInt(alumno['Clases_pagadas'] || '0', 10);
    const realizadasActual = parseInt(alumno['Clases_realizadas'] || '0', 10);

    if (realizadasActual >= pagadas) {
      return res.status(409).json({
        message: `El alumno ${alumno.Nombre || alumno['Nombre']} ya agotó sus clases pagadas`,
        plan,
        clasesPagadas: pagadas,
        clasesRealizadas: realizadasActual,
        fechaVencimiento: alumno['Fecha_vencimiento']
      });
    }

    const realizadas = realizadasActual + 1;

    await updateAlumnoByDNI(dni, {
      'Clases_realizadas': String(realizadas),
    });

    io.emit('asistencia-actualizada', { dni, clasesRealizadas: realizadas });

    res.status(201).json({
      message: 'Asistencia registrada correctamente',
      plan,
      clasesPagadas: pagadas,
      clasesRealizadas: realizadas,
      fechaVencimiento: alumno['Fecha_vencimiento']
    });
  } catch (error) {
    console.error('Error al registrar asistencia:', error);
    res.status(500).json({ message: 'Error al registrar la asistencia' });
  }
};

export const getAsistenciasPorDNI = async (req, res) => {
  try {
    const dni = req.params.dni;
    if (!dni) return res.status(400).json({ message: 'DNI es requerido' });

    const asistencias = await getAsistenciasFromSheet();
    const filtradas = asistencias.filter(a => a.DNI === dni);

    res.json(filtradas);
  } catch (error) {
    console.error('Error al obtener asistencias por DNI:', error);
    res.status(500).json({ message: 'Error al obtener asistencias del alumno' });
  }
};