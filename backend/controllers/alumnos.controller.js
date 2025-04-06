import {
    getAlumnosFromSheet,
    appendAlumnoToSheet,
    updateAlumnoByDNI,
    deleteAlumnoByDNI,
} from '../services/googleSheets.js';

export const getAlumnos = async (req, res) => {
    try {
        const alumnos = await getAlumnosFromSheet();
        res.json(alumnos);
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        res.status(500).json({ message: 'Error al obtener los alumnos' });
    }
};

export const addAlumno = async (req, res) => {
    try {
        const alumno = req.body;
        console.log('Alumno recibido:', alumno);
        if (!alumno.DNI || !alumno['Nombre'] || !alumno.Plan) {
            return res.status(400).json({ message: 'Faltan campos obligatorios' });
        }

        await appendAlumnoToSheet(alumno);
        res.status(201).json({ message: 'Alumno agregado correctamente' });
    } catch (error) {
        console.error('Error al agregar alumno:', error);
        res.status(500).json({ message: error.message || 'Error al agregar el alumno' });
    }
};

export const updateAlumno = async (req, res) => {
    try {
        const dni = req.params.dni;
        const alumnoData = req.body;

        const actualizado = await updateAlumnoByDNI(dni, alumnoData);

        if (actualizado) {
            res.json({ message: 'Alumno actualizado correctamente' });
        } else {
            res.status(404).json({ message: 'Alumno no encontrado' });
        }
    } catch (error) {
        console.error('Error al actualizar alumno:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const deleteAlumno = async (req, res) => {
    try {
        const dni = req.params.dni;

        const eliminado = await deleteAlumnoByDNI(dni);

        if (eliminado) {
            res.json({ message: 'Alumno eliminado correctamente' });
        } else {
            res.status(404).json({ message: 'Alumno no encontrado' });
        }
    } catch (error) {
        console.error('Error al eliminar alumno:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const getAlumnoByDNI = async (req, res) => {
    try {
      const dni = req.params.dni;
  
      const alumnos = await getAlumnosFromSheet();
      const alumno = alumnos.find(a => a.DNI === dni);
  
      if (!alumno) {
        return res.status(404).json({ message: 'Alumno no encontrado' });
      }
  
      res.json(alumno);
    } catch (error) {
      console.error('Error al obtener alumno por DNI:', error);
      res.status(500).json({ message: 'Error interno del servidor' });
    }
  };
  