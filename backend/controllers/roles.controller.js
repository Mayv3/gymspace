import { getAlumnosFromSheet, getRolesFromSheet } from '../services/googleSheets.js';

export const getRolPorDNI = async (req, res) => {
  try {
    const dni = (req.params.dni || '').trim();
    if (!dni) return res.status(400).json({ message: 'DNI no proporcionado' });

    const roles = await getRolesFromSheet();
    const userRol = roles.find(r => r.DNI?.trim() === dni);

    if (userRol) {
      return res.json({
        dni: userRol.DNI,
        nombre: userRol.Nombre || "Sin nombre",
        rol: userRol.Rol?.trim() || "Miembro"
      });
    }

    const alumnos = await getAlumnosFromSheet();
    const alumno = alumnos.find(a => a.DNI?.trim() === dni);

    if (alumno) {
      return res.json({
        dni: alumno.DNI,
        nombre: alumno.Nombre || "Sin nombre",
        rol: "Miembro"
      });
    }

    return res.status(404).json({ message: 'Usuario no encontrado en roles ni en alumnos' });

  } catch (error) {
    console.error('Error al obtener rol:', error);
    res.status(500).json({ message: 'Error al obtener el rol del usuario' });
  }
};


