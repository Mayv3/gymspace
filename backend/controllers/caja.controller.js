import {
    appendCajaToSheet,
    updateCajaByID,
    deleteCajaByID,
    getCajasFromSheet
  } from '../services/googleSheets.js';
  import dayjs from 'dayjs';
  
  export const crearCaja = async (req, res) => {
    try {
      const { turno, saldoInicial, responsable } = req.body;
  
      if (!turno || !responsable) {
        return res.status(400).json({ message: 'Campos requeridos: turno, responsable' });
      }
  
      const hoy = dayjs().format('YYYY-MM-DD');
      const cajas = await getCajasFromSheet();
  
      // 🔒 Verificar si ya existe una caja para este turno y fecha
      const yaExiste = cajas.find(c => c.Fecha === hoy && c.Turno.toLowerCase() === turno.toLowerCase());
      if (yaExiste) {
        return res.status(409).json({
          message: `Ya existe una caja registrada para el turno "${turno}" hoy`
        });
      }
  
      let saldoInicialFinal = saldoInicial || '';
  
      if (turno.toLowerCase() === 'tarde' && !saldoInicial) {
        const cajaManiana = cajas.find(c => c.Fecha === hoy && c.Turno.toLowerCase() === 'mañana');
  
        saldoInicialFinal = cajaManiana?.['Total Final'] || '0';
      }
  
      const nuevaCaja = {
        Fecha: hoy,
        Turno: turno,
        'Hora Apertura': dayjs().format('HH:mm'),
        'Saldo Inicial': saldoInicialFinal,
        'Total Efectivo': '',
        'Total Tarjeta': '',
        'Total Final': '',
        Responsable: responsable,
        'Hora Cierre': ''
      };
  
      await appendCajaToSheet(nuevaCaja);
  
      res.status(201).json({
        message: `Caja de ${turno} registrada correctamente`,
        saldoInicial: saldoInicialFinal
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
  