// Mensaje del login según el error: solo un 404 significa que el DNI no existe;
// el resto (timeout, sin red, error del servidor) es un problema de conexión.

export const MENSAJE_DNI_INEXISTENTE = 'No se pudo encontrar un usuario con ese DNI.'
export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el sistema. Probá de nuevo.'

export function mensajeErrorLogin(error: unknown): string {
  const status = (error as { response?: { status?: number } } | undefined)?.response?.status
  return status === 404 ? MENSAJE_DNI_INEXISTENTE : MENSAJE_SIN_CONEXION
}
