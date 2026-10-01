import { useState, useCallback, useEffect, useRef } from "react"
import { Payment } from "@/models/dashboard"

export interface PaymentsFilters {
  dia?: number
  mes?: number
  anio?: number
  turno?: string
}

// Totales de TODOS los pagos del filtro (los suma Postgres, no depende de la página)
export interface PaymentsSummary {
  total: number
  efectivo: number
  tarjeta: number
  porTipo: Record<string, Record<string, number>>
}

export interface PaymentsPagination {
  page: number
  pageSize: number
  total: number
  totalPages: number
  setPage: (page: number) => void
  search: string
  setSearch: (search: string) => void
  tipo: string
  setTipo: (tipo: string) => void
  loading: boolean
}

const PAGE_SIZE = 10
const RESUMEN_VACIO: PaymentsSummary = { total: 0, efectivo: 0, tarjeta: 0, porTipo: {} }

function filtrosAParams(filters: PaymentsFilters) {
  const params = new URLSearchParams()
  if (filters.dia != null) params.append("dia", String(filters.dia))
  if (filters.mes != null) params.append("mes", String(filters.mes))
  if (filters.anio != null) params.append("anio", String(filters.anio))
  if (filters.turno) params.append("turno", filters.turno)
  return params
}

export function usePayments() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [summary, setSummary] = useState<PaymentsSummary>(RESUMEN_VACIO)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearchState] = useState("")
  const [searchDebounced, setSearchDebounced] = useState("")
  const [tipo, setTipoState] = useState("todos")
  const [loading, setLoading] = useState(false)
  // filters === null hasta que la pantalla pida pagos por primera vez
  const [filters, setFilters] = useState<PaymentsFilters | null>(null)
  // Se incrementa en cada refreshPayments para recargar aunque los filtros sean los mismos
  const [version, setVersion] = useState(0)
  const pageRequestId = useRef(0)
  const summaryRequestId = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setSearchDebounced(search), 300)
    return () => clearTimeout(t)
  }, [search])

  const setSearch = useCallback((value: string) => {
    setSearchState(value)
    setPage(1)
  }, [])

  const setTipo = useCallback((value: string) => {
    setTipoState(value)
    setPage(1)
  }, [])

  // Página actual
  useEffect(() => {
    if (!filters) return
    const requestId = ++pageRequestId.current
    const params = filtrosAParams(filters)
    params.append("page", String(page))
    params.append("pageSize", String(PAGE_SIZE))
    if (searchDebounced.trim()) params.append("search", searchDebounced.trim())
    if (tipo !== "todos") params.append("tipo", tipo)

    setLoading(true)
    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((json: { data: Payment[]; total: number }) => {
        if (requestId !== pageRequestId.current) return // llegó tarde una respuesta vieja
        setPayments(json.data)
        setTotal(json.total)
      })
      .catch(err => console.error("Error al cargar pagos:", err))
      .finally(() => {
        if (requestId === pageRequestId.current) setLoading(false)
      })
  }, [filters, version, page, searchDebounced, tipo])

  // Totales del filtro (no dependen de la página, la búsqueda ni el tipo)
  useEffect(() => {
    if (!filters) return
    const requestId = ++summaryRequestId.current

    fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/resumen?${filtrosAParams(filters).toString()}`)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .then((filas: { tipo: string; metodo: string; total: number }[]) => {
        if (requestId !== summaryRequestId.current) return
        const resumen: PaymentsSummary = { total: 0, efectivo: 0, tarjeta: 0, porTipo: {} }
        for (const { tipo, metodo, total } of filas) {
          const t = tipo || "Sin tipo"
          const m = metodo || "Sin método"
          resumen.porTipo[t] ??= {}
          resumen.porTipo[t][m] = (resumen.porTipo[t][m] || 0) + total
          resumen.total += total
          if (m.toLowerCase() === "efectivo") resumen.efectivo += total
          else if (m.toLowerCase() === "tarjeta") resumen.tarjeta += total
        }
        setSummary(resumen)
      })
      .catch(err => console.error("Error al cargar resumen de pagos:", err))
  }, [filters, version])

  const refreshPayments = useCallback(async (nuevosFiltros: PaymentsFilters) => {
    setFilters(nuevosFiltros)
    setPage(1)
    setVersion(v => v + 1)
  }, [])

  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1)

  // Si se borró el último pago de la última página, volver a la última que exista
  useEffect(() => {
    if (!loading && page > totalPages) setPage(totalPages)
  }, [loading, page, totalPages])

  const pagination: PaymentsPagination = {
    page,
    pageSize: PAGE_SIZE,
    total,
    totalPages,
    setPage,
    search,
    setSearch,
    tipo,
    setTipo,
    loading,
  }

  return { payments, summary, pagination, refreshPayments }
}
