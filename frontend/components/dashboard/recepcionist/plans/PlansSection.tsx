"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { PlusCircle, Trash, Edit, Tag, Box, DollarSign, CalendarDays, FileText } from "lucide-react"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { Input } from "@/components/ui/input"
import { Label } from "@radix-ui/react-dropdown-menu"
import { useAppData } from "@/context/AppDataContext"

export default function PlansSection() {
    const { planes, setPlanes } = useAppData();
    
    const [showCreateDialog, setShowCreateDialog] = useState(false)
    const [createForm, setCreateForm] = useState({ Tipo: "", "Plan o Producto": "", Precio: "", numero_Clases: "" })

    const [showEditDialog, setShowEditDialog] = useState(false)
    const [editingPlan, setEditingPlan] = useState<any | null>(null)
    const [editForm, setEditForm] = useState({ Tipo: "", "Plan o Producto": "", Precio: "", numero_Clases: "" })

    const [showDeleteDialog, setShowDeleteDialog] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<any | null>(null)

    const [showAumentosDialog, setShowAumentosDialog] = useState(false)
    const [aumentos, setAumentos] = useState<any[]>([])
    const [planSeleccionado, setPlanSeleccionado] = useState<any | null>(null)

    const handleConfirmCreate = async () => {
        try {
            const { data: nuevoPlan } = await axios.post(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes`, createForm)
            setPlanes(prev => [...prev, nuevoPlan])
            setShowCreateDialog(false)
            setCreateForm({ Tipo: "", "Plan o Producto": "", Precio: "", numero_Clases: "" })
        } catch (error) {
            console.error("Error al crear el plan:", error)
            alert("Error al crear el plan.")
        }
    }

    const handleConfirmEdit = async () => {
        if (!editingPlan) return
        try {
            const { data: planActualizado } = await axios.patch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${editingPlan.ID}`,
                editForm
            )
    
            setPlanes(prev =>
                prev.map(plan => plan.ID === editingPlan.ID ? planActualizado : plan)
            )
    
            setShowEditDialog(false)
            setEditingPlan(null)
        } catch (error) {
            console.error("Error al actualizar el plan:", error)
            alert("Hubo un problema al actualizar el plan.")
        }
    }
    
    const handleConfirmDelete = async () => {
        if (!selectedPlan) return
        try {
            await axios.delete(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/${selectedPlan.ID}`)
    
            setPlanes(prev =>
                prev.filter(plan => plan.ID !== selectedPlan.ID)
            )
    
            setShowDeleteDialog(false)
            setSelectedPlan(null)
        } catch (error) {
            console.error("Error al eliminar el plan:", error)
            alert("Error al eliminar el plan.")
        }
    }

    const handleShowAumentos = async (plan: any) => {
        try {
            const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/aumentos?plan=${encodeURIComponent(plan['Plan o Producto'])}`)
            setAumentos(res.data)
            setPlanSeleccionado(plan)
            setShowAumentosDialog(true)
        } catch (error) {
            console.error('Error al obtener aumentos:', error)
            alert('Error al cargar aumentos.')
        }
    }

    return (
        <TabsContent value="plans" className="space-y-4">
            <Card>
                <CardHeader>
                    <div className="flex justify-between">
                        <div>
                            <CardTitle>Planes</CardTitle>
                            <CardDescription>Gestiona tus planes y productos.</CardDescription>
                        </div>
                        <Button variant="orange" onClick={() => setShowCreateDialog(true)}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Agregar plan
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                        <div className="min-w-[800px]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="grid grid-cols-6">
                                        <TableHead className="flex items-center justify-center">Tipo</TableHead>
                                        <TableHead className="flex items-center justify-center col-span-2">Plan</TableHead>
                                        <TableHead className="flex items-center justify-center">Precio</TableHead>
                                        <TableHead className="flex items-center justify-center">Clases</TableHead>
                                        <TableHead className="flex items-center justify-center">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody>
                                    {planes.length > 0 ? (
                                        planes.map((plan, i) => (
                                            <TableRow key={ i} className="grid grid-cols-6 hover:bg-accent">
                                                <TableCell className="flex items-center justify-center">{plan.Tipo}</TableCell>
                                                <TableCell className="flex items-center justify-center col-span-2">{plan['Plan o Producto']}</TableCell>
                                                <TableCell className="flex items-center justify-center">{plan.Precio}</TableCell>
                                                <TableCell className="flex items-center justify-center">{plan.numero_Clases}</TableCell>
                                                <TableCell className="flex items-center justify-center">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setEditingPlan(plan)
                                                                setEditForm({
                                                                    Tipo: plan.Tipo,
                                                                    'Plan o Producto': plan['Plan o Producto'],
                                                                    Precio: plan.Precio,
                                                                    numero_Clases: plan.numero_Clases
                                                                })
                                                                setShowEditDialog(true)
                                                            }}
                                                        >
                                                            <Edit className="h-4 w-4 text-primary" />
                                                        </Button>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => handleShowAumentos(plan)}
                                                        >
                                                            <FileText className="h-4 w-4 text-primary" />
                                                        </Button>

                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedPlan(plan)
                                                                setShowDeleteDialog(true)
                                                            }}
                                                        >
                                                            <Trash className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow className="grid grid-cols-5">
                                            <TableCell colSpan={5} className="col-span-5 text-center py-4 text-muted-foreground">
                                                No hay planes disponibles
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>

                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Crear Plan */}
            <ConfirmDialog
                open={showCreateDialog}
                onOpenChange={setShowCreateDialog}
                title="Agregar plan"
                description="Complete los datos del nuevo plan"
                confirmText="Crear"
                cancelText="Cancelar"
                onConfirm={handleConfirmCreate}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col">
                        <Label>Tipo</Label>
                        <Input
                            value={createForm.Tipo}
                            onChange={e => setCreateForm({ ...createForm, Tipo: e.target.value })}
                            placeholder="GIMNASIO O CLASE"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Plan o Producto</Label>
                        <Input
                            value={createForm['Plan o Producto']}
                            onChange={e => setCreateForm({ ...createForm, 'Plan o Producto': e.target.value })}
                            placeholder="Ej: 3 veces x semana - Tela 2 veces x semana"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Precio</Label>
                        <Input
                            type="number"
                            value={createForm.Precio}
                            onChange={e => setCreateForm({ ...createForm, Precio: e.target.value })}
                            placeholder="Ej: 20000"
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Número de Clases</Label>
                        <Input
                            type="number"
                            value={createForm.numero_Clases}
                            onChange={e => setCreateForm({ ...createForm, numero_Clases: e.target.value })}
                            placeholder="ej: 12"
                        />
                    </div>
                </div>
            </ConfirmDialog>

            {/* Editar Plan */}
            <ConfirmDialog
                open={showEditDialog}
                onOpenChange={setShowEditDialog}
                title="Editar plan"
                description="Modificá los datos de este plan registrado." confirmText="Guardar cambios"
                cancelText="Cancelar"
                onConfirm={handleConfirmEdit}
            >
                <div className="space-y-4 text-sm">
                    <div className="flex flex-col">
                        <Label>Tipo</Label>
                        <Input
                            value={editForm.Tipo}
                            onChange={e => setEditForm({ ...editForm, Tipo: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Plan o Producto</Label>
                        <Input
                            value={editForm['Plan o Producto']}
                            onChange={e => setEditForm({ ...editForm, 'Plan o Producto': e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Precio</Label>
                        <Input
                            type="number"
                            value={editForm.Precio}
                            onChange={e => setEditForm({ ...editForm, Precio: e.target.value })}
                        />
                    </div>
                    <div className="flex flex-col">
                        <Label>Número de Clases</Label>
                        <Input
                            type="number"
                            value={editForm.numero_Clases}
                            onChange={e => setEditForm({ ...editForm, numero_Clases: e.target.value })}
                        />
                    </div>
                </div>
            </ConfirmDialog>

            <ConfirmDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                title="¿Eliminar plan?"
                description="Esta acción es permanente y no se puede deshacer."
                confirmText="Eliminar"
                cancelText="Cancelar"
                destructive
                onConfirm={handleConfirmDelete}
            >
                {selectedPlan && (
                    <div className="space-y-4 p-4 bg-muted/50 text-sm rounded-md">
                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <Tag className="mr-2 h-4 w-4" />
                                Tipo:
                            </div>
                            <div>{selectedPlan.Tipo}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <Box className="mr-2 h-4 w-4" />
                                Plan:
                            </div>
                            <div>{selectedPlan['Plan o Producto']}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <DollarSign className="mr-2 h-4 w-4" />
                                Precio:
                            </div>
                            <div>{selectedPlan.Precio}</div>
                        </div>

                        <div className="flex justify-between items-center text-primary font-medium">
                            <div className="flex items-center">
                                <CalendarDays className="mr-2 h-4 w-4" />
                                Clases:
                            </div>
                            <div>{selectedPlan.numero_Clases}</div>
                        </div>
                    </div>
                )}
            </ConfirmDialog>

            <ConfirmDialog
                open={showAumentosDialog}
                onOpenChange={setShowAumentosDialog}
                title="Historial de aumentos"
                description={planSeleccionado?.['Plan o Producto'] || ''}
                confirmText="Cerrar"
                onConfirm={() => setShowAumentosDialog(false)}              
            >
                <div className="p-2 bg-muted/50 rounded-md text-sm">
                    {aumentos.length > 0 ? (
                        <div className="max-h-[50vh] overflow-y-auto scrollbar-hide">
                            {aumentos.map((aumento, idx) => (
                                <div key={idx} className="flex flex-col gap-2 border-b py-2">
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <CalendarDays className="mr-2 h-4 w-4" />
                                            Fecha:
                                        </div>
                                        <div>{aumento.Fecha}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Precio anterior:
                                        </div>
                                        <div>{aumento.Precio_anterior}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <DollarSign className="mr-2 h-4 w-4" />
                                            Precio actualizado:
                                        </div>
                                        <div>{aumento.Precio_actualizado}</div>
                                    </div>
                                    <div className="flex justify-between items-center text-primary font-medium">
                                        <div className="flex items-center">
                                            <Tag className="mr-2 h-4 w-4" />
                                            Aumento:
                                        </div>
                                        <div>{aumento.Porcentaje_aumento}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-muted-foreground text-sm py-4">
                            No hay aumentos registrados para este plan.
                        </div>
                    )}
                </div>
            </ConfirmDialog>


        </TabsContent>
    )
}
