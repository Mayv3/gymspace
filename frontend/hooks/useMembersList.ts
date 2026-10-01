import { useEffect, useRef, useState } from "react"
import { useAppData } from "@/context/AppDataContext"

// Filtros que entiende GET /api/alumnos (vacío = sin filtrar)
export interface MembersListFilters {
  q?: string
  nombre?: string
  profe?: string
  sexo?: string
  plan?: string
  edadMin?: string
  edadMax?: string
}

const PAGE_SIZE = 10

// Lista de socios paginada en el servidor. Vuelve a la página 1 cuando cambian los filtros
// y se recarga sola cuando alguien llama a refreshMembers() del contexto.
export function useMembersList<T = any>(filters: MembersListFilters, { conTotalGeneral = false } = {}) {
  const { membersVersion } = useAppData()
  const [members, setMembers] = useState<T[]>([])
  const [total, setTotal] = useState(0)
  const [totalGeneral, setTotalGeneral] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const requestId = useRef(0)

  // Esperar a que se deje de escribir antes de pedir
  const filtrosKey = JSON.stringify(filters)
  const [filtrosDebounced, setFiltrosDebounced] = useState(filtrosKey)
  useEffect(() => {
    const t = setTimeout(() => {
      setFiltrosDebounced(filtrosKey)
      setPage(1)
    }, 300)
    return () => clearTimeout(t)
  }, [filtrosKey])

  useEffect(() => {
    const id = ++requestId.current
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) })
    for (const [k, v] of Object.entries(JSON.parse(filtrosDebounced) as MembersListFilters)) {
      if (v != null && String(v).trim() !== "") params.append(k, String(v).trim())
    }
    if (conTotalGeneral) params.append("conTotalGeneral", "1")

    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: { data: T[]; total: number; totalGeneral?: number }) => {
        if (id !== requestId.current) return // respuesta vieja
        setMembers(json.data)
        setTotal(json.total)
        if (json.totalGeneral != null) setTotalGeneral(json.totalGeneral)
      })
      .catch(err => console.error("Error al cargar socios:", err))
      .finally(() => {
        if (id === requestId.current) setLoading(false)
      })
  }, [filtrosDebounced, page, membersVersion, conTotalGeneral])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  // Si se borró el último socio de la última página, volver a la última que exista
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages)
  }, [loading, page, totalPages])

  return { members, total, totalGeneral, page, setPage, totalPages, pageSize: PAGE_SIZE, loading }
}
