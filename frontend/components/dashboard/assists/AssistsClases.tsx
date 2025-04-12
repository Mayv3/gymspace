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
import dayjs from "dayjs"
import RegisterClassDialog from "./add-assists-dialog"

export default function AssistsSection() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")
  const [assists, setAssists] = useState<any[]>([])
  const [showAddDialog, setShowAddDialog] = useState(false)

  const fetchAssists = async () => {
    try {
      const fechaFormateada = dayjs(selectedDate).format("YYYY-MM-DD")
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-diarias?fecha=${fechaFormateada}`)
      const data = await res.json()
  
      const formateadas = data.map((asistencia: any) => ({
        ...asistencia,
        Fecha: dayjs(asistencia.Fecha).format("DD/MM/YYYY"),
      }))
  
      setAssists(formateadas)
    } catch (error) {
      console.error("Error al obtener clases diarias", error)
    }
  }
  

  useEffect(() => {
    fetchAssists()
  }, [selectedDate])

  const handleAddLocal = (nuevaClase: any) => {
    setAssists((prev) => [...prev, nuevaClase])
    setShowAddDialog(false)
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
              <Label>Turno</Label>
              <Select value={selectedShift} onValueChange={setSelectedShift}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar turno" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mañana">Mañana</SelectItem>
                  <SelectItem value="tarde">Tarde</SelectItem>
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
                        key={asistencia.id || index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="w-1/5">{asistencia["Tipo de Clase"]}</TableCell>
                        <TableCell className="w-1/5">{dayjs(asistencia.Fecha).format("DD/MM/YYYY")}</TableCell>
                        <TableCell className="w-1/5">{asistencia["Cantidad de presentes"]}</TableCell>
                        <TableCell className="w-1/5">{asistencia.Responsable}</TableCell>
                        <TableCell className="w-1/5">
                          <div className="flex gap-2">
                            <Button size="icon" variant="ghost">
                              <Edit className="h-4 w-4 text-primary" />
                            </Button>
                            <Button size="icon" variant="ghost">
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
    </TabsContent>
  )
}
