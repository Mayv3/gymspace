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
import { useEffect } from "react"
import dayjs from "dayjs"

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
}: ShiftPaymentsTabProps) {
  const [resumenPorTipo, setResumenPorTipo] = useState<{ [tipo: string]: number }>({})

  useEffect(() => {
    const totales: { [tipo: string]: number } = {}

    currentShiftPayments.forEach((pago: any) => {
      const tipo = pago.Tipo || "Sin tipo"
      const monto = parseFloat(pago.Monto || "0")

      if (!totales[tipo]) totales[tipo] = 0
      totales[tipo] += monto
    })

    setResumenPorTipo(totales)
  }, [currentShiftPayments])

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

          <div className="bg-white rounded-2xl shadow-sm py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-start gap-2">
              <h2 className="text-2xl text-gray-800">
                Pagos del turno {selectedShift}
              </h2>
              <span className="text-lg text-gray-500">
                {formatDate(selectedDate)}
              </span>
            </div>

            {Object.keys(resumenPorTipo).length > 0 && (
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <h3 className="flex items-center text-gray-600 font-medium mb-4">
                  Recaudación por tipo de pago
                </h3>

                <ul className="space-y-3">
                  {Object.entries(resumenPorTipo).map(([tipo, total]) => (
                    <li key={tipo} className="flex justify-between items-center">
                      <span className="text-gray-600">{tipo}</span>
                      <span className="font-semibold text-green-600">
                        ${total.toLocaleString("es-AR")}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium text-gray-700">Total del turno:</span>
                <span className="text-2xl font-bold text-green-600">
                  $
                  {currentShiftPayments
                    .reduce((sum, payment) => sum + parseFloat(String(payment.Monto || "0")), 0)
                    .toLocaleString("es-AR")}
                </span>
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </>
  )
}
