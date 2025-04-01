import { getRolesFromSheet } from '../services/googleSheets.js';

export const getRolPorDNI = async (req, res) => {
  try {
    const dni = (req.params.dni || '').trim();
    if (!dni) return res.status(400).json({ message: 'DNI no proporcionado' });

    const roles = await getRolesFromSheet();
    const user = roles.find(r => r.DNI?.trim() === dni);

    if (!user) {
      return res.status(404).json({ message: 'No se encontró un rol para ese DNI' });
    }

    res.json({
      dni: user.DNI,
      nombre: user.Nombre,
      rol: user.Rol
    });
  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ message: 'Error al obtener el rol del usuario' });
  }
};


