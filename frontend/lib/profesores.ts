// El campo "Profesor_asignado" viene como texto libre: "Almen/Lu", "Almen-lu", "-", etc.
// Estas funciones lo separan en nombres individuales para poder filtrar por profesor.

export const SIN_PROFESOR = "__sin_profesor__"

function capitalizar(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()
}

/** "Almen/lu" -> ["Almen", "Lu"]. Devuelve [] si no hay profesor ("", "-"). */
export function separarProfesores(valor?: string | null): string[] {
  const nombres = (valor || "")
    .split(/[\/,\-]+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(capitalizar)
  return Array.from(new Set(nombres))
}

/** Lista única y ordenada de profesores individuales de todos los valores. */
export function listarProfesores(valores: (string | null | undefined)[]): string[] {
  const unicos = new Set<string>()
  for (const v of valores) for (const p of separarProfesores(v)) unicos.add(p)
  return Array.from(unicos).sort((a, b) => a.localeCompare(b))
}

/** true si el valor incluye al profesor elegido (o no tiene ninguno, con SIN_PROFESOR). */
export function tieneProfesor(valor: string | null | undefined, elegido: string): boolean {
  const nombres = separarProfesores(valor)
  if (elegido === SIN_PROFESOR) return nombres.length === 0
  return nombres.some((p) => p.toLowerCase() === elegido.toLowerCase())
}
