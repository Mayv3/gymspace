import { findAlumnoByDNI } from '../services/alumnos.service.js';
import { listRoles } from '../services/roles.service.js';

// La hoja de Roles casi no cambia y leerla de Google Sheets tarda ~0,5 s en cada login
const ROLES_TTL_MS = 5 * 60 * 1000;
let rolesCache = null;
let rolesCacheAt = 0;

async function getRolesCacheados() {
  if (rolesCache && Date.now() - rolesCacheAt < ROLES_TTL_MS) return rolesCache;
  rolesCache = await listRoles();
  rolesCacheAt = Date.now();
  return rolesCache;
}

export const getRolPorDNI = async (req, res) => {
  try {
    const dni = (req.params.dni || '').trim();
    if (!dni) return res.status(400).json({ message: 'DNI no proporcionado' });

    const [roles, alumno] = await Promise.all([
      getRolesCacheados(),
      findAlumnoByDNI(dni),
    ]);

    const userRol = roles.find(r => r.DNI?.trim() === dni);

    if (userRol) {
      return res.json({
        dni: userRol.DNI,
        nombre: userRol.Nombre || "Sin nombre",
        rol: userRol.Rol?.trim() || "Miembro"
      });
    }

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
