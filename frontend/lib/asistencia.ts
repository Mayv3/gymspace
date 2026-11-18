// Registro de asistencia del kiosco (/asistencia).
// Sin timeout, una request colgada deja el kiosco en "Registrando..." hasta que se redeploya el backend.

export const MENSAJE_SIN_CONEXION = 'No se pudo conectar con el sistema. Probá de nuevo.'
const TIMEOUT_MS = 15000

type Opciones = {
  backendUrl?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

export type ResultadoAsistencia = {
  // false si no hubo respuesta válida del backend (timeout, sin red, respuesta rota)
  conectado: boolean
  data: { success: boolean; message?: string; [campo: string]: any }
}

// El backend avisa "ya registró" con un mensaje (no con un código propio); se muestra distinto a un error.
export function tipoResultado(data: ResultadoAsistencia['data']): 'exito' | 'yaRegistro' | 'error' {
  if (data.success) return 'exito'
  if (data.message?.toLowerCase().includes('ya registró')) return 'yaRegistro'
  return 'error'
}

export async function registrarAsistencia(dni: string, opciones: Opciones = {}): Promise<ResultadoAsistencia> {
  const {
    backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL,
    timeoutMs = TIMEOUT_MS,
    fetchImpl = fetch,
  } = opciones

  // AbortController + setTimeout en vez de AbortSignal.timeout para que ande también en tablets viejas.
  const controller = new AbortController()
  const corte = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetchImpl(`${backendUrl}/api/asistencias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dni }),
      signal: controller.signal,
    })
    const result = await res.json()
    return { conectado: true, data: { ...result, success: res.ok } }
  } catch (error) {
    console.error('❌ Error al registrar asistencia:', error)
    return { conectado: false, data: { success: false, message: MENSAJE_SIN_CONEXION } }
  } finally {
    clearTimeout(corte)
  }
}
