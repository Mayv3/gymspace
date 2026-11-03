"use client"

import React from "react"
import axios from "axios"
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type ItemVenta = { tipo: string; item: string; cantidad: number; total: number }
type Fila = { name: string; total: number; cantidad: number }

const MESES = [
  "Todo el año", "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

const fmt = (n: number) => n.toLocaleString("es-AR")

function ChartTooltip({ active, payload, granTotal }: { active?: boolean; payload?: any[]; granTotal: number }) {
  if (!active || !payload?.length) return null
  const d: Fila = payload[0].payload
  const pct = granTotal > 0 ? (d.total / granTotal) * 100 : 0
  return (
    <div className="rounded-xl border border-border/60 bg-card px-3 py-2 text-xs shadow-floating">
      <p className="font-bold text-sm mb-1">{d.name}</p>
      <p className="text-muted-foreground">Unidades: <span className="font-bold text-foreground tabular-nums">{fmt(d.cantidad)}</span></p>
      <p className="text-muted-foreground">Ingreso: <span className="font-bold text-foreground tabular-nums">${fmt(d.total)}</span></p>
      <p className="text-muted-foreground">Del total: <span className="font-bold text-foreground tabular-nums">{pct.toFixed(1)}%</span></p>
    </div>
  )
}

export const SalesByItem = ({ anio }: { anio: number }) => {
  const [tipo, setTipo] = React.useState<"PRODUCTO" | "SERVICIO">("PRODUCTO")
  const [mes, setMes] = React.useState<number>(0)
  const [items, setItems] = React.useState<ItemVenta[]>([])
  const [loading, setLoading] = React.useState(false)
  const [busqueda, setBusqueda] = React.useState("")

  React.useEffect(() => {
    let cancelado = false
    setLoading(true)
    axios
      .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/items`, {
        params: { anio, tipo, ...(mes ? { mes } : {}) },
      })
      .then((res) => { if (!cancelado) setItems(res.data ?? []) })
      .catch((e) => { console.error("Error al cargar ventas por ítem:", e); if (!cancelado) setItems([]) })
      .finally(() => { if (!cancelado) setLoading(false) })
    return () => { cancelado = true }
  }, [anio, tipo, mes])

  const totalCantidad = items.reduce((s, i) => s + i.cantidad, 0)
  const totalMonto = items.reduce((s, i) => s + i.total, 0)

  // Todos los ítems, de mayor a menor ingreso
  const datos: Fila[] = items
    .map((i) => ({ name: i.item, total: i.total, cantidad: i.cantidad }))
    .sort((a, b) => b.total - a.total)
  // Escala naranja de la marca, de oscuro a claro, repartida entre todos los ítems
  const colorDe = (i: number) => {
    const t = datos.length > 1 ? i / (datos.length - 1) : 0
    return `hsl(${20 + t * 10}, 100%, ${38 + t * 42}%)`
  }
  // La búsqueda filtra la lista; conserva el índice original para mantener el color de cada ítem
  const termino = busqueda.trim().toLowerCase()
  const visibles = datos
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !termino || d.name.toLowerCase().includes(termino))
  const etiqueta =tipo === "PRODUCTO" ? "producto" : "servicio"

  return (
    <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow col-span-1 md:col-span-2 xl:col-span-2">
      <CardHeader className="flex flex-col gap-4 space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="font-bold">Ventas por {etiqueta}</CardTitle>
          <p className="mt-1 text-xs font-medium text-muted-foreground tabular-nums">
            {mes ? MESES[mes] : "Todo"} {anio} · {fmt(totalCantidad)} unidades · ${fmt(totalMonto)}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select value={tipo} onValueChange={(v) => setTipo(v as "PRODUCTO" | "SERVICIO")}>
            <SelectTrigger className="w-[130px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="PRODUCTO">Productos</SelectItem>
              <SelectItem value="SERVICIO">Servicios</SelectItem>
            </SelectContent>
          </Select>
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger className="w-[140px] rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-16">Cargando...</p>
        ) : datos.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">No hay ventas de {etiqueta}s en este período.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-[280px_1fr] md:items-center">
            <div className="relative mx-auto h-[250px] w-[250px] [&_.recharts-tooltip-wrapper]:!z-20">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<ChartTooltip granTotal={totalMonto} />} />
                  <Pie data={datos} dataKey="total" nameKey="name" innerRadius={78} outerRadius={115} paddingAngle={2} cornerRadius={5} stroke="none" animationDuration={700}>
                    {datos.map((d, i) => (
                      <Cell key={d.name} fill={colorDe(i)} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs font-medium text-muted-foreground">Ingreso</span>
                <span className="text-xl font-bold tabular-nums">${fmt(totalMonto)}</span>
              </div>
            </div>
            <div className="min-w-0">
            <div className="relative mb-3">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder={`Buscar ${etiqueta}`}
                aria-label={`Buscar ${etiqueta}`}
                className="rounded-xl pl-9 border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
              />
            </div>
            <ul className="max-h-[300px] space-y-1 overflow-y-auto pr-1">
              {visibles.length === 0 && (
                <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                  No hay {etiqueta}s que coincidan con "{busqueda}".
                </li>
              )}
              {visibles.map(({ d, i }) => {
                const pct = totalMonto > 0 ? (d.total / totalMonto) * 100 : 0
                return (
                  <li key={d.name} className="flex items-center gap-3 rounded-xl px-3 py-2 hover:bg-muted/40">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: colorDe(i) }} />
                    <span className="min-w-0 flex-1 truncate text-sm font-semibold" title={d.name}>{d.name}</span>
                    <span className="hidden text-xs text-muted-foreground tabular-nums sm:inline">{fmt(d.cantidad)} u.</span>
                    <span className="w-24 text-right text-sm font-bold tabular-nums">${fmt(d.total)}</span>
                    <span className="w-12 text-right text-xs font-medium text-muted-foreground tabular-nums">{pct.toFixed(0)}%</span>
                  </li>
                )
              })}
            </ul>
            </div>
          </div>
        )}

      </CardContent>
    </Card>
  )
}
