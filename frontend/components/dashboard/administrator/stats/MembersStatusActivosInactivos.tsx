"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"
import { Users, ChevronLeft, Mail, Calendar, CreditCard, TrendingUp, Clock, Info } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import axios from "axios"
import dayjs from "dayjs"
import "dayjs/locale/es"

dayjs.locale("es")

interface MembersStatusChartProps {
    estado: { activos: number; vencidos: number; abandonos: number }
}

interface AlumnoDetalle {
    DNI: string
    Nombre: string
    Email?: string
    Telefono?: string
    Plan?: string
    Fecha_inicio?: string
    Fecha_vencimiento?: string
    Clases_pagadas?: number
    Clases_realizadas?: number
    Precio?: string
    Tipo_de_plan?: string
    Pagos?: { Fecha_de_Pago: string; Monto: string; Tipo: string; Metodo_de_Pago: string }[]
}

const MESES = [
    { value: "1", label: "Enero" }, { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" }, { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" }, { value: "6", label: "Junio" },
    { value: "7", label: "Julio" }, { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" }, { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" }, { value: "12", label: "Diciembre" },
]

const BAR_COLORS = [
    { bg: "#22c55e", light: "#dcfce7", label: "Activos" },
    { bg: "#f59e0b", light: "#fef3c7", label: "Vencidos" },
    { bg: "#ef4444", light: "#fee2e2", label: "Abandonos" },
]

const COLORS = ["#ff6a00", "#ffa170", "#f04b00"]

const ESTADO_DESCRIPCION: Record<string, string> = {
    Activos: "Pagaron en el mes seleccionado",
    Vencidos: "Cuota vencida hace menos de 30 días",
    Abandonos: "Vencimiento dentro del mes seleccionado",
}

function getInitials(nombre: string) {
    return nombre.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase()
}

export const MembersStatusActivosInactivos = ({ estado }: MembersStatusChartProps) => {
    const isMobile = useIsMobile()
    const currentMonth = dayjs().month() + 1
    const currentYear = dayjs().year()

    const [selectedMes, setSelectedMes] = useState(String(currentMonth))
    const [selectedAnio, setSelectedAnio] = useState(String(currentYear))
    const [activosPorMes, setActivosPorMes] = useState<number | null>(null)
    const [alumnosActivos, setAlumnosActivos] = useState<{ dni: string; nombre: string; tipo: string }[]>([])
    const [modalActivosOpen, setModalActivosOpen] = useState(false)
    const [abandonosPorMes, setAbandonosPorMes] = useState<number | null>(null)
    const [porVencer, setPorVencer] = useState<number>(0)
    const [alumnosAbandonos, setAlumnosAbandonos] = useState<{ dni: string; nombre: string; fecha_vencimiento: string; tipo: string }[]>([])
    const [modalAbandonosOpen, setModalAbandonosOpen] = useState(false)
    const [alumnosVencidos, setAlumnosVencidos] = useState<{ dni: string; nombre: string; fecha_vencimiento: string; plan: string; tipo: string }[]>([])
    const [modalVencidosOpen, setModalVencidosOpen] = useState(false)
    const [alumnoDetalle, setAlumnoDetalle] = useState<AlumnoDetalle | null>(null)
    const [loadingDetalle, setLoadingDetalle] = useState(false)
    const [loading, setLoading] = useState(false)

    const fetchDatosPorMes = async () => {
        setLoading(true)
        try {
            const [resActivos, resAbandonos, resVencidos] = await Promise.all([
                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/activos-por-mes`, { params: { mes: selectedMes, anio: selectedAnio } }),
                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/abandonos-por-mes`, { params: { mes: selectedMes, anio: selectedAnio } }),
                axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/vencidos`),
            ])
            setActivosPorMes(resActivos.data.cantidad)
            setAlumnosActivos(resActivos.data.alumnos)
            setAbandonosPorMes(resAbandonos.data.cantidad)
            setAlumnosAbandonos(resAbandonos.data.alumnos)
            setPorVencer(resAbandonos.data.porVencer ?? 0)
            setAlumnosVencidos(resVencidos.data.alumnos)
        } catch (e) {
            console.error("Error datos-por-mes:", e)
        } finally {
            setLoading(false)
        }
    }

    const fetchDetalle = async (dni: string) => {
        setLoadingDetalle(true)
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${dni}`)
            setAlumnoDetalle(res.data)
        } catch (e) {
            console.error("Error detalle alumno:", e)
        } finally {
            setLoadingDetalle(false)
        }
    }

    useEffect(() => { fetchDatosPorMes() }, [selectedMes, selectedAnio])

    const activosCount = activosPorMes ?? estado.activos
    const abandonosCount = abandonosPorMes ?? estado.abandonos

    const data = [
        { estado: "Activos", cantidad: activosCount },
        { estado: "Abandonos", cantidad: abandonosCount },
        { estado: "Vencidos", cantidad: estado.vencidos },
    ]

    const breakdowns: Record<string, { gimnasio: number; clase: number }> = {
        Activos: {
            gimnasio: alumnosActivos.filter(a => a.tipo === "GIMNASIO").length,
            clase: alumnosActivos.filter(a => a.tipo === "CLASE").length,
        },
        Abandonos: {
            gimnasio: alumnosAbandonos.filter(a => a.tipo === "GIMNASIO").length,
            clase: alumnosAbandonos.filter(a => a.tipo === "CLASE").length,
        },
        Vencidos: {
            gimnasio: alumnosVencidos.filter(a => a.tipo === "GIMNASIO").length,
            clase: alumnosVencidos.filter(a => a.tipo === "CLASE").length,
        },
    }

    const years = Array.from({ length: 6 }, (_, i) => String(2025 + i))
    const mesLabel = MESES.find(m => m.value === selectedMes)?.label ?? ""

    const handleBarClick = (entry: any) => {
        const label = entry?.estado
        if (label === "Activos") { setAlumnoDetalle(null); setModalActivosOpen(true) }
        if (label === "Abandonos") { setAlumnoDetalle(null); setModalAbandonosOpen(true) }
        if (label === "Vencidos") { setAlumnoDetalle(null); setModalVencidosOpen(true) }
    }

    return (
        <>
            <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow">
                <CardHeader className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <CardTitle className="font-bold">Estado de Alumnos</CardTitle>

                    <div className="flex gap-2 mt-1 items-center">
                        <Select value={selectedMes} onValueChange={setSelectedMes}>
                            <SelectTrigger className="w-[130px] h-8 text-xs">
                                <SelectValue placeholder="Mes" />
                            </SelectTrigger>
                            <SelectContent>
                                {MESES.map((m) => {
                                    const anio = Number(selectedAnio)
                                    const mes = Number(m.value)
                                    const isFuture = anio === currentYear && mes > currentMonth
                                    const isTooOld = anio === 2025 && mes < 6
                                    return (
                                        <SelectItem key={m.value} value={m.value} disabled={isFuture || isTooOld}>
                                            {m.label}
                                        </SelectItem>
                                    )
                                })}
                            </SelectContent>
                        </Select>

                        <Select value={selectedAnio} onValueChange={setSelectedAnio}>
                            <SelectTrigger className="w-[90px] h-8 text-xs">
                                <SelectValue placeholder="Año" />
                            </SelectTrigger>
                            <SelectContent>
                                {years.map(y => (
                                    <SelectItem key={y} value={y} disabled={Number(y) > currentYear}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        <Popover>
                            <PopoverTrigger asChild>
                                <button className="text-muted-foreground hover:text-foreground transition-colors">
                                    <Info className="w-4 h-4" />
                                </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-72 text-sm space-y-3 p-4">
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#ff6a00] mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Activos</p>
                                        <p className="text-muted-foreground text-xs">Alumnos que realizaron al menos un pago en el mes seleccionado.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#ffa170] mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Abandonos</p>
                                        <p className="text-muted-foreground text-xs">Alumnos cuya fecha de vencimiento cayó dentro del mes seleccionado y no renovaron.</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <span className="w-2 h-2 rounded-full bg-[#f04b00] mt-1.5 flex-shrink-0" />
                                    <div>
                                        <p className="font-semibold">Vencidos</p>
                                        <p className="text-muted-foreground text-xs">Alumnos con vencimiento en los últimos 30 días que aún no renovaron.</p>
                                    </div>
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {!loading && (
                        <p className="text-xs text-muted-foreground text-center">
                            Clic en barra para ver detalle
                        </p>
                    )}
                </CardHeader>

                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={data} barGap={12} barCategoryGap={32} style={{ cursor: "pointer" }}>
                            <XAxis dataKey="estado" tick={!isMobile} hide={isMobile} />
                            <YAxis hide={isMobile} />
                            <Tooltip content={<CustomTooltip breakdowns={breakdowns} porVencer={porVencer} />} />
                            <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} onClick={handleBarClick}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Modal Activos */}
            <MemberListModal
                open={modalActivosOpen}
                onOpenChange={(v) => { setModalAbandonosOpen(false); setModalActivosOpen(v); if (!v) setAlumnoDetalle(null) }}
                title={`Activos — ${mesLabel} ${selectedAnio}`}
                count={alumnosActivos.length}
                accentColor="green"
                alumnoDetalle={alumnoDetalle}
                loadingDetalle={loadingDetalle}
                onBack={() => setAlumnoDetalle(null)}
            >
                {alumnosActivos.length === 0 ? (
                    <EmptyState text="Sin pagos registrados en este período." />
                ) : (
                    <GroupedMemberList alumnos={alumnosActivos} accentColor="green" onClickMember={fetchDetalle} />
                )}
            </MemberListModal>

            {/* Modal Abandonos */}
            <MemberListModal
                open={modalAbandonosOpen}
                onOpenChange={(v) => { setModalActivosOpen(false); setModalAbandonosOpen(v); if (!v) setAlumnoDetalle(null) }}
                title={`Abandonos — ${mesLabel} ${selectedAnio}`}
                count={alumnosAbandonos.length}
                accentColor="red"
                alumnoDetalle={alumnoDetalle}
                loadingDetalle={loadingDetalle}
                onBack={() => setAlumnoDetalle(null)}
            >
                {alumnosAbandonos.length === 0 ? (
                    <EmptyState text="Sin abandonos en este período." />
                ) : (
                    <GroupedMemberList
                        alumnos={alumnosAbandonos}
                        accentColor="red"
                        onClickMember={fetchDetalle}
                        getSubtitle={a => a.fecha_vencimiento ? `Venció ${dayjs(a.fecha_vencimiento).format("DD/MM/YYYY")}` : undefined}
                    />
                )}
            </MemberListModal>

            {/* Modal Vencidos */}
            <MemberListModal
                open={modalVencidosOpen}
                onOpenChange={(v) => { setModalVencidosOpen(v); if (!v) setAlumnoDetalle(null) }}
                title="Vencidos (últimos 30 días)"
                count={alumnosVencidos.length}
                accentColor="amber"
                alumnoDetalle={alumnoDetalle}
                loadingDetalle={loadingDetalle}
                onBack={() => setAlumnoDetalle(null)}
            >
                {alumnosVencidos.length === 0 ? (
                    <EmptyState text="Sin alumnos vencidos." />
                ) : (
                    <GroupedMemberList
                        alumnos={alumnosVencidos}
                        accentColor="amber"
                        onClickMember={fetchDetalle}
                        getSubtitle={a => a.fecha_vencimiento ? `Venció ${dayjs(a.fecha_vencimiento).format("DD/MM/YYYY")}` : undefined}
                    />
                )}
            </MemberListModal>
        </>
    )
}

/* ── Sub-components ── */

function GroupedMemberList({ alumnos, accentColor, onClickMember, getSubtitle }: {
    alumnos: { dni: string; nombre: string; tipo: string; [key: string]: any }[]
    accentColor: "green" | "red" | "amber"
    onClickMember: (dni: string) => void
    getSubtitle?: (a: any) => string | undefined
}) {
    const gimnasio = alumnos.filter(a => a.tipo === "GIMNASIO")
    const clase = alumnos.filter(a => a.tipo === "CLASE")
    const otro = alumnos.filter(a => a.tipo !== "GIMNASIO" && a.tipo !== "CLASE")

    const GROUP_STYLES: Record<string, { bg: string; label: string; dot: string }> = {
        Gimnasio: { bg: "bg-brand-50 dark:bg-brand-900/30 border border-brand-100 dark:border-brand-900/40", label: "text-brand-700 dark:text-brand-300", dot: "bg-brand-500" },
        Clase:    { bg: "bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40", label: "text-amber-700 dark:text-amber-400", dot: "bg-amber-500" },
        Otro:     { bg: "bg-muted/40 border border-border", label: "text-muted-foreground", dot: "bg-muted-foreground" },
    }

    const renderGroup = (label: string, list: typeof alumnos) => {
        if (list.length === 0) return null
        const style = GROUP_STYLES[label]
        return (
            <div className={`rounded-xl p-3 ${style.bg}`}>
                <div className="flex items-center gap-2 mb-2">
                    <span className={`w-2 h-2 rounded-full ${style.dot} flex-shrink-0`} />
                    <p className={`text-xs font-bold uppercase tracking-wider ${style.label}`}>{label}</p>
                    <span className={`text-xs font-semibold ${style.label} opacity-70`}>({list.length})</span>
                </div>
                <ul className="space-y-1">
                    {list.map((a, i) => (
                        <MemberRow
                            key={i}
                            nombre={a.nombre}
                            dni={a.dni}
                            accentColor={accentColor}
                            subtitle={getSubtitle?.(a)}
                            onClick={() => onClickMember(a.dni)}
                        />
                    ))}
                </ul>
            </div>
        )
    }

    const hasMultiple = [gimnasio, clase, otro].filter(g => g.length > 0).length > 1

    return (
        <div className={hasMultiple ? "grid grid-cols-2 gap-3" : ""}>
            {renderGroup("Gimnasio", gimnasio)}
            {renderGroup("Clase", clase)}
            {renderGroup("Otro", otro)}
        </div>
    )
}

function MemberListModal({ open, onOpenChange, title, count, accentColor, alumnoDetalle, loadingDetalle, onBack, children }: {
    open: boolean
    onOpenChange: (v: boolean) => void
    title: string
    count: number
    accentColor: "green" | "red" | "amber"
    alumnoDetalle: AlumnoDetalle | null
    loadingDetalle: boolean
    onBack: () => void
    children: React.ReactNode
}) {
    const accent = accentColor === "green"
        ? { badge: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400" }
        : accentColor === "amber"
        ? { badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400" }
        : { badge: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400" }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl p-0 overflow-hidden" hideClose>
                <DialogHeader className="px-8 pt-8 pb-5 border-b">
                    {alumnoDetalle ? (
                        <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors w-fit">
                            <ChevronLeft className="w-4 h-4" />
                            Volver a la lista
                        </button>
                    ) : (
                        <div className="flex items-center justify-between">
                            <DialogTitle className="text-base">{title}</DialogTitle>
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${accent.badge}`}>
                                {count} alumnos
                            </span>
                        </div>
                    )}
                </DialogHeader>

                <ScrollArea className="max-h-[60vh]">
                    <div className={alumnoDetalle ? "px-6 py-5" : "px-4 py-3"}>
                        {alumnoDetalle ? (
                            <DetalleAlumno alumno={alumnoDetalle} loading={loadingDetalle} />
                        ) : children}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    )
}

function MemberRow({ nombre, dni, subtitle, accentColor, onClick }: {
    nombre: string; dni: string; subtitle?: string; accentColor: "green" | "red" | "amber"; onClick: () => void
}) {
    const initials = getInitials(nombre || "?")
    const avatarBg = accentColor === "green"
        ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400"
        : accentColor === "amber"
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400"
        : "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"

    return (
        <li
            onClick={onClick}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-muted/60 active:bg-muted transition-colors group"
        >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${avatarBg}`}>
                {initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{nombre || "Sin nombre"}</p>
                {subtitle && <p className="text-xs text-red-400">{subtitle}</p>}
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-xs text-muted-foreground">DNI</p>
                <p className="text-xs font-medium">{dni}</p>
            </div>
        </li>
    )
}

function DetalleAlumno({ alumno, loading }: { alumno: AlumnoDetalle | null; loading: boolean }) {
    if (loading) return (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <div className="w-8 h-8 rounded-full border-2 border-brand-500 border-t-transparent animate-spin" />
            <p className="text-sm">Cargando...</p>
        </div>
    )
    if (!alumno) return null

    const initials = getInitials(alumno.Nombre || "?")
    const todosLosPagos = alumno.Pagos ?? []

    return (
        <div className="space-y-5">
            {/* Hero */}
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center text-lg font-bold text-brand-600 dark:text-brand-300">
                    {initials}
                </div>
                <div>
                    <p className="text-base font-semibold">{alumno.Nombre}</p>
                    <p className="text-xs text-muted-foreground">DNI {alumno.DNI}</p>
                    {alumno.Plan && (
                        <Badge variant="outline" className="mt-1 text-xs">{alumno.Plan}</Badge>
                    )}
                </div>
            </div>

            <Separator />

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3">
                {alumno.Fecha_inicio && (
                    <InfoTile icon={<Calendar className="w-3.5 h-3.5" />} label="Inicio" value={alumno.Fecha_inicio} />
                )}
                {alumno.Fecha_vencimiento && (
                    <InfoTile icon={<Clock className="w-3.5 h-3.5" />} label="Vencimiento" value={alumno.Fecha_vencimiento} valueClass="text-red-500" />
                )}
                {alumno.Precio && (
                    <InfoTile icon={<CreditCard className="w-3.5 h-3.5" />} label="Precio plan" value={`$${alumno.Precio}`} />
                )}
                {alumno.Tipo_de_plan && (
                    <InfoTile icon={<TrendingUp className="w-3.5 h-3.5" />} label="Tipo" value={alumno.Tipo_de_plan} />
                )}
                {alumno.Email && (
                    <InfoTile icon={<Mail className="w-3.5 h-3.5" />} label="Email" value={alumno.Email} className="col-span-2" />
                )}
            </div>

            {todosLosPagos.length > 0 && (
                <>
                    <Separator />
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Historial de pagos</p>
                            <span className="text-xs text-muted-foreground">{todosLosPagos.length} registros</span>
                        </div>
                        <ul className="space-y-2">
                            {todosLosPagos.map((p, i) => (
                                <li key={i} className="flex items-center justify-between px-3 py-2 rounded-xl bg-muted/40">
                                    <div>
                                        <p className="text-sm font-semibold">${p.Monto}</p>
                                        <p className="text-xs text-muted-foreground">{p.Tipo} · {p.Metodo_de_Pago}</p>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{p.Fecha_de_Pago}</p>
                                </li>
                            ))}
                        </ul>
                    </div>
                </>
            )}
        </div>
    )
}

function InfoTile({ icon, label, value, valueClass = "", className = "" }: {
    icon: React.ReactNode; label: string; value: string; valueClass?: string; className?: string
}) {
    return (
        <div className={`flex items-start gap-2 p-2.5 rounded-xl bg-muted/40 ${className}`}>
            <div className="mt-0.5 text-muted-foreground">{icon}</div>
            <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-sm font-medium truncate ${valueClass}`}>{value}</p>
            </div>
        </div>
    )
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
            <Users className="w-8 h-8 opacity-30" />
            <p className="text-sm">{text}</p>
        </div>
    )
}

function CustomTooltip({ active, payload, label, breakdowns, porVencer }: any) {
    if (!active || !payload?.length) return null
    const idx = ["Activos", "Vencidos", "Abandonos"].indexOf(label)
    const color = BAR_COLORS[idx]?.bg ?? "#888"
    const bd = breakdowns?.[label]
    return (
        <div className="bg-card rounded-xl border border-border/60 shadow-floating px-6 py-4 text-sm font-medium min-w-[220px]">
            <p className="text-base font-bold mb-1" style={{ color }}>{label}</p>
            <p className="text-sm text-muted-foreground mb-3">{ESTADO_DESCRIPCION[label]}</p>
            <p className="text-3xl font-bold tracking-tighter mb-3">{payload[0].value}</p>
            {label === "Abandonos" && porVencer > 0 && (
                <p className="text-sm text-muted-foreground mb-3 -mt-2">Faltan vencer: <span className="font-bold text-foreground">{porVencer}</span></p>
            )}
            {bd && (bd.gimnasio > 0 || bd.clase > 0) && (
                <div className="space-y-2 border-t border-border/60 pt-3">
                    {bd.gimnasio > 0 && (
                        <div className="flex justify-between gap-6 text-sm">
                            <span className="text-brand-600 font-medium">Gimnasio</span>
                            <span className="font-bold">{bd.gimnasio}</span>
                        </div>
                    )}
                    {bd.clase > 0 && (
                        <div className="flex justify-between gap-6 text-sm">
                            <span className="text-amber-600 font-medium">Clase</span>
                            <span className="font-bold">{bd.clase}</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
