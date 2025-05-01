"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/dashboard/date-picker"
import dayjs from "dayjs"
import axios from "axios"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Trash } from "lucide-react"

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

    const fetchEgresos = async () => {
        const anio = dayjs(selectedDate).year()
        const mes = dayjs(selectedDate).month() + 1

        try {
            const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/egresos?anio=${anio}&mes=${mes}${selectedType !== "todos" ? `&tipo=${selectedType}` : ""}`
            const { data } = await axios.get(url)
            setEgresos(data)
        } catch (err) {
            console.error("Error al cargar egresos", err)
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
            <CardHeader>
                <CardTitle>Egresos</CardTitle>
                <CardDescription>Listado de egresos filtrado por fecha y tipo</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                    <div className="flex-1">
                        <Label>Fecha</Label>
                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
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
                                    <TableHead className="text-center">Fecha</TableHead>
                                    <TableHead className="text-center">Motivo</TableHead>
                                    <TableHead className="text-center">Monto</TableHead>
                                    <TableHead className="text-center">Responsable</TableHead>
                                    <TableHead className="text-center">Tipo</TableHead>
                                    <TableHead className="text-center">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {egresos.length > 0 ? (
                                    egresos.map((e, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="text-center">{e.Fecha}</TableCell>
                                            <TableCell className="text-center">{e.Motivo}</TableCell>
                                            <TableCell className="text-center">${e.Monto}</TableCell>
                                            <TableCell className="text-center">{e.Responsable}</TableCell>
                                            <TableCell className="text-center">{e.Tipo}</TableCell>
                                            <TableCell className="text-center">
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
                                            No hay egresos para este mes (seleciona una fecha con el mes que quieres filtrar).
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
                            <p><strong>Motivo:</strong> {egresoAEliminar.Motivo}</p>
                            <p><strong>Monto:</strong> ${egresoAEliminar.Monto}</p>
                        </div>
                    )}
                </ConfirmDialog>
            </CardContent>
        </Card>

    )
}
