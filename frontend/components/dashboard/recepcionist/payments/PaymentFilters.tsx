"use client"

import React from "react"
import { CalendarDays, Check, ChevronsUpDown, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FilterSearch, FilterSelect } from "../FilterBar"



export interface PaymentFiltersProps {
  searchTerm: string
  setSearchTerm: (v: string) => void
  tipoFiltro: string
  setTipoFiltro: (v: string) => void
  itemFiltro: string
  setItemFiltro: (v: string) => void
  itemsDisponibles: string[]
  selectedDay?: number
  setSelectedDay: (n?: number) => void
  selectedMonth?: number
  setSelectedMonth: (n?: any) => void
  selectedYear?: number
  setSelectedYear: (n?: any) => void
  selectedShift: string
  setSelectedShift: (s: string) => void
  onFiltrar: () => void
}

const TIPOS = [
  { value: "todos", label: "Todos" },
  { value: "GIMNASIO", label: "Gimnasio" },
  { value: "CLASE", label: "Clase" },
  { value: "PRODUCTO", label: "Producto" },
  { value: "SERVICIO", label: "Servicio" },
]

const TURNOS = [
  { value: "todos", label: "Todos" },
  { value: "mañana", label: "Mañana" },
  { value: "tarde", label: "Tarde" },
]

const sinSpinner =
  "[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"

/* ---------- piezas compartidas ---------- */

function Buscador({ p, className = "" }: { p: PaymentFiltersProps; className?: string }) {
  return <FilterSearch value={p.searchTerm} onChange={p.setSearchTerm} placeholder="Buscar alumno o plan" className={`relative ${className}`} />
}

function SelectorTipo({ p, className = "w-[140px]" }: { p: PaymentFiltersProps; className?: string }) {
  return <FilterSelect value={p.tipoFiltro} onChange={p.setTipoFiltro} options={TIPOS} placeholder="Tipo" className={className} />
}

function SelectorItem({ p, className = "w-[190px]" }: { p: PaymentFiltersProps; className?: string }) {
  const [abierto, setAbierto] = React.useState(false)
  if (p.itemsDisponibles.length === 0) return null
  const elegir = (valor: string) => {
    p.setItemFiltro(valor)
    setAbierto(false)
  }
  return (
    <Popover open={abierto} onOpenChange={setAbierto}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={abierto}
          aria-label="Producto o servicio"
          className={`inline-flex h-10 items-center justify-between gap-2 rounded-xl border bg-card px-3 text-sm outline-none focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 ${className} ${p.itemFiltro === "todos" ? "border-input text-muted-foreground" : "border-brand-500 font-semibold text-foreground"}`}
        >
          <span className="truncate">{p.itemFiltro === "todos" ? "Producto / servicio" : p.itemFiltro}</span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[260px] rounded-xl p-0">
        <Command>
          <CommandInput placeholder={`Buscar entre ${p.itemsDisponibles.length} productos y servicios`} />
          <CommandList>
            <CommandEmpty>No hay productos ni servicios con ese nombre.</CommandEmpty>
            <CommandGroup>
              <CommandItem value="Todos" onSelect={() => elegir("todos")}>
                <Check className={`mr-2 h-4 w-4 ${p.itemFiltro === "todos" ? "opacity-100" : "opacity-0"}`} />
                Todos
              </CommandItem>
              {p.itemsDisponibles.map((item) => (
                <CommandItem key={item} value={item} onSelect={() => elegir(item)}>
                  <Check className={`mr-2 h-4 w-4 ${p.itemFiltro === item ? "opacity-100" : "opacity-0"}`} />
                  <span className="truncate">{item}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function Fecha({ p }: { p: PaymentFiltersProps }) {
  const campo = (
    valor: number | undefined,
    set: (n?: any) => void,
    min: number,
    max: number,
    ancho: string,
    etiqueta: string,
    placeholder: string
  ) => (
    <input
      type="number"
      min={min}
      max={max}
      value={valor ?? ""}
      placeholder={placeholder}
      aria-label={etiqueta}
      onChange={(e) => set(e.target.value ? Number(e.target.value) : undefined)}
      className={`${ancho} bg-transparent text-center text-sm font-semibold tabular-nums outline-none placeholder:font-normal placeholder:text-muted-foreground ${sinSpinner}`}
    />
  )
  return (
    <div className="inline-flex h-10 items-center gap-1 rounded-xl border border-input bg-card px-3 focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/10">
      <CalendarDays className="mr-1 h-4 w-4 text-muted-foreground" />
      {campo(p.selectedDay, p.setSelectedDay, 1, 31, "w-7", "Día", "DD")}
      <span className="text-muted-foreground">/</span>
      {campo(p.selectedMonth, p.setSelectedMonth, 1, 12, "w-7", "Mes", "MM")}
      <span className="text-muted-foreground">/</span>
      {campo(p.selectedYear, p.setSelectedYear, 2000, 2100, "w-11", "Año", "AAAA")}
    </div>
  )
}

function Turnos({ p }: { p: PaymentFiltersProps }) {
  const sinElegir = p.selectedShift === "todos"
  return (
    <div
      role="group"
      aria-label="Turno"
      className={`inline-flex h-10 items-center rounded-xl border bg-muted/50 p-0.5 ${sinElegir ? "animate-blink border-brand-500" : "border-input"}`}
    >
      {TURNOS.map((t) => (
        <button
          key={t.value}
          type="button"
          aria-pressed={p.selectedShift === t.value}
          onClick={() => p.setSelectedShift(t.value)}
          className={`h-full rounded-[10px] px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${
            p.selectedShift === t.value ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

function BotonFiltrar({ p, className = "" }: { p: PaymentFiltersProps; className?: string }) {
  return (
    <Button
      onClick={p.onFiltrar}
      className={`h-10 rounded-xl bg-brand-500 font-bold text-white shadow-brand-btn btn-press hover:bg-brand-600 ${className}`}
    >
      Filtrar
    </Button>
  )
}

export function PaymentFilters(p: PaymentFiltersProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-2">
      <Buscador p={p} className="min-w-[200px] flex-1" />
      <SelectorTipo p={p} />
      <SelectorItem p={p} />
      <Fecha p={p} />
      <Turnos p={p} />
      <BotonFiltrar p={p} />
    </div>
  )
}
