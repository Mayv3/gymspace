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
  onMemberUpdated: (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => void
  refreshPayments: () => void
  cashOpen: boolean
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
  refreshPayments,
  cashOpen
}: ShiftPaymentsTabProps) {
  const [resumenPorTipo, setResumenPorTipo] = useState<{ [tipo: string]: number }>({})
  const [totalesPorMetodo, setTotalesPorMetodo] = useState({ efectivo: 0, tarjeta: 0 })

  useEffect(() => {
    const totales: { [tipo: string]: { [metodo: string]: number } } = {}
    let totalEfectivo = 0
    let totalTarjeta = 0

    const pagosDelTurno = currentShiftPayments.filter(p => p.Turno === selectedShift)

    pagosDelTurno.forEach((pago: any) => {
      const tipo = pago.Tipo || "Sin tipo"
      const metodo = pago.Metodo_de_Pago || "Sin método"
      const monto = parseFloat(pago.Monto || "0")

      if (!totales[tipo]) {
        totales[tipo] = {}
      }
      if (!totales[tipo][metodo]) {
        totales[tipo][metodo] = 0
      }

      totales[tipo][metodo] += monto

      if (metodo.toLowerCase() === "efectivo") {
        totalEfectivo += monto
      } else if (metodo.toLowerCase() === "tarjeta") {
        totalTarjeta += monto
      }
    })

    setResumenPorTipo(totales)
    setTotalesPorMetodo({ efectivo: totalEfectivo, tarjeta: totalTarjeta })
  }, [currentShiftPayments, selectedShift])
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
              <DatePicker
                date={selectedDate}
                setDate={setSelectedDate}
                disabled={cashOpen}
              />
            </div>
            <div className="flex-1">
              <Label>Turno</Label>
              <Select
                value={selectedShift}
                onValueChange={setSelectedShift}
                disabled={cashOpen}
              >
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
                    <TableHead className="text-center w-32">Miembro</TableHead>
                    <TableHead className="text-center w-32">Hora</TableHead>
                    <TableHead className="text-center w-32">Monto</TableHead>
                    <TableHead className="text-center w-32">Método</TableHead>
                    <TableHead className="text-center w-32">Fecha de pago</TableHead>
                    <TableHead className="text-center w-32">Fecha de vencimiento</TableHead>
                    <TableHead className="text-center w-32">Tipo</TableHead>
                    <TableHead className="text-center w-32">Registrado Por</TableHead>
                    <TableHead className="text-center w-32">Acciones</TableHead>
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
                        <TableCell className="text-center w-32 font-medium">{payment.Nombre}</TableCell>
                        <TableCell className="text-center w-32">{payment.Hora || "No hay horario"}</TableCell>
                        <TableCell className="text-center w-32 text-green-600 font-medium">${payment.Monto}</TableCell>
                        <TableCell className="text-center w-32">{payment.Metodo_de_Pago}</TableCell>
                        <TableCell className="text-center w-32">{payment.Fecha_de_Pago}</TableCell>
                        <TableCell className="text-center w-32">{payment.Fecha_de_Vencimiento}</TableCell>
                        <TableCell className="text-center w-32">{payment.Tipo}</TableCell>
                        <TableCell className="text-center w-32">{payment.Responsable}</TableCell>
                        <TableCell className="text-center w-32">
                          <div className="flex justify-center gap-2">
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
                      <TableCell colSpan={9} className="text-center py-4 text-muted-foreground">
                        No hay pagos registrados para este turno
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>

            </div>
          </div>

          <div className="bg-background rounded-2xl shadow-sm py-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-start gap-2">
              <h2 className="text-2xl text-foreground">
                Totales del turno {selectedShift}
              </h2>
              <span className="text-lg text-muted-foreground">
                {formatDate(selectedDate)}
              </span>
            </div>

            {Object.keys(resumenPorTipo).length > 0 && (
              <div className="bg-muted rounded-xl p-5 border border-border">
                <h3 className="flex items-center text-muted-foreground font-medium mb-4">
                  Recaudación por tipo de pago
                </h3>
                <div
                  className={`grid grid-cols-1 ${Object.keys(resumenPorTipo).length === 1
                    ? "md:grid-cols-2"
                    : "md:grid-cols-3"
                    } gap-4`}
                >
                  {Object.entries(resumenPorTipo).map(([tipo, metodos]) => (
                    <div
                      key={tipo}
                      className="bg-muted rounded-xl p-5 border border-orange-500"
                    >
                      <h4 className="text-lg font-semibold text-foreground mb-4 text-start">
                        {tipo}
                      </h4>
                      <ul className="space-y-2">
                        {Object.entries(metodos).map(([metodo, total]) => (
                          <li key={metodo} className="flex justify-between">
                            <span className="text-muted-foreground">{metodo}</span>
                            <span className="font-semibold text-green-600">
                              ${total.toLocaleString("es-AR")}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}

                  {/* Box de totales finales */}
                  <div className="bg-muted rounded-xl p-4 space-y-4 border border-orange-500">
                    <div className="flex justify-between items-center">
                      <span className="text-lg text-foreground">Total en Tarjeta:</span>
                      <span className="text-xl font-semibold text-green-500">
                        ${totalesPorMetodo.tarjeta.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-lg text-foreground">Total en Efectivo:</span>
                      <span className="text-xl font-semibold text-green-500">
                        ${totalesPorMetodo.efectivo.toLocaleString("es-AR")}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-lg font-medium text-foreground">
                        Total del turno:
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        $
                        {currentShiftPayments
                          .reduce(
                            (sum, payment) => sum + parseFloat(String(payment.Monto || "0")),
                            0
                          )
                          .toLocaleString("es-AR")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
