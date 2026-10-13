import {
    appendClaseDiariaToSheet,
    updateClaseDiariaByID,
    deleteClaseDiariaByID,
    getClasesDiariasFromSheet
} from '../services/googleSheets.js';
import dayjs from 'dayjs';

export const registrarClaseDiaria = async (req, res) => {
    try {
        const { tipoClase, cantidadPersonas, responsable } = req.body;

        if (!tipoClase || !cantidadPersonas || !responsable) {
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }
        
        const clase = {
            Fecha: dayjs().format('YYYY-MM-DD'),
            Tipo: tipoClase,
            Cantidad: cantidadPersonas,
            Responsable: responsable
        };

        await appendClaseDiariaToSheet(clase);

        res.status(201).json({ message: 'Clase diaria registrada con éxito' }, clase.ID );
    } catch (error) {
        console.error('Error al registrar clase diaria:', error);
        res.status(500).json({ message: 'Error al registrar clase diaria' });
    }
};

export const editarClaseDiaria = async (req, res) => {
    try {
        const id = req.params.id;
        const nuevosDatos = req.body;

        const editado = await updateClaseDiariaByID(id, nuevosDatos);
        if (!editado) return res.status(404).json({ message: 'Clase no encontrada' });

        res.json({ message: 'Clase actualizada correctamente' });
    } catch (error) {
        console.error('Error al editar clase:', error);
        res.status(500).json({ message: 'Error al editar clase diaria' });
    }
};

export const eliminarClaseDiaria = async (req, res) => {
    try {
        const id = req.params.id;

        const eliminada = await deleteClaseDiariaByID(id);
        if (!eliminada) return res.status(404).json({ message: 'Clase no encontrada' });

        res.json({ message: 'Clase eliminada correctamente' });
    } catch (error) {
        console.error('Error al eliminar clase:', error);
        res.status(500).json({ message: 'Error al eliminar clase diaria' });
    }
};

export const filtrarClasesDiarias = async (req, res) => {
  try {
    const { fecha, tipo } = req.query;
    const clases = await getClasesDiariasFromSheet();

    const filtradas = clases.filter(clase => {
      const claseFecha = dayjs(clase.Fecha, 'D/M/YYYY');

      const coincideFecha = fecha
        ? claseFecha.isSame(dayjs(fecha, 'YYYY-MM-DD'), 'day')
        : true;

      const coincideTipo = tipo
        ? clase['Tipo de Clase'].toLowerCase() === tipo.toLowerCase()
        : true;

      return coincideFecha && coincideTipo;
    });

    res.json(filtradas);
  } catch (error) {
    console.error('Error al filtrar clases diarias:', error);
    res.status(500).json({ message: 'Error al filtrar clases diarias' });
  }
};

