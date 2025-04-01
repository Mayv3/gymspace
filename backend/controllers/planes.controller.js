import {
    getPlanesFromSheet,
    appendPlanToSheet,
    updatePlanInSheet,
    deletePlanInSheet
  } from '../services/googleSheets.js';
  
  export const getPlanes = async (req, res) => {
    try {
      const { tipo } = req.query;
      const planes = await getPlanesFromSheet();
  
      const filtrados = tipo
        ? planes.filter(p => p.Tipo?.toLowerCase() === tipo.toLowerCase())
        : planes;
  
      res.json(filtrados);
    } catch (error) {
      console.error('Error al obtener planes:', error);
      res.status(500).json({ message: 'Error al obtener planes' });
    }
  };
  
  export const createPlan = async (req, res) => {
    try {
      const { Tipo, 'Plan o Producto': nombre, Precio } = req.body;
  
      if (!Tipo || !nombre || !Precio) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }
  
      await appendPlanToSheet({ Tipo, 'Plan o Producto': nombre, Precio });
  
      res.status(201).json({ message: 'Plan o producto agregado correctamente' });
    } catch (error) {
      console.error('Error al crear plan:', error);
      res.status(500).json({ message: 'Error al crear plan' });
    }
  };
  
  export const updatePlanByID = async (req, res) => {
    try {
      const { id } = req.params;
      const nuevosDatos = req.body;
  
      const actualizado = await updatePlanInSheet(id, nuevosDatos);
      if (!actualizado) return res.status(404).json({ message: 'No se encontró el plan' });
  
      res.json({ message: 'Plan actualizado correctamente' });
    } catch (error) {
      console.error('Error al editar plan:', error);
      res.status(500).json({ message: 'Error al editar plan' });
    }
  };
  
  export const deletePlanByID = async (req, res) => {
    try {
      const { id } = req.params;
  
      const eliminado = await deletePlanInSheet(id);
      if (!eliminado) return res.status(404).json({ message: 'No se encontró el plan' });
  
      res.json({ message: 'Plan eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar plan:', error);
      res.status(500).json({ message: 'Error al eliminar plan' });
    }
  };
  