"use client"

import React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Piezas compartidas para los filtros de las tablas (misma barra que en Pagos).

export const focoBrand =
  "border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"

export function FilterBar({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-border/60 bg-muted/30 p-2 ${className}`}>
      {children}
    </div>
  )
}

export function FilterSearch({
  value,
  onChange,
  placeholder,
  className = "min-w-[200px] flex-1",
}: {
  value: string
  onChange: (v: string) => void
  placeholder: string
  className?: string
}) {
  return (
    <div className={`relative ${className}`}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`h-10 rounded-xl bg-card pl-9 ${focoBrand}`}
      />
    </div>
  )
}

export function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  className = "w-[160px]",
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  placeholder: string
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label={placeholder} className={`h-10 rounded-xl bg-card ${className} ${focoBrand}`}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Envuelve al DatePicker existente para que tenga la misma altura que el resto de la barra
export function FilterDate({ children }: { children: React.ReactNode }) {
  return <div className="w-[170px] [&_button]:h-10 [&_button]:bg-card">{children}</div>
}
