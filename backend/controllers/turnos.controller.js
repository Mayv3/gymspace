import {
    getTurnosFromSheet,
    appendTurnoToSheet,
    updateTurnoByID,
    deleteTurnoByID
} from '../services/googleSheets.js';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
dayjs.extend(customParseFormat); // para parsear DD/MM/YYYY

export const getTurnos = async (req, res) => {
  try {
    const { fecha } = req.query;
    const turnos = await getTurnosFromSheet();

    let turnosFiltrados = turnos;

    if (fecha) {
      const fechaInicio = dayjs(fecha, "DD/MM/YYYY");
      const fechaFin = fechaInicio.add(8, "day");

      turnosFiltrados = turnos.filter(turno => {
        const fechaTurno = dayjs(turno.Fecha_turno, ["D/M/YYYY", "DD/MM/YYYY"], true);

        if (!fechaTurno.isValid()) return false;

        return fechaTurno.isSame(fechaInicio, "day") ||
          (fechaTurno.isAfter(fechaInicio) && fechaTurno.isBefore(fechaFin));
      });
    }

    turnosFiltrados.sort((a, b) => {
      const fechaA = dayjs(a.Fecha_turno, ["D/M/YYYY", "DD/MM/YYYY"], true);
      const fechaB = dayjs(b.Fecha_turno, ["D/M/YYYY", "DD/MM/YYYY"], true);
      return fechaA.valueOf() - fechaB.valueOf();
    });

    res.json(turnosFiltrados);
  } catch (error) {
    console.error('Error al obtener turnos:', error);
    res.status(500).json({ message: 'Error al obtener turnos' });
  }
};

export const createTurno = async (req, res) => {
  try {
    const { tipo, fecha_turno, profesional, responsable, hora} = req.body;

    if (!tipo || !fecha_turno || !profesional || !responsable) {
      return res.status(400).json({ message: 'Faltan campos obligatorios' });
    }

    const nuevoTurno = {
      Tipo: tipo,
      Fecha_turno: fecha_turno,
      Profesional: profesional,
      Responsable: responsable,
      Fecha: dayjs().format('DD/MM/YYYY'),
      Hora: hora
    };

    const nuevoTurnoGeneradoEnSheet = await appendTurnoToSheet(nuevoTurno);

    res.status(201).json(nuevoTurnoGeneradoEnSheet);
  } catch (error) {
    console.error('Error al crear turno:', error);
    res.status(500).json({ message: 'Error al crear turno' });
  }
};

export const updateTurno = async (req, res) => {
    try {
      const { id } = req.params;
      const nuevosDatos = req.body;
  
      const actualizado = await updateTurnoByID(id, nuevosDatos);
  
      if (!actualizado) {
        return res.status(404).json({ message: 'Turno no encontrado' });
      }
  
      const turnos = await getTurnosFromSheet();
      const turnoActualizado = turnos.find(t => t.ID === id);
      console.log(turnoActualizado)
      res.json(turnoActualizado);
    } catch (error) {
      console.error('Error al actualizar turno:', error);
      res.status(500).json({ message: 'Error al actualizar turno' });
    }
  };

export const deleteTurno = async (req, res) => {
    try {
        const { id } = req.params;

        const eliminado = await deleteTurnoByID(id);

        if (!eliminado) {
            return res.status(404).json({ message: 'Turno no encontrado' });
        }

        res.json({ message: 'Turno eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar turno:', error);
        res.status(500).json({ message: 'Error al eliminar turno' });
    }
};

