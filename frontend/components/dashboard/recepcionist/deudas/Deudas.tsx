"use client"

import { useEffect, useRef, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { FormEnterToTab } from "@/components/FormEnterToTab"
import { useAppData } from "@/context/AppDataContext"
import { useUser } from "@/context/UserContext"
import axios from "axios"
import { notify } from "@/lib/toast"
import { motion } from "framer-motion"
import dayjs from "dayjs"
import { DatePicker } from "../../date-picker"

interface DeudaForm {
    DNI: string
    Nombre: string
    Tipo: string
    Monto: string
    Motivo: string
    Estado: string
    Responsable: string
}

export default function DebtsSection() {
    const { user } = useUser()
    const [deudas, setDeudas] = useState<any[]>([])
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState<DeudaForm>({
        DNI: "",
        Nombre: "",
        Tipo: "",
        Monto: "",
        Motivo: "",
        Estado: "No pagado",
        Responsable: user?.nombre || "",
    })
    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingDeuda, setEditingDeuda] = useState<any | null>(null)
    const [editForm, setEditForm] = useState<DeudaForm>({ ...createForm })
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedDeuda, setSelectedDeuda] = useState<any | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedDate, setSelectedDate] = useState<Date | null>(new Date())
    const [filteredDeudas, setFilteredDeudas] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")

    const dataFiltrada = searchTerm ? filteredDeudas : deudas;

    const totalMes = deudas
        .filter(d => d.Estado === "No pagado")
        .reduce((acc, d) => acc + Number(d.Monto || 0), 0)

    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 10

    const paginatedDeudas = dataFiltrada.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const fetchDeudas = async () => {
        try {
            const mes = selectedDate ? dayjs(selectedDate).month() + 1 : new Date().getMonth() + 1
            const anio = selectedDate ? dayjs(selectedDate).year() : new Date().getFullYear()

            console.log(mes, anio)
            const { data } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/mes?mes=${mes}&anio=${anio}`
            )
            setDeudas(data);
            setFilteredDeudas(data);
        } catch (error) {
            console.error("Error al cargar deudas:", error)
        }
    }

    const handleConfirmCreate = async () => {
        const { DNI, Nombre, Tipo, Monto, Motivo } = createForm
        if (!DNI || !Nombre || !Tipo || !Monto || !Motivo) {
            notify.error("Todos los campos son obligatorios")
            return
        }
        setIsSubmitting(true)
        try {
            const { data } = await axios.post(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas`,
                {
                    dni: createForm.DNI,
                    nombre: createForm.Nombre,
                    tipo: createForm.Tipo,
                    monto: createForm.Monto,
                    motivo: createForm.Motivo,
                    estado: createForm.Estado,
                    responsable: user?.nombre || ""
                }
            )
            setDeudas((prev) => [...prev, data])
            setShowCreateDialog(false)
            setCreateForm({ DNI: "", Nombre: "", Tipo: "", Monto: "", Motivo: "", Estado: "No pagado", Responsable: user?.nombre || "" })
            notify.success("Deuda creada correctamente")
        } catch {
            notify.error("Error al crear deuda")
        }
        setIsSubmitting(false)
    }

    const handleConfirmEdit = async () => {
        if (!editingDeuda) return
        setIsSubmitting(true)
        try {
            const { data } = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/${editingDeuda.ID}`,
                editForm
            )

            // Actualizar tanto deudas como filteredDeudas
            const updatedDeuda = { ...editingDeuda, ...editForm }
            setDeudas((prev) =>
                prev.map((d) => (d.ID === editingDeuda.ID ? updatedDeuda : d))
            )
            setFilteredDeudas((prev) =>
                prev.map((d) => (d.ID === editingDeuda.ID ? updatedDeuda : d))
            )

            setShowEditDialog(false)
            setEditingDeuda(null)
            notify.success("Deuda actualizada")
        } catch {
            notify.error("Error al editar deuda")
        }
        setIsSubmitting(false)
    }

    const handleConfirmDelete = async () => {
        if (!selectedDeuda) return
        setIsSubmitting(true)
        try {
            await axios.delete(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/${selectedDeuda.ID}`
            )
            setDeudas((prev) => prev.filter((d) => d.ID !== selectedDeuda.ID))
            setShowDeleteDialog(false)
            setSelectedDeuda(null)
            notify.info("Deuda eliminada")
        } catch {
            notify.error("Error al eliminar deuda")
        }
        setIsSubmitting(false)
    }

    const handleSearch = async (term: string) => {
        setSearchTerm(term)
        if (!term.trim()) {
            setFilteredDeudas(deudas)
            setCurrentPage(1)
            return
        }

        try {
            const { data } = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/deudas/search?term=${encodeURIComponent(term)}`
            )
            setFilteredDeudas(data)
            setCurrentPage(1)
        } catch (error) {
            console.error("Error al buscar deudas:", error)
            notify.error("Error al buscar deudas")
        }
    }

    useEffect(() => {
        setCurrentPage(1)
        fetchDeudas()
    }, [selectedDate])
    return (
        <>
            <Card className="bg-card rounded-2xl border border-border/60 shadow-soft">
                <CardHeader className="bg-brand-50/60 dark:bg-card rounded-t-2xl border-b border-border/60 mb-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle className="font-bold">Deudas</CardTitle>
                            <CardDescription className="hidden md:block text-xs text-muted-foreground font-medium">Gestión de deudas registradas</CardDescription>
                        </div>
                        <Button variant="orange" className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar deuda
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:flex justify-between gap-2 items-start mb-3">
                        <div className="gap-2 md:flex">
                            <Input
                                placeholder="Nombre o DNI..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="max-w-sm mb-2 rounded-xl border-input focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10"
                            />
                            <DatePicker date={selectedDate} setDate={setSelectedDate} />
                        </div>

                        <div className="text-center text-sm font-medium h-full">
                            <p className={`${totalMes === 0 ? 'bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/40 dark:border-emerald-900' : 'md:bg-rose-50 md:border md:border-rose-100 dark:bg-rose-950/40 dark:border-rose-900'} h-full rounded-xl p-2 text-lg`}>Total adeudado del mes:{' '}
                                <span className={`font-bold ${totalMes === 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    ${totalMes}
                                </span>
                            </p>
                        </div>
                    </div>

                    <div className="hidden md:block overflow-auto border border-border/60 rounded-xl">
                        <Table className="w-full">
                            <TableHeader className="bg-muted/50">
                                <TableRow className="grid grid-cols-9 text-[11px] uppercase tracking-wider font-bold text-muted-foreground border-b pt-3">
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">DNI</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Nombre</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Tipo</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Monto</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Motivo</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Fecha</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Responsable</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Pago</TableHead>
                                    <TableHead className="py-2 text-center font-bold text-[11px] uppercase tracking-wider text-muted-foreground">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-border/60">
                                {paginatedDeudas.length ? (
                                    paginatedDeudas.map((deuda, i) => (
                                        <motion.tr
                                            key={i}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: i * 0.05 }}
                                            className="grid grid-cols-9 items-center border-b border-border/60 py-2 text-center hover:bg-muted/40 transition-colors"
                                        >
                                            <TableCell>{deuda.DNI}</TableCell>
                                            <TableCell className="font-medium">{deuda.Nombre}</TableCell>
                                            <TableCell><span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[13px] font-bold border ${deuda.Tipo === "El alumno le debe al gimnasio" ? "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900" : "bg-brand-50 text-brand-700 border-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-900"}`}>
                                                {deuda.Tipo}
                                            </span></TableCell>
                                            <TableCell className="font-medium">${deuda.Monto}</TableCell>
                                            <TableCell>{deuda.Motivo}</TableCell>
                                            <TableCell>{deuda.Fecha}</TableCell>
                                            <TableCell>{deuda.Responsable}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[13px] font-bold border ${deuda.Estado === "Pagado" ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900" : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${deuda.Estado === "Pagado" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                                    {deuda.Estado}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setEditingDeuda(deuda)
                                                            setEditForm({
                                                                DNI: deuda.DNI,
                                                                Nombre: deuda.Nombre,
                                                                Tipo: deuda.Tipo,
                                                                Monto: deuda.Monto,
                                                                Motivo: deuda.Motivo,
                                                                Estado: deuda.Estado,
                                                                Responsable: deuda.Responsable,
                                                            })
                                                            setShowEditDialog(true)
                                                        }}
                                                    >
                                                        <Edit className="h-4 w-4 text-primary" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            setSelectedDeuda(deuda)
                                                            setShowDeleteDialog(true)
                                                        }}
                                                    >
                                                        <Trash className="h-4 w-4 text-destructive" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </motion.tr>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center py-4">
                                            No hay deudas registradas en este mes
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        {deudas.length > itemsPerPage && (
                            <div className="flex justify-center gap-2 my-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="flex items-center px-2 text-sm">
                                    Página {currentPage} de {Math.ceil(deudas.length / itemsPerPage)}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((prev) =>
                                            prev < Math.ceil(deudas.length / itemsPerPage) ? prev + 1 : prev
                                        )
                                    }
                                    disabled={currentPage >= Math.ceil(deudas.length / itemsPerPage)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="block md:hidden space-y-4">
                        {paginatedDeudas.map((deuda, idx) => (
                            <Card key={idx} className="bg-card shadow-soft rounded-2xl border border-border/60 overflow-hidden">
                                {/* Header: Nombre y Estado */}
                                <div className="bg-card px-4 py-3 flex justify-between items-center border-b border-border/60">
                                    <h3 className="font-bold text-base">{deuda.Nombre}</h3>
                                    <span
                                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${deuda.Estado === "Pagado"
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                                            : "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
                                            }`}
                                    >
                                        <span className={`w-1.5 h-1.5 rounded-full ${deuda.Estado === "Pagado" ? "bg-emerald-500" : "bg-rose-500"}`} />
                                        {deuda.Estado}
                                    </span>
                                </div>

                                <CardContent className="bg-muted/40 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                                    <div>
                                        <p className="font-medium text-foreground">DNI</p>
                                        <p className="text-muted-foreground">{deuda.DNI}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Tipo</p>
                                        <p className="text-muted-foreground">{deuda.Tipo}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Monto</p>
                                        <p className="text-muted-foreground">${deuda.Monto}</p>
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">Fecha</p>
                                        <p className="text-muted-foreground">{deuda.Fecha}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-medium text-foreground">Motivo</p>
                                        <p className="text-muted-foreground">{deuda.Motivo}</p>
                                    </div>
                                    <div className="col-span-2">
                                        <p className="font-medium text-foreground">Responsable</p>
                                        <p className="text-muted-foreground">{deuda.Responsable}</p>
                                    </div>
                                </CardContent>

                                <CardFooter className="bg-card flex items-end gap-2 px-4 py-3 space-y-2">
                                    <Button
                                        size="sm"
                                        variant="orange"
                                        className="w-full bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl"
                                        onClick={() => {
                                            setEditingDeuda(deuda)
                                            setEditForm({
                                                DNI: deuda.DNI,
                                                Nombre: deuda.Nombre,
                                                Tipo: deuda.Tipo,
                                                Monto: deuda.Monto,
                                                Motivo: deuda.Motivo,
                                                Estado: deuda.Estado,
                                                Responsable: deuda.Responsable,
                                            })
                                            setShowEditDialog(true)
                                        }}
                                    >
                                        Editar
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="destructive"
                                        className="w-full"
                                        onClick={() => {
                                            setSelectedDeuda(deuda)
                                            setShowDeleteDialog(true)
                                        }}
                                    >
                                        Eliminar
                                    </Button>
                                </CardFooter>
                            </Card>
                        ))}

                        {deudas.length > itemsPerPage && (
                            <div className="flex justify-center gap-2 my-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                                    disabled={currentPage === 1}
                                >
                                    Anterior
                                </Button>
                                <span className="flex items-center px-2 text-sm">
                                    {currentPage} / {Math.ceil(deudas.length / itemsPerPage)}
                                </span>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCurrentPage((p) =>
                                            p < Math.ceil(deudas.length / itemsPerPage) ? p + 1 : p
                                        )
                                    }
                                    disabled={currentPage >= Math.ceil(deudas.length / itemsPerPage)}
                                >
                                    Siguiente
                                </Button>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Crear deuda */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar Deuda"
                description="Completa los datos de la deuda"
                confirmText="Crear"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmCreate}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        {Object.entries(createForm).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <Label>{key}</Label>

                                {/* Select para Tipo y Estado */}
                                {key === "Tipo" || key === "Estado" ? (
                                    <Select
                                        value={value}
                                        onValueChange={(v) =>
                                            setCreateForm((p) => ({ ...p, [key]: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder={`Seleccionar ${key.toLowerCase()}...`} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {key === "Tipo" ? (
                                                <>
                                                    <SelectItem value="El alumno le debe al gimnasio">
                                                        El alumno le debe al gimnasio
                                                    </SelectItem>
                                                    <SelectItem value="El gimnasio le debe al alumno">
                                                        El gimnasio le debe al alumno
                                                    </SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="No pagado">No pagado</SelectItem>
                                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>

                                ) : key === "Responsable" ? (
                                    <Input value={user?.nombre || ""} disabled />
                                ) : (
                                    <Input
                                        type={key === "Monto" || key === "DNI" ? "number" : "text"}
                                        inputMode={key === "Monto" || key === "DNI" ? "numeric" : undefined}
                                        value={value}
                                        onChange={(e) =>
                                            setCreateForm((p) => ({ ...p, [key]: e.target.value }))
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Editar deuda */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar Deuda"
                description="Modifica los datos de la deuda"
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                loading={isSubmitting}
                onConfirm={handleConfirmEdit}
            >
                <FormEnterToTab>
                    <div className="space-y-4 text-sm">
                        {Object.entries(editForm).map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <Label>{key}</Label>
                                {key === "Tipo" || key === "Estado" ? (
                                    <Select
                                        value={value}
                                        onValueChange={(v) =>
                                            setEditForm((p) => ({ ...p, [key]: v }))
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {key === "Tipo" ? (
                                                <>
                                                    <SelectItem value="El alumno le debe al gimnasio">
                                                        El alumno le debe al gimnasio
                                                    </SelectItem>
                                                    <SelectItem value="El gimnasio le debe al alumno">
                                                        El gimnasio le debe al alumno
                                                    </SelectItem>
                                                </>
                                            ) : (
                                                <>
                                                    <SelectItem value="No pagado">No pagado</SelectItem>
                                                    <SelectItem value="Pagado">Pagado</SelectItem>
                                                </>
                                            )}
                                        </SelectContent>
                                    </Select>
                                ) : key === "Responsable" ? (
                                    <Input value={user?.nombre} disabled />
                                ) : (
                                    <Input
                                        type={key === "Monto" || key === "DNI" ? "number" : "text"}
                                        value={value}
                                        onChange={(e) =>
                                            setEditForm((p) => ({ ...p, [key]: e.target.value }))
                                        }
                                    />
                                )}
                            </div>
                        ))}
                    </div>
                </FormEnterToTab>
            </ConfirmDialog>

            {/* Eliminar deuda */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar Deuda?"
                description="Esta acción no se puede deshacer"
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                loading={isSubmitting}
                onConfirm={handleConfirmDelete}
            >
                {selectedDeuda && (
                    <div className="text-sm p-4 bg-muted/50 rounded-md space-y-2">
                        <div><strong>Nombre:</strong> {selectedDeuda.Nombre}</div>
                        <div><strong>Motivo:</strong> {selectedDeuda.Motivo}</div>
                        <div><strong>Monto:</strong> ${selectedDeuda.Monto}</div>
                    </div>
                )}
            </ConfirmDialog>
        </>
    )
}
