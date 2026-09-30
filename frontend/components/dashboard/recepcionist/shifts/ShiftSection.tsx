"use client"

import { useEffect, useRef, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash, CalendarDays, User, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext"
import { useAppData } from "@/context/AppDataContext"

import axios from "axios"
import dayjs from "dayjs"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"
import { notify } from "@/lib/toast"
import { FormEnterToTab } from "@/components/FormEnterToTab"
import { parse } from 'date-fns'
import { es } from 'date-fns/locale'

dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"]
const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"]

interface TurnoForm {
    Tipo: string
    Fecha_turno: Date | null
    Profesional: string
    Responsable: string
    Hora: string
}

export default function ShiftsSection() {
    const { turnos, setTurnos } = useAppData()
    const { user } = useUser()

    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedType, setSelectedType] = useState("todas")
    const [fechaError, setFechaError] = useState(false)
    const isFirstLoad = useRef(true)

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState<TurnoForm>({ Tipo: "", Fecha_turno: null, Profesional: "", Responsable: "", Hora: "", })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingTurno, setEditingTurno] = useState<any | null>(null)
    const [editForm, setEditForm] = useState<TurnoForm>({ Tipo: "", Fecha_turno: null, Profesional: "", Responsable: "", Hora: "", })

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedTurno, setSelectedTurno] = useState<any | null>(null)
    const [isSubmitting, setisSubmitting] = useState(false);

    const [viewMonth, setViewMonth] = useState(dayjs().startOf("month"))

    const filteredTurnos = turnos.filter((turno) => {
        if (selectedType === "todas") return true;
        return turno.Tipo === selectedType;
    });

    const parseDate = (str: string): Date | null => {
        try {
            const parsed = parse(str, 'dd/MM/yyyy', new Date(), { locale: es })
            return isNaN(parsed.getTime()) ? null : parsed
        } catch {
            return null
        }
    }

    // turnos agrupados por día (DD/MM/YYYY), ordenados por hora
    const turnosPorDia: Record<string, any[]> = {}
    for (const t of filteredTurnos) {
        const d = parseDate(t.Fecha_turno)
        if (!d) continue
        const key = dayjs(d).format("DD/MM/YYYY")
        ;(turnosPorDia[key] ??= []).push(t)
    }
    Object.values(turnosPorDia).forEach((arr) => arr.sort((a, b) => (a.Hora || "").localeCompare(b.Hora || "")))

    const selectedDayTurnos = turnosPorDia[dayjs(selectedDate).format("DD/MM/YYYY")] ?? []

    // grilla del mes, semanas de lunes a domingo
    const gridStart = viewMonth.subtract((viewMonth.day() + 6) % 7, "day")
    const gridEnd = viewMonth.endOf("month")
    const weeks = Math.ceil((gridEnd.diff(gridStart, "day") + 1) / 7)
    const calendarDays = Array.from({ length: weeks * 7 }, (_, i) => gridStart.add(i, "day"))

    // el calendario necesita todos los turnos, no solo una ventana de 8 días
    const fetchTurnosPorFecha = async () => {
        try {
            const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`)
            setTurnos(data)
        } catch (error) {
            console.error("Error al cargar turnos:", error)
        }
    }

    const handleConfirmCreate = async () => {

        if (!createForm.Fecha_turno || !createForm.Hora || !createForm.Profesional || !createForm.Tipo) {
            notify.error("Por favor completa todos los campos antes de enviar.");
            return;
        }

        if (!createForm.Fecha_turno) {
            setFechaError(true)
            return
        }
        setFechaError(false)
        setisSubmitting(true)
        try {
            const payload = {
                tipo: createForm.Tipo,
                fecha_turno: dayjs(createForm.Fecha_turno).format("DD/MM/YYYY"),
                profesional: createForm.Profesional,
                responsable: user?.nombre,
                hora: createForm.Hora,
            }

            const { data: nuevoTurno } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`,
                payload
            )

            // opcional: agregar solo si está dentro de 7 días
            const fechaDelTurno = dayjs(nuevoTurno.Fecha_turno, "DD/MM/YYYY")
            const hoy = dayjs()
            if (
                fechaDelTurno.isSameOrAfter(hoy, "day") &&
                fechaDelTurno.isSameOrBefore(hoy.add(7, "day"), "day")
            ) {
                setTurnos((prev) => [...prev, nuevoTurno])
            }

            fetchTurnosPorFecha()
            setShowCreateDialog(false)
            setCreateForm({
                Tipo: "",
                Fecha_turno: null,
                Profesional: "",
                Responsable: "",
                Hora: "",
            })
            notify.success("¡Turno registrado con éxito!")
            setisSubmitting(false)
        } catch (error) {
            console.error("Error creando turno:", error)
            notify.error("Error al registrar el turno")
        }
    }

    const handleConfirmEdit = async (e?: React.FormEvent) => {
        e?.preventDefault()
        if (!editingTurno) return
        setisSubmitting(true)

        try {
            const payload = {
                Tipo: editForm.Tipo,
                Fecha_turno: dayjs(editForm.Fecha_turno!).format("DD/MM/YYYY"),
                Profesional: editForm.Profesional,
                Responsable: editForm.Responsable,
                Hora: editForm.Hora,
            }

            const { data: turnoActualizado } = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${editingTurno.ID}`,
                payload
            )

            setTurnos((prev) =>
                prev.map((t) =>
                    t.ID === editingTurno.ID ? { ...t, ...turnoActualizado } : t
                )
            )
            setShowEditDialog(false)
            setEditingTurno(null)
            notify.success("¡Turno editado con éxito!")
        } catch (error) {
            notify.error("Error al editar el turno")
        }
        setisSubmitting(false)
    }

    const handleConfirmDelete = async () => {
        if (!selectedTurno) return
        setisSubmitting(true)
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${selectedTurno.ID}`
            )
            setTurnos((prev) =>
                prev.filter((t) => t.ID !== selectedTurno.ID)
            )
            setShowDeleteDialog(false)
            setSelectedTurno(null)
            notify.info("¡Turno eliminado con éxito!")
        } catch (error) {
            notify.error("Error al eliminar el turno")
        }
        setisSubmitting(false)
    }

    useEffect(() => {
        fetchTurnosPorFecha()
    }, [])

    return (
        <>
            <Card className="bg-card rounded-2xl border border-border/60 shadow-soft">
                <CardHeader className="bg-brand-50/60 dark:bg-card rounded-t-2xl border-b border-border/60 mb-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between gap-3">
                        <div>
                            <CardTitle className="font-bold">Turnos</CardTitle>
                            <CardDescription className="hidden md:block text-xs text-muted-foreground font-medium">Gestiona los turnos agendados.</CardDescription>
                        </div>
                        <div className="flex items-center gap-2 min-w-0">
                            <Select
                                value={selectedType}
                                onValueChange={setSelectedType}
                            >
                                <SelectTrigger className="flex-1 min-w-0 sm:flex-none sm:w-[160px] rounded-xl">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="todas">Todos</SelectItem>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button variant="orange" className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press" onClick={() => setShowCreateDialog(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Agregar turno
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>

                    {/* Calendario */}
                    <div className="rounded-xl border border-border/60 overflow-hidden">
                        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border/60">
                            <Button variant="ghost" size="icon" onClick={() => setViewMonth((m) => m.subtract(1, "month"))}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-2 md:gap-3">
                                <p className="font-bold capitalize whitespace-nowrap">{MESES[viewMonth.month()]} {viewMonth.year()}</p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setViewMonth(dayjs().startOf("month"))
                                        setSelectedDate(new Date())
                                    }}
                                >
                                    Hoy
                                </Button>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setViewMonth((m) => m.add(1, "month"))}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="grid grid-cols-7 border-b border-border/60 bg-muted/30">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                                <div key={d} className="py-2 text-center text-[11px] uppercase tracking-wider font-bold text-muted-foreground">
                                    {d}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-7">
                            {calendarDays.map((day) => {
                                const key = day.format("DD/MM/YYYY")
                                const dayTurnos = turnosPorDia[key] ?? []
                                const esHoy = day.isSame(dayjs(), "day")
                                const esSeleccionado = day.isSame(dayjs(selectedDate), "day")
                                const fueraDeMes = !day.isSame(viewMonth, "month")

                                return (
                                    <button
                                        type="button"
                                        key={key}
                                        onClick={() => setSelectedDate(day.toDate())}
                                        onDoubleClick={() => {
                                            setCreateForm((p) => ({ ...p, Fecha_turno: day.toDate() }))
                                            setFechaError(false)
                                            setShowCreateDialog(true)
                                        }}
                                        className={`min-h-[64px] md:min-h-[110px] border-b border-r border-border/60 p-1 md:p-2 text-left align-top transition-colors hover:bg-muted/40 flex flex-col gap-1
                                            ${fueraDeMes ? "bg-muted/20 text-muted-foreground" : ""}
                                            ${esHoy ? "bg-amber-50 dark:bg-amber-950/40" : ""}
                                            ${esSeleccionado ? "ring-2 ring-inset ring-brand-500" : ""}`}
                                    >
                                        <span className={`text-xs font-semibold ${esHoy ? "text-brand-600" : ""}`}>{day.date()}</span>
                                        <div className="hidden md:flex flex-col gap-1 w-full">
                                            {dayTurnos.slice(0, 3).map((t) => (
                                                <span
                                                    key={t.ID}
                                                    className={`truncate rounded px-1.5 py-0.5 text-[11px] font-medium ${t.Tipo === "Nutrición"
                                                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300"
                                                        : "bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-200"}`}
                                                >
                                                    {t.Hora} {t.Tipo}
                                                </span>
                                            ))}
                                            {dayTurnos.length > 3 && (
                                                <span className="text-[11px] text-muted-foreground">+{dayTurnos.length - 3} más</span>
                                            )}
                                        </div>
                                        {dayTurnos.length > 0 && (
                                            <span className="md:hidden self-start rounded-full bg-brand-500 text-white text-[10px] font-bold px-1.5">
                                                {dayTurnos.length}
                                            </span>
                                        )}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Turnos del día seleccionado */}
                    <div className="mt-6 space-y-3">
                        <p className="font-bold">
                            {DIAS[dayjs(selectedDate).day()]} {dayjs(selectedDate).date()} de {MESES[dayjs(selectedDate).month()]}
                        </p>
                        {selectedDayTurnos.length > 0 ? (
                            selectedDayTurnos.map((turno, i) => (
                                <motion.div
                                    key={turno.ID ?? i}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="rounded-2xl border border-border/60 bg-card shadow-soft p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
                                >
                                    <div className="space-y-1">
                                        <p className="text-lg font-bold">{turno.Tipo} · {turno.Hora}</p>
                                        <p className="text-sm">Profesional: {turno.Profesional}</p>
                                        <p className="text-sm">Responsable: {turno.Responsable}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-full md:w-10 bg-brand-100 hover:bg-brand-200 rounded-xl dark:bg-brand-900/30"
                                            onClick={() => {
                                                setEditingTurno(turno)
                                                setEditForm({
                                                    Tipo: turno.Tipo,
                                                    Fecha_turno: parse(turno.Fecha_turno, "dd/MM/yyyy", new Date(), { locale: es }),
                                                    Profesional: turno.Profesional,
                                                    Responsable: turno.Responsable,
                                                    Hora: turno.Hora,
                                                })
                                                setShowEditDialog(true)
                                            }}
                                        >
                                            <Edit className="h-4 w-4 text-primary" />
                                        </Button>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="w-full md:w-10 bg-rose-100 hover:bg-rose-200 rounded-xl dark:bg-rose-950/40"
                                            onClick={() => {
                                                setSelectedTurno(turno)
                                                setShowDeleteDialog(true)
                                            }}
                                        >
                                            <Trash className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay turnos registrados.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Crear Turno */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar Turno"
                description="Completa los datos del nuevo turno"
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Responsable</Label>
                            <Input value={user?.nombre} disabled />
                        </div>
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select
                                value={createForm.Tipo}
                                onValueChange={(v) =>
                                    setCreateForm((p) => ({ ...p, Tipo: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Profesional</Label>
                            <Input
                                capitalizeFirst
                                value={createForm.Profesional}
                                onChange={(e) =>
                                    setCreateForm((p) => ({
                                        ...p,
                                        Profesional: e.target.value,
                                    }))
                                }
                                placeholder="Ej: Gabriel Torres"
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Fecha Turno</Label>
                            <DatePicker
                                date={createForm.Fecha_turno ?? undefined}
                                setDate={(date) =>
                                    setCreateForm((p) => ({ ...p, Fecha_turno: date }))
                                }
                            />
                            {fechaError && (
                                <span className="text-rose-500 text-sm font-medium">
                                    La fecha del turno es obligatoria.
                                </span>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <Label>Horario</Label>
                            <Input
                                type="time"
                                value={createForm.Hora}
                                onChange={(e) =>
                                    setCreateForm((p) => ({ ...p, Hora: e.target.value }))
                                }
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Editar Turno */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar Turno"
                description="Modifica los datos del turno."
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        <div className="flex flex-col">
                            <Label>Responsable</Label>
                            <Input value={editForm.Responsable} disabled />
                        </div>
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select
                                value={editForm.Tipo}
                                onValueChange={(v) =>
                                    setEditForm((p) => ({ ...p, Tipo: v }))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Antropometría">
                                        Antropometría
                                    </SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col">
                            <Label>Fecha Turno</Label>
                            <DatePicker
                                date={editForm.Fecha_turno ?? undefined}
                                setDate={(date) =>
                                    setEditForm((p) => ({ ...p, Fecha_turno: date }))
                                }
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Hora</Label>
                            <Input
                                type="time"
                                value={editForm.Hora}
                                onChange={(e) =>
                                    setEditForm((p) => ({ ...p, Hora: e.target.value }))
                                }
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Profesional</Label>
                            <Input
                                capitalizeFirst
                                value={editForm.Profesional}
                                onChange={(e) =>
                                    setEditForm((p) => ({
                                        ...p,
                                        Profesional: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Eliminar Turno */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar Turno?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                loading={isSubmitting}
                onConfirm={handleConfirmDelete}
            >
                {selectedTurno && (
                    <div className="space-y-4 p-4 bg-muted/50 text-sm rounded-md">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <ClipboardList className="h-4 w-4 text-primary mr-2" />
                                <p>Tipo</p>
                            </div>
                            {selectedTurno.Tipo}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <CalendarDays className="h-4 w-4 text-primary mr-2" />
                                <p>Fecha: </p>
                            </div>
                            {selectedTurno.Fecha_turno}
                        </div>
                        <div className="flex justify-between items-center">
                            <div className="flex items-center">
                                <User className="h-4 w-4 text-primary mr-2" />
                                <p>Profesional:</p>
                            </div>
                            {selectedTurno.Profesional}
                        </div>
                    </div>
                )}
            </ConfirmDialog>
        </>
    )
}
