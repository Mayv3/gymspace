"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/dashboard/date-picker"
import dayjs from "dayjs"
import axios from "axios"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { PlusCircle, Trash } from "lucide-react"
import { useUser } from "@/context/UserContext";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface Egreso {
    ID: string
    Fecha: string
    Motivo: string
    Monto: string
    Responsable: string
    Tipo: string
}

export default function EgresosSection() {
    const [egresos, setEgresos] = useState<Egreso[]>([])
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedType, setSelectedType] = useState("todos")
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [egresoAEliminar, setEgresoAEliminar] = useState<Egreso | null>(null)
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const { user } = useUser()

    const [form, setForm] = useState({
        Fecha: dayjs().format("DD/MM/YYYY"),
        Motivo: "",
        Monto: "",
        Responsable: user?.nombre,
        Tipo: "GIMNASIO"
    })

    const fetchEgresos = async () => {
        const anio = dayjs(selectedDate).year()
        const mes = dayjs(selectedDate).month() + 1
        console.log("Llamando fetchEgresos", { selectedDate, selectedType })

        try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos?anio=${anio}&mes=${mes}${selectedType !== "todos" ? `&tipo=${selectedType}` : ""}`
            const { data } = await axios.get(url)
            setEgresos(data)
        } catch (err) {
            console.error("Error al cargar egresos", err)
        }
    }

    const handleCreateEgreso = async () => {
        try {
            const payload = { ...form }
            const { data: nuevo } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos`, payload)
            setEgresos(prev => [...prev, nuevo])
            setShowCreateDialog(false)
            setForm({
                Fecha: dayjs().format("DD/MM/YYYY"),
                Motivo: "",
                Monto: "",
                Responsable: "",
                Tipo: "GIMNASIO"
            })
        } catch (error) {
            console.error("Error al crear egreso:", error)
        }
    }

    const handleDeleteEgreso = async () => {
        if (!egresoAEliminar) return

        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos/${egresoAEliminar.ID}`)
            setEgresos(prev => prev.filter(e => e.ID !== egresoAEliminar.ID))
            setShowDeleteDialog(false)
            setEgresoAEliminar(null)
        } catch (error) {
            console.error("Error al eliminar egreso:", error)
        }
    }

    useEffect(() => {
        fetchEgresos()
    }, [selectedDate, selectedType])

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Egresos</CardTitle>
                    <CardDescription>Listado de egresos filtrado por fecha y tipo</CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Egreso
                </Button>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Label>Fecha</Label>
                        <DatePicker
                            date={selectedDate}
                            setDate={setSelectedDate}
                        />
                    </div>
                    <div className="flex-1">
                        <Label>Tipo</Label>
                        <Select value={selectedType} onValueChange={setSelectedType}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="todos">Todos</SelectItem>
                                <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                                <SelectItem value="CLASE">Clase</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                    <div className="min-w-[800px]">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center w-1/6">Fecha</TableHead>
                                    <TableHead className="text-center w-1/6">Motivo</TableHead>
                                    <TableHead className="text-center w-1/6">Monto</TableHead>
                                    <TableHead className="text-center w-1/6">Responsable</TableHead>
                                    <TableHead className="text-center w-1/6">Tipo</TableHead>
                                    <TableHead className="text-center w-1/6">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {egresos.length > 0 ? (
                                    egresos.map((e, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-center w-1/6">{e.Fecha}</TableCell>
                                            <TableCell className="text-center w-1/6">
                                                <div className="truncate overflow-hidden whitespace-nowrap max-w-[160px] mx-auto">
                                                    {e.Motivo}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center w-1/6">${e.Monto}</TableCell>
                                            <TableCell className="text-center w-1/6">{e.Responsable}</TableCell>
                                            <TableCell className="text-center w-1/6">{e.Tipo}</TableCell>
                                            <TableCell className="text-center w-1/6">
                                                <button
                                                    onClick={() => {
                                                        setEgresoAEliminar(e)
                                                        setShowDeleteDialog(true)
                                                    }}
                                                    className="text-red-600 font-medium hover:underline"
                                                >
                                                    <Trash className="h-4 w-4 text-destructive" />
                                                </button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                                            No hay egresos para este mes (selecciona una fecha con el mes que quieres filtrar).
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </div>
                <ConfirmDialog
                    open={showDeleteDialog}
                    onOpenChange={setShowDeleteDialog}
                    title="¿Eliminar egreso?"
                    description="Esta acción no se puede deshacer."
                    confirmText="Eliminar"
                    cancelText="Cancelar"
                    destructive
                    onConfirm={handleDeleteEgreso}
                >
                    {egresoAEliminar && (
                        <div className="space-y-2 text-sm p-4">
                            <p><strong>Fecha:</strong> {egresoAEliminar.Fecha}</p>
                            <p className="max-w-xs overflow-hidden text-ellipsis break-words line-clamp-3">
                                <strong>Motivo:</strong> {egresoAEliminar.Motivo}
                            </p>
                            <p><strong>Monto:</strong> ${egresoAEliminar.Monto}</p>
                        </div>
                    )}
                </ConfirmDialog>
                <ConfirmDialog
                    open={showCreateDialog}
                    onOpenChange={setShowCreateDialog}
                    title="Registrar Egreso"
                    description="Completa los datos para registrar un egreso"
                    confirmText="Registrar"
                    cancelText="Cancelar"
                    onConfirm={handleCreateEgreso}
                >
                    <div className="space-y-4 text-sm bg-background text-foreground">
                        <div className="flex flex-col">
                            <Label>Fecha</Label>
                            <DatePicker
                                date={selectedDate}
                                setDate={setSelectedDate}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Motivo</Label>
                            <Input
                                className="border border-input bg-background text-foreground px-2 py-1 rounded"
                                value={form.Motivo}
                                onChange={(e) => setForm(prev => ({ ...prev, Motivo: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Monto</Label>
                            <Input
                                type="number"
                                className="border border-input bg-background text-foreground px-2 py-1 rounded"
                                value={form.Monto}
                                onChange={(e) => setForm(prev => ({ ...prev, Monto: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Responsable</Label>
                            <Input
                                className="border border-input bg-background text-foreground px-2 py-1 rounded cursor-disabled"
                                value={user?.nombre}
                                disabled
                                onChange={(e) => setForm(prev => ({ ...prev, Responsable: e.target.value }))}
                            />
                        </div>
                        <div className="flex flex-col">
                            <Label>Tipo</Label>
                            <Select value={form.Tipo} onValueChange={(val) => setForm(prev => ({ ...prev, Tipo: val }))}>
                                <SelectTrigger className="bg-background text-foreground border-input">
                                    <SelectValue placeholder="Seleccionar tipo" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="GIMNASIO">Gimnasio</SelectItem>
                                    <SelectItem value="CLASE">Clase</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </ConfirmDialog>
            </CardContent>
        </Card>

    )
}
