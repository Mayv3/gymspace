"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PlusCircle, Trash, Dumbbell, GraduationCap, ShoppingBag, Wrench } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { motion } from "framer-motion"
import { PaymentsFilters } from "@/hooks/usePayments"

interface ShiftPaymentsTabProps {
  currentShiftPayments: any[]

  selectedDay?: number
  setSelectedDay: (n?: number) => void
  selectedMonth?: number
  setSelectedMonth: (n?: number) => void
  selectedYear?: number
  setSelectedYear: (n?: number) => void

  selectedShift: string
  setSelectedShift: (shift: string) => void

  setShowAddPayment: (show: boolean) => void
  setSelectedPaymentToDelete: (payment: any) => void
  setShowDeletePaymentDialog: (show: boolean) => void
  onMemberUpdated: (dni: string, nuevaFecha: string, nuevoPlan: string, clasesPagadas: number) => void
  refreshPayments: (filters: PaymentsFilters) => void
  cashOpen: boolean
}

export function ShiftPaymentsTab({
  currentShiftPayments,
  selectedDay,
  setSelectedDay,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  selectedShift,
  setSelectedShift,
  setShowAddPayment,
  setSelectedPaymentToDelete,
  setShowDeletePaymentDialog,
  refreshPayments,
  cashOpen,
}: ShiftPaymentsTabProps) {
  const [resumenPorTipo, setResumenPorTipo] = useState<{ [tipo: string]: { [metodo: string]: number } }>({})
  const [totalesPorMetodo, setTotalesPorMetodo] = useState({ efectivo: 0, tarjeta: 0 })
  const [searchTerm, setSearchTerm] = useState("")
  const [tipoFiltro, setTipoFiltro] = useState<string>("todos")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    const totales: Record<string, Record<string, number>> = {}
    let totalEfectivo = 0
    let totalTarjeta = 0

    currentShiftPayments.forEach((pago: any) => {
      const tipo = pago.Tipo || "Sin tipo"
      const metodo = pago.Metodo_de_Pago || "Sin método"
      const monto = parseFloat(pago.Monto || "0")

      if (!totales[tipo]) totales[tipo] = {}
      totales[tipo][metodo] = (totales[tipo][metodo] || 0) + monto

      if (metodo.toLowerCase() === "efectivo") totalEfectivo += monto
      else if (metodo.toLowerCase() === "tarjeta") totalTarjeta += monto
    })

    setResumenPorTipo(totales)
    setTotalesPorMetodo({ efectivo: totalEfectivo, tarjeta: totalTarjeta })
  }, [currentShiftPayments])

  const filteredPayments = currentShiftPayments.filter(p => {
    const nombreMatch = p.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.Ultimo_Plan?.toLowerCase().includes(searchTerm.toLowerCase())
    const tipoMatch = tipoFiltro === "todos" || p.Tipo === tipoFiltro
    return nombreMatch && tipoMatch
  })

  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, tipoFiltro])

  const resumenAgrupado: Record<
    string,
    { metodos: Record<string, number>; deuda: number }
  > = {}

  for (const [tipo, metodos] of Object.entries(resumenPorTipo)) {
    let clave = tipo
    let esDeuda = false

    if (tipo.toLowerCase().includes("deuda gimnasio")) {
      clave = "GIMNASIO"
      esDeuda = true
    } else if (tipo.toLowerCase().includes("deuda clases")) {
      clave = "CLASE"
      esDeuda = true
    }

    if (!resumenAgrupado[clave]) {
      resumenAgrupado[clave] = { metodos: {}, deuda: 0 }
    }

    for (const [metodo, monto] of Object.entries(metodos)) {
      resumenAgrupado[clave].metodos[metodo] =
        (resumenAgrupado[clave].metodos[metodo] || 0) + monto

      if (esDeuda) {
        resumenAgrupado[clave].deuda += monto
      }
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="bg-orange-50 dark:bg-zinc-900 rounded-t-lg mb-4">
          <div className="flex justify-between">
            <div>
              <CardTitle>Pagos</CardTitle>
              <CardDescription className="hidden md:block">Visualiza y gestiona los pagos del turno actual.</CardDescription>
            </div>
            <Button variant="orange" onClick={() => setShowAddPayment(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Añadir Pago
            </Button>
          </div>

        </CardHeader>
        <CardContent>
          {/* FILTROS */}
          {!cashOpen && (
            <div className="flex flex-wrap justify-between bg pb-4">
              <div className="flex  w-full  flex-col md:flex-row md:w-[50%]">
                <div className="grid grid-cols-2 gap-2 ">
                  <div className="max-w-sm">
                    <Label htmlFor="search">Buscar por nombre</Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Alumno o plan"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-36">
                    <Label>Tipo</Label>
                    <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                      <SelectTrigger>
                        <SelectValue placeholder="Todos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        <SelectItem value="GIMNASIO">GIMNASIO</SelectItem>
                        <SelectItem value="CLASE">CLASE</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <Label>Día</Label>
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={selectedDay ?? ""}
                      onChange={e =>
                        setSelectedDay(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>

                  <div className="w-24">
                    <Label>Mes</Label>
                    <Input
                      type="number"
                      min={1}
                      max={12}
                      value={selectedMonth ?? ""}
                      onChange={e =>
                        setSelectedMonth(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>

                  <div className="w-28">
                    <Label>Año</Label>
                    <Input
                      type="number"
                      min={2000}
                      max={2100}
                      value={selectedYear ?? ""}
                      onChange={e =>
                        setSelectedYear(e.target.value ? Number(e.target.value) : undefined)
                      }
                      disabled={cashOpen}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      onClick={() => {
                        const today = new Date()
                        refreshPayments({
                          dia: cashOpen ? today.getDate() : selectedDay,
                          mes: selectedMonth,
                          anio: selectedYear,
                          turno: selectedShift,
                        })
                      }}
                      disabled={cashOpen}
                    >
                      Filtrar
                    </Button>
                  </div>
                </div>
              </div>


              <div className="w-32">
                <Label>Turno</Label>
                <Select
                  value={selectedShift}
                  onValueChange={setSelectedShift}
                  disabled={cashOpen}
                >
                  <SelectTrigger className={selectedShift === 'todos' ? 'animate-blink border-orange-500' : ''}>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="mañana">Mañana</SelectItem>
                    <SelectItem value="tarde">Tarde</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

          )}

          <div className="hidden md:block rounded-md border overflow-auto max-w-[calc(100vw-2rem)] mb-6">
            <div className="min-w-[800px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-center w-32">Miembro</TableHead>
                    <TableHead className="text-center w-32">Hora</TableHead>
                    <TableHead className="text-center w-32">Monto</TableHead>
                    <TableHead className="text-center w-32">Método</TableHead>
                    <TableHead className="text-center w-32">Fecha de pago</TableHead>
                    <TableHead className="text-center w-32">Fecha de venc.</TableHead>
                    <TableHead className="text-center w-32">Tipo</TableHead>
                    <TableHead className="text-center w-32">Turno</TableHead>
                    <TableHead className="text-center w-32">Plan Pagado</TableHead>
                    <TableHead className="text-center w-32">Registrado Por</TableHead>
                    <TableHead className="text-center w-32">Acciones</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="hover:bg-accent"
                      >
                        <TableCell className="text-center font-medium">{payment.Nombre}</TableCell>
                        <TableCell className="text-center">{payment.Hora || "—"}</TableCell>
                        <TableCell className="text-center text-green-600 font-medium">
                          ${payment.Monto}
                        </TableCell>
                        <TableCell className="text-center">{payment.Metodo_de_Pago}</TableCell>
                        <TableCell className="text-center">{payment.Fecha_de_Pago}</TableCell>
                        <TableCell className="text-center">{payment.Fecha_de_Vencimiento}</TableCell>
                        <TableCell className="text-center">{payment.Tipo}</TableCell>
                        <TableCell className="text-center">{payment.Turno}</TableCell>
                        <TableCell className="text-center">{payment.Ultimo_Plan || "—"}</TableCell>
                        <TableCell className="text-center">{payment.Responsable}</TableCell>
                        <TableCell className="text-center">
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

          <div className="block md:hidden space-y-4 mb-6">
            {paginatedPayments.map((p, idx) => (
              <Card key={idx} className="shadow-sm rounded-lg overflow-hidden">
                {/* Header */}
                <CardHeader className="bg-white px-4 py-3 flex border-b">
                  <div className="flex items-end justify-between">
                    <CardTitle className="text-base font-semibold">{p.Nombre}</CardTitle>
                    <p className="text-sm text-gray-500">{p.Hora || "—"} hs</p>
                  </div>

                </CardHeader>

                {/* Content: grid dos columnas */}
                <CardContent className="bg-gray-50 px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="font-bold text-gray-600">Monto</p>
                    <p className="text-green-600 font-medium">${p.Monto}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Método</p>
                    <p>{p.Metodo_de_Pago}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Fecha Pago</p>
                    <p>{p.Fecha_de_Pago}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Vencimiento</p>
                    <p>{p.Fecha_de_Vencimiento}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Tipo</p>
                    <p>{p.Tipo}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Turno</p>
                    <p>{p.Turno}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Plan Pagado</p>
                    <p>{p.Ultimo_Plan || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-gray-600">Registrado Por</p>
                    <p>{p.Responsable}</p>
                  </div>
                </CardContent>

                <CardFooter className="bg-white px-4 py-3 space-y-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full justify-center"
                    onClick={() => {
                      setSelectedPaymentToDelete(p)
                      setShowDeletePaymentDialog(true)
                    }}
                  >
                    Eliminar
                  </Button>
                </CardFooter>
              </Card>
            ))}

          </div>

          {filteredPayments.length > itemsPerPage && (
            <div className="flex justify-center gap-2 my-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-2 text-sm">
                Página {currentPage} de {Math.ceil(filteredPayments.length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                onClick={() =>
                  setCurrentPage((prev) =>
                    prev < Math.ceil(filteredPayments.length / itemsPerPage) ? prev + 1 : prev
                  )
                }
                disabled={currentPage >= Math.ceil(filteredPayments.length / itemsPerPage)}
              >
                Siguiente
              </Button>
            </div>
          )}

          <div className="bg-orange-50 dark:from-zinc-900 dark:to-zinc-800 rounded-2xl shadow-lg border border-orange-200 dark:border-zinc-700 p-6 space-y-6">
            <div className="border-b border-orange-200 dark:border-zinc-700 pb-4">
              <h2 className="text-3xl font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                Totales del turno {selectedShift !== 'todos' && ` ${selectedShift}`}
              </h2>
              <div className="mt-2 text-sm text-muted-foreground flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="font-semibold">{selectedDay}/{selectedMonth}/{selectedYear}</span>
                </span>
                {selectedShift !== 'todos' && (
                  <>
                    <span className="text-orange-500">•</span>
                    <span className="inline-flex items-center gap-1">
                      🕐 Turno: <span className="font-semibold capitalize">{selectedShift}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {Object.keys(resumenPorTipo).length > 0 ? (
              <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(250px,1fr))]">
                {Object.entries(resumenAgrupado).map(([tipo, { metodos, deuda }]) => {
                  const totalPorTipo = Object.values(metodos).reduce((sum, val) => sum + val, 0)
                  return (
                    <div 
                      key={tipo} 
                      className="bg-white dark:bg-zinc-900 rounded-xl p-6 border-2 border-orange-200 dark:border-zinc-700 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-xl text-orange-900 dark:text-orange-100">
                              {tipo}
                            </h4>
                            {deuda > 0 && (
                              <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-2 py-0.5 rounded-full">
                                Incluye ${deuda.toLocaleString("es-AR")} de deuda
                              </span>
                            )}
                          </div>
                        </div>
                        <ul className="space-y-2">
                          {Object.entries(metodos).map(([metodo, total]) => (
                            <li key={metodo} className="flex justify-between items-center bg-orange-50 dark:bg-zinc-800 px-3 py-2 rounded-lg">
                              <span className="text-sm text-gray-700 dark:text-gray-300">{metodo}</span>
                              <span className="font-bold text-orange-600 dark:text-orange-400">
                                ${total.toLocaleString("es-AR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between items-center border-t-2 border-orange-300 dark:border-zinc-600 pt-4 mt-4">
                        <span className="font-bold text-gray-700 dark:text-gray-300">Total {tipo}</span>
                        <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                          ${totalPorTipo.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 dark:from-orange-600 dark:to-orange-700 rounded-xl p-6 border-2 border-orange-400 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between text-white">
                  <div>
                    <h4 className="font-bold text-xl mb-4 flex items-center gap-2">
                      💳 Métodos de Pago
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg">
                        <span className="font-medium">💳 Tarjeta</span>
                        <span className="font-bold text-lg">
                          ${totalesPorMetodo.tarjeta.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center bg-white/20 backdrop-blur-sm px-4 py-3 rounded-lg">
                        <span className="font-medium">💵 Efectivo</span>
                        <span className="font-bold text-lg">
                          ${totalesPorMetodo.efectivo.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t-2 border-white/30 pt-4 mt-4">
                    <span className="font-bold text-lg">Total General</span>
                    <span className="text-2xl font-bold">
                      ${currentShiftPayments
                        .reduce((sum, p) => sum + parseFloat(p.Monto || "0"), 0)
                        .toLocaleString("es-AR")}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground text-lg">No hay datos para mostrar en este turno</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  )
}
