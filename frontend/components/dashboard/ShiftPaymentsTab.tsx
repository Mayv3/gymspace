"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Edit, Trash } from "lucide-react"
import { Label } from "@/components/ui/label"
import { DatePicker } from "@/components/dashboard/date-picker"
import { motion } from "framer-motion"

interface ShiftPaymentsTabProps {
  currentShiftPayments: any[]
  selectedDate: Date
  setSelectedDate: (date: Date) => void
  selectedShift: string
  setSelectedShift: (shift: string) => void
  setShowAddPayment: (show: boolean) => void
  formatDate: (date: Date) => string
  setSelectedPaymentToDelete: (payment: any) => void
  setShowDeletePaymentDialog: (show: boolean) => void
  onMemberUpdated: (dni: string, nuevaFecha: string, plan: string, numeroClases: number) => void
  refreshPayments: () => void 
}

export function ShiftPaymentsTab({
  currentShiftPayments,
  selectedDate,
  setSelectedDate,
  selectedShift,
  setSelectedShift,
  setShowAddPayment,
  formatDate,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  onMemberUpdated,
  refreshPayments
}: ShiftPaymentsTabProps) {

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Pagos por Turno</CardTitle>
            <CardDescription>Visualiza y gestiona los pagos del turno actual.</CardDescription>
          </div>
          <Button variant="orange" onClick={() => setShowAddPayment(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Añadir Pago
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
                  <SelectValue />
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
                    <TableHead>Miembro</TableHead>
                    <TableHead>Hora</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Fecha de inicio</TableHead>
                    <TableHead>Fecha de vencimiento</TableHead>
                    <TableHead>Registrado Por</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentShiftPayments.length > 0 ? (
                    currentShiftPayments.map((payment, index) => (
                      <motion.tr
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: index * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="font-medium">{payment.Nombre}</TableCell>
                        <TableCell>{payment.Hora || "No hay horario"}</TableCell>
                        <TableCell className="text-green-600 font-medium">${payment.Monto}</TableCell>
                        <TableCell>{payment.Metodo_de_Pago}</TableCell>
                        <TableCell>{payment.Fecha_de_Pago}</TableCell>
                        <TableCell>{payment.Fecha_de_Vencimiento}</TableCell>
                        <TableCell>{payment.Responsable}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => {
                                setSelectedPaymentToDelete(payment)
                                setShowDeletePaymentDialog(true)
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
                      <TableCell colSpan={8} className="text-center py-4 text-muted-foreground">
                        No hay pagos registrados para este turno
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="text-sm font-medium">
              Pagos del turno <span className="text-primary">{selectedShift}</span> del{" "}
              <span className="text-primary">{formatDate(selectedDate)}</span>
            </div>
            <div className="text-lg font-bold">
              Total:{" "}
              <span className="text-green-600">
                $
                {currentShiftPayments.reduce(
                  (sum, payment) => sum + parseFloat(String(payment.Monto || "0")),
                  0
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
