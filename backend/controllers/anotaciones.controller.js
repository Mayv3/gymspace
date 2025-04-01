import {
    getAnotacionesFromSheet,
    appendAnotacionToSheet,
    updateAnotacionInSheet,
    deleteAnotacionInSheet
  } from '../services/googleSheets.js';
  
  import dayjs from 'dayjs';
  
  export const getAnotaciones = async (req, res) => {
    try {
      const { fecha } = req.query;
      const anotaciones = await getAnotacionesFromSheet();
  
      const filtradas = fecha
        ? anotaciones.filter(a => a.Fecha === fecha)
        : anotaciones;
  
      res.json(filtradas);
    } catch (error) {
      console.error('Error al obtener anotaciones:', error);
      res.status(500).json({ message: 'Error al obtener anotaciones' });
    }
  };
  
  export const createAnotacion = async (req, res) => {
    try {
      const { 'Alumno DNI': dni, Nota, ProfeaCargo } = req.body;
  
      if (!dni || !Nota || !ProfeaCargo) {
        return res.status(400).json({ message: 'Faltan campos requeridos' });
      }
  
      const nueva = {
        Fecha: dayjs().format('YYYY-MM-DD'),
        Hora: dayjs().format('HH:mm'),
        'Alumno DNI': dni,
        Nota,
        ProfeaCargo
      };
  
      await appendAnotacionToSheet(nueva);
      res.status(201).json({ message: 'Anotación registrada correctamente' });
    } catch (error) {
      console.error('Error al registrar anotación:', error);
      res.status(500).json({ message: 'Error al registrar anotación' });
    }
  };
  
  export const updateAnotacionByID = async (req, res) => {
    try {
      const { id } = req.params;
      const nuevosDatos = req.body;
  
      const actualizado = await updateAnotacionInSheet(id, nuevosDatos);
      if (!actualizado) return res.status(404).json({ message: 'Anotación no encontrada' });
  
      res.json({ message: 'Anotación actualizada correctamente' });
    } catch (error) {
      console.error('Error al editar anotación:', error);
      res.status(500).json({ message: 'Error al editar anotación' });
    }
  };
  
  export const deleteAnotacionByID = async (req, res) => {
    try {
      const { id } = req.params;
  
      const eliminado = await deleteAnotacionInSheet(id);
      if (!eliminado) return res.status(404).json({ message: 'Anotación no encontrada' });
  
      res.json({ message: 'Anotación eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar anotación:', error);
      res.status(500).json({ message: 'Error al eliminar anotación' });
    }
  };
  