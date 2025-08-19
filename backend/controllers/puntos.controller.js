import { getHistorialPuntosByDNI } from "../services/googleSheets.js";

export const getHistorialPuntos = async (req, res) => {
    try {
      const { dni } = req.params;
      if (!dni) {
        return res.status(400).json({ ok: false, error: "DNI requerido" });
      }
  
      const historial = await getHistorialPuntosByDNI(dni);
  
      return res.json({
        ok: true,
        dni,
        historial,
        total: historial.reduce((acc, r) => acc + Number(r.Puntos || 0), 0),
      });
    } catch (error) {
      console.error("❌ Error en getHistorialPuntos:", error);
      return res.status(500).json({ ok: false, error: "Error interno del servidor" });
    }
  };