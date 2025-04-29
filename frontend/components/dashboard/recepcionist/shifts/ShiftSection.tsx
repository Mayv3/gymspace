"use client"

import { useEffect, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Edit, Trash, CalendarDays, User, ClipboardList } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import axios from "axios"
import dayjs from "dayjs"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { useUser } from "@/context/UserContext";
import { useAppData } from "@/context/AppDataContext"

export default function ShiftsSection() {
    const { turnos, setTurnos } = useAppData()

    const [selectedDate, setSelectedDate] = useState(new Date())
    const [selectedType, setSelectedType] = useState("todas")

    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState({ Tipo: "", Fecha_turno: "", Profesional: "", Responsable: "" })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingTurno, setEditingTurno] = useState<any | null>(null)
    const [editForm, setEditForm] = useState({ Tipo: "", Fecha_turno: "", Profesional: "", Responsable: "" })

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedTurno, setSelectedTurno] = useState<any | null>(null)

    const { user } = useUser();

    const filteredTurnos = turnos.filter(turno => {
        if (selectedType === "todas") return true
        return turno.Tipo === selectedType
    })

    const handleConfirmCreate = async () => {
        try {
            const fechaNormalizada = dayjs(createForm.Fecha_turno, "DD/MM/YYYY").format("D/M/YYYY");
            const payload = {
                tipo: createForm.Tipo,
                fecha_turno: fechaNormalizada,
                profesional: createForm.Profesional,
                responsable: user?.nombre,
            };

            const { data: nuevoTurno } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos`, payload);

            setTurnos(prev => [...prev, nuevoTurno]);

            setShowCreateDialog(false);
            setCreateForm({ Tipo: "", Fecha_turno: "", Profesional: "", Responsable: "" });
        } catch (error) {
            console.error("Error al crear turno:", error);
        }
    }

    const handleConfirmEdit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingTurno) return;
        try {
            const { data: turnoActualizado } = await axios.put(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${editingTurno.ID}`,
                editForm
            );

            setTurnos(prev =>
                prev.map(turno =>
                    turno.ID === editingTurno.ID
                        ? { ...turno, ...turnoActualizado } // 
                        : turno
                )
            );

            setShowEditDialog(false);
            setEditingTurno(null);
        } catch (error) {
            console.error("Error al actualizar turno:", error);
            alert("Error al actualizar el turno.");
        }
    };

    const handleConfirmDelete = async () => {
        if (!selectedTurno) return;
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos/${selectedTurno.ID}`);

            setTurnos(prev => prev.filter(turno => turno.ID !== selectedTurno.ID));

            setShowDeleteDialog(false);
            setSelectedTurno(null);
        } catch (error) {
            console.error("Error al eliminar turno:", error);
        }
    }

    useEffect(() => {
        const fetchTurnosPorFecha = async () => {
            try {
                const fechaFormateada = dayjs(selectedDate).format("DD/MM/YYYY");
                const { data } = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/turnos?fecha=${fechaFormateada}`);
                setTurnos(data);
            } catch (error) {
                console.error("Error al cargar turnos por fecha:", error);
            }
        };

        fetchTurnosPorFecha();
    }, [selectedDate]);

    return (
        <TabsContent value="shifts" className="space-y-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Turnos</CardTitle>
                        <CardDescription>Gestiona los turnos agendados.</CardDescription>
                    </div>
                    <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Agregar turno
                    </Button>
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
                                    <SelectItem value="todas">Todos</SelectItem>
                                    <SelectItem value="Antropometría">Antropometría</SelectItem>
                                    <SelectItem value="Nutrición">Nutrición</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                        <div className="min-w-[900px]">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="text-center w-1/5">Tipo</TableHead>
                                        <TableHead className="text-center w-1/5">Fecha Turno</TableHead>
                                        <TableHead className="text-center w-1/5">Profesional</TableHead>
                                        <TableHead className="text-center w-1/5">Responsable</TableHead>
                                        <TableHead className="text-center w-1/5">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredTurnos.length > 0 ? (
                                        filteredTurnos.map((turno, index) => (
                                            <motion.tr
                                                key={index}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                                className="hover:bg-accent"
                                            >
                                                <TableCell className="text-center w-1/5">{turno.Tipo}</TableCell>
                                                <TableCell className="text-center w-1/5">{turno.Fecha_turno}</TableCell>
                                                <TableCell className="text-center w-1/5">{turno.Profesional}</TableCell>
                                                <TableCell className="text-center w-1/5">{turno.Responsable}</TableCell>
                                                <TableCell className="text-center w-1/5">
                                                    <div className="flex justify-center gap-2">
                                                        <Button size="icon" variant="ghost" onClick={() => {
                                                            setEditingTurno(turno)
                                                            setEditForm({
                                                                Tipo: turno.Tipo,
                                                                Fecha_turno: turno.Fecha_turno,
                                                                Profesional: turno.Profesional,
                                                                Responsable: turno.Responsable,
                                                            })
                                                            setShowEditDialog(true)
                                                        }}>
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Button>
                                                        <Button size="icon" variant="ghost" onClick={() => {
                                                            setSelectedTurno(turno)
                                                            setShowDeleteDialog(true)
                                                        }}>
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </motion.tr>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                                                No hay turnos registrados
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Crear Turno Dialog */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar Turno"
                description="Completa los datos del nuevo turno"
                confirmText="Crear"
                cancelText="Cancelar"
                onConfirm={handleConfirmCreate}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col">
                        <Label>Tipo</Label>
                        <Select value={createForm.Tipo} onValueChange={(value) => setCreateForm(prev => ({ ...prev, Tipo: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Antropometría">Antropometría</SelectItem>
                                <SelectItem value="Nutrición">Nutrición</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <Label>Fecha Turno</Label>
                        <DatePicker
                            date={createForm.Fecha_turno ? dayjs(createForm.Fecha_turno, "DD/MM/YYYY").toDate() : undefined}
                            setDate={(date) =>
                                setCreateForm(prev => ({
                                    ...prev,
                                    Fecha_turno: dayjs(date).format("DD/MM/YYYY")
                                }))
                            }
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Profesional</Label>
                        <Input value={createForm.Profesional} onChange={(e) => setCreateForm(prev => ({ ...prev, Profesional: e.target.value }))} placeholder="Ej: Gabriel Torres" />
                    </div>
                    <div className="flex flex-col">
                        <Label>Responsable</Label>
                        <Input value={user?.nombre} disabled />
                    </div>
                </div>
            </ConfirmDialog>


            {/* Editar Turno Dialog */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar Turno"
                description="Modifica los datos del turno."
                confirmText="Guardar cambios"
                cancelText="Cancelar"
                onConfirm={handleConfirmEdit}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col">
                        <Label>Tipo</Label>
                        <Select value={editForm.Tipo} onValueChange={(value) => setEditForm(prev => ({ ...prev, Tipo: value }))}>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Antropometría">Antropometría</SelectItem>
                                <SelectItem value="Nutrición">Nutrición</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col">
                        <Label>Fecha Turno</Label>
                        <DatePicker
                            date={editForm.Fecha_turno ? dayjs(editForm.Fecha_turno, "DD/MM/YYYY").toDate() : undefined}
                            setDate={(date) =>
                                setEditForm(prev => ({
                                    ...prev,
                                    Fecha_turno: dayjs(date).format("DD/MM/YYYY")
                                }))
                            }
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Profesional</Label>
                        <Input value={editForm.Profesional} onChange={(e) => setEditForm(prev => ({ ...prev, Profesional: e.target.value }))} />
                    </div>
                    <div className="flex flex-col">
                        <Label>Responsable</Label>
                        <Input value={editForm.Responsable} disabled onChange={(e) => setEditForm(prev => ({ ...prev, Responsable: e.target.value }))} />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Eliminar Turno Dialog */}
            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar Turno?"
                description="Esta acción no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                onConfirm={handleConfirmDelete}
            >
                {selectedTurno && (
                    <div className="space-y-4 p-4 bg-muted/50 text-sm rounded-md font-medium">
                        <div className="flex justify-between items-center text-primary">
                            <div className="flex">
                                <ClipboardList className="mr-2 h-4 w-4" />
                                <span>Tipo</span>
                            </div>
                            <span> {selectedTurno.Tipo}</span>
                        </div>
                        <div className="flex justify-between items-center text-primary">
                            <div className="flex">
                                <CalendarDays className="mr-2 h-4 w-4 " />
                                <span>Fecha Turno</span>
                            </div>
                            <span>{selectedTurno.Fecha_turno}</span>
                        </div>
                        <div className="flex justify-between items-center text-primary">
                            <div className="flex">
                                <User className="mr-2 h-4 w-4 " />
                                <span>Profesional</span>
                            </div>
                            <span>{selectedTurno.Profesional}</span>
                        </div>
                    </div>
                )}
            </ConfirmDialog>
        </TabsContent>
    )
}