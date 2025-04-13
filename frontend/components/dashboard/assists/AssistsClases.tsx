"use client"

import { useEffect, useState } from "react"
import { TabsContent } from "@/components/ui/tabs"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/dashboard/date-picker"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { PlusCircle, Trash, Edit } from "lucide-react"
import { motion } from "framer-motion"
import { useAppData } from "@/context/AppDataContext"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import RegisterClassDialog from "./add-assists-dialog"
import { CalendarDays, Users, UserCircle, ClipboardList } from "lucide-react"
import dayjs from "dayjs"
import { Input } from "@/components/ui/input"

export default function AssistsSection() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedType, setSelectedType] = useState("todas")
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedClass, setSelectedClass] = useState<any | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<any | null>(null)
  const [editForm, setEditForm] = useState({
    Fecha: "",
    "Tipo de Clase": "",
    "Cantidad de presentes": "",
    Responsable: ""
  })
  const { assists, fetchAssists, setAssists, deleteAsistencia, editAsistencia } = useAppData()

  useEffect(() => {
    fetchAssists({ selectedDate, selectedType })
  }, [selectedDate, selectedType])

  const handleAddLocal = (nuevaClase: any) => {
    setAssists((prev: any[]) => [...prev, nuevaClase])
    setShowAddDialog(false)
  }

  const handleConfirmDelete = async () => {
    if (!selectedClass) return
    try {
      await deleteAsistencia(selectedClass.ID)
      setShowDeleteDialog(false)
      setSelectedClass(null)
    } catch (error) {
      alert("Error al eliminar la clase.")
    }
  }

  return (
    <TabsContent value="assists" className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Asistencias</CardTitle>
            <CardDescription>Controla las asistencias registradas en el sistema.</CardDescription>
          </div>
          <Button variant="orange" onClick={() => setShowAddDialog(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> Registrar presentes de una clase
          </Button>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label>Fecha</Label>
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
            </div>
            <div className="flex-1">
              <Label>Tipo de clase</Label>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas</SelectItem>
                  <SelectItem value="tela">Tela</SelectItem>
                  <SelectItem value="acrobacia">Acrobacia</SelectItem>
                  <SelectItem value="funcional">Funcional</SelectItem>
                  <SelectItem value="cross">Cross</SelectItem>
                  <SelectItem value="yoga">Yoga</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-1/5">Tipo de Clase</TableHead>
                    <TableHead className="w-1/5">Fecha</TableHead>
                    <TableHead className="w-1/5">Presentes</TableHead>
                    <TableHead className="w-1/5">Responsable</TableHead>
                    <TableHead className="w-1/5">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assists.length > 0 ? (
                    assists.map((asistencia, index) => (
                      <motion.tr
                        key={asistencia.ID || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="w-1/5">{asistencia["Tipo de Clase"]}</TableCell>
                        <TableCell className="w-1/5">{dayjs(asistencia.Fecha, "D/M/YYYY").format("DD/MM/YYYY")}</TableCell>
                        <TableCell className="w-1/5">{asistencia["Cantidad de presentes"]}</TableCell>
                        <TableCell className="w-1/5">{asistencia.Responsable}</TableCell>
                        <TableCell className="w-1/5">
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setEditingClass(asistencia)
                                setEditForm({
                                  Fecha: asistencia.Fecha,
                                  "Tipo de Clase": asistencia["Tipo de Clase"],
                                  "Cantidad de presentes": asistencia["Cantidad de presentes"],
                                  Responsable: asistencia.Responsable
                                })
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedClass(asistencia)
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
                      <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                        No hay asistencias registradas
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>

      <RegisterClassDialog open={showAddDialog} onOpenChange={setShowAddDialog} onAdd={handleAddLocal} />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="¿Eliminar clase?"
        description="Esta acción es permanente y no se puede deshacer."
        confirmText="Eliminar"
        cancelText="Cancelar"
        destructive
        onConfirm={handleConfirmDelete}
      >
        {selectedClass && (
          <div className="space-y-5 rounded-md p-4 bg-muted/50 text-sm">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Tipo de Clase:</span>
              <span className="ml-auto">{selectedClass["Tipo de Clase"]}</span>
            </div>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Fecha:</span>
              <span className="ml-auto">{dayjs(selectedClass.Fecha, "D/M/YYYY").format("DD/MM/YYYY")}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Presentes:</span>
              <span className="ml-auto">{selectedClass["Cantidad de presentes"]}</span>
            </div>
            <div className="flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-primary" />
              <span className="font-medium text-primary">Responsable:</span>
              <span className="ml-auto">{selectedClass.Responsable}</span>
            </div>
          </div>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        title="Editar clase"
        description="Modificá los datos de esta clase registrada."
        confirmText="Guardar cambios"
        cancelText="Cancelar"
        onConfirm={async () => {
          try {
            await editAsistencia(editingClass.ID, editForm)
            await fetchAssists({ selectedDate, selectedType })
            setShowEditDialog(false)
          } catch (error) {
            console.error(error)
            alert("Hubo un problema al actualizar la clase.")
          }
        }}
      >
        <div className="space-y-4 text-sm">
          <div className="flex flex-col">
            <Label>Fecha</Label>
            <Input
              value={editForm.Fecha}
              onChange={(e) => setEditForm({ ...editForm, Fecha: e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <Label>Tipo de Clase</Label>
            <Input
              value={editForm["Tipo de Clase"]}
              onChange={(e) => setEditForm({ ...editForm, "Tipo de Clase": e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <Label>Cantidad de Presentes</Label>
            <Input
              type="number"
              value={editForm["Cantidad de presentes"]}
              onChange={(e) => setEditForm({ ...editForm, "Cantidad de presentes": e.target.value })}
            />
          </div>
          <div className="flex flex-col">
            <Label>Responsable</Label>
            <Input
              value={editForm.Responsable}
              onChange={(e) => setEditForm({ ...editForm, Responsable: e.target.value })}
            />
          </div>
        </div>
      </ConfirmDialog>
    </TabsContent>
  )
}
