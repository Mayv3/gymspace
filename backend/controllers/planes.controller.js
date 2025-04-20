import dayjs from 'dayjs';
import {
    getPlanesFromSheet,
    appendPlanToSheet,
    updatePlanInSheet,
    deletePlanInSheet,
    appendAumentoToSheet
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
      const { Tipo, 'Plan o Producto': nombre, Precio, numero_Clases } = req.body;
  
      if (!Tipo || !nombre || !Precio) {
        return res.status(400).json({ message: 'Faltan campos obligatorios' });
      }
  
      await appendPlanToSheet({ Tipo, 'Plan o Producto': nombre, Precio, numero_Clases });
  
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
  
      const planes    = await getPlanesFromSheet();
      const planViejo = planes.find(p => p.ID === id);
      if (!planViejo) {
        return res.status(404).json({ message: 'No se encontró el plan' });
      }
  
      let registroDeAumento = null;
      if (nuevosDatos.Precio != null) {
        const precioAnterior = parseFloat(planViejo.Precio);
        const precioNuevo    = parseFloat(nuevosDatos.Precio);
  
        console.log('Precio anterior vs nuevo:', precioAnterior, precioNuevo);
  
        if (isNaN(precioAnterior) || isNaN(precioNuevo)) {
          return res.status(400).json({ message: 'Precio anterior o nuevo no válido' });
        }
  
        if (precioNuevo !== precioAnterior) {
          const porcentaje = ((precioNuevo - precioAnterior) / precioAnterior) * 100;
          registroDeAumento = {
            Fecha:              dayjs().format('DD/MM/YYYY'),
            Precio_anterior:    precioAnterior,
            Precio_actualiza:   precioNuevo,
            Porcentaje_aumento: `${porcentaje.toFixed(2)}%`,
            Plan:               planViejo['Plan o Producto']
          };
        }
      }
  
      const actualizado = await updatePlanInSheet(id, nuevosDatos);
      if (!actualizado) {
        return res.status(404).json({ message: 'No se encontró el plan al actualizar' });
      }
  
      if (registroDeAumento) {
        await appendAumentoToSheet(registroDeAumento);
      }
  
      const msg = registroDeAumento
        ? 'Plan y registro de aumento guardados correctamente'
        : 'Plan actualizado correctamente';
  
      return res.json({ message: msg });
  
    } catch (error) {
      console.error('Error al editar plan:', error);
      return res.status(500).json({ message: 'Error al editar plan' });
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
  