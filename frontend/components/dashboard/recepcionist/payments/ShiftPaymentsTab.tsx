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
  setSelectedMonth: (n?: any) => void
  selectedYear?: number
  setSelectedYear: (n?: any) => void
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
      <Card className="bg-card rounded-2xl border border-border/60 shadow-soft">
        <CardHeader className="border-b border-border/60 rounded-t-2xl mb-4">
          <div className="flex justify-between">
            <div>
              <CardTitle className="font-bold">Pagos</CardTitle>
              <CardDescription className="hidden md:block text-xs text-muted-foreground font-medium">Visualiza y gestiona los pagos del turno actual.</CardDescription>
            </div>
            <Button variant="orange" onClick={() => setShowAddPayment(true)} className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press">
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
                      className="rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <div className="w-full md:w-36">
                    <Label>Tipo</Label>
                    <Select value={tipoFiltro} onValueChange={setTipoFiltro}>
                      <SelectTrigger className="rounded-xl border-input focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:ring-offset-0">
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
                      className="rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
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
                      className="rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
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
                      className="rounded-xl border-input focus-visible:border-brand-500 focus-visible:ring-4 focus-visible:ring-brand-500/10 focus-visible:ring-offset-0"
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
                      className="bg-brand-500 hover:bg-brand-600 text-white font-bold rounded-xl shadow-brand-btn btn-press"
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
                  <SelectTrigger className={`rounded-xl border-input focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 focus:ring-offset-0 ${selectedShift === 'todos' ? 'animate-blink border-brand-500' : ''}`}>
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

          <div className="hidden md:block rounded-2xl border border-border/60 overflow-auto max-w-[calc(100vw-2rem)] mb-6">
            <div>
              <Table className="w-full">
                <TableHeader className="bg-muted/50">
                  <TableRow className="border-b">
                    {[
                      { label: "Miembro", cls: "" },
                      { label: "Hora", cls: "hidden lg:table-cell" },
                      { label: "Monto", cls: "" },
                      { label: "Método", cls: "" },
                      { label: "Fecha de pago", cls: "" },
                      { label: "Fecha de venc.", cls: "hidden xl:table-cell" },
                      { label: "Tipo", cls: "" },
                      { label: "Turno", cls: "hidden lg:table-cell" },
                      { label: "Plan Pagado", cls: "hidden xl:table-cell" },
                      { label: "Registrado Por", cls: "hidden 2xl:table-cell" },
                      { label: "Acciones", cls: "" },
                    ].map((head, i) => (
                      <TableHead key={i} className={`text-center px-3 text-[11px] uppercase tracking-wider font-bold text-muted-foreground ${head.cls}`}>{head.label}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-border/60">
                  {paginatedPayments.length > 0 ? (
                    paginatedPayments.map((payment, idx) => (
                      <motion.tr
                        key={idx}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2, delay: idx * 0.05 }}
                        className="hover:bg-muted/40 transition-colors"
                      >
                        <TableCell className="text-center px-3 font-medium">{payment.Nombre}</TableCell>
                        <TableCell className="text-center px-3 whitespace-nowrap hidden lg:table-cell">{payment.Hora || "—"}</TableCell>
                        <TableCell className="text-center px-3 whitespace-nowrap text-emerald-600 dark:text-emerald-400 font-bold">
                          ${payment.Monto}
                        </TableCell>
                        <TableCell className="text-center px-3">{payment.Metodo_de_Pago}</TableCell>
                        <TableCell className="text-center px-3 whitespace-nowrap">{payment.Fecha_de_Pago}</TableCell>
                        <TableCell className="text-center px-3 whitespace-nowrap hidden xl:table-cell">{payment.Fecha_de_Vencimiento}</TableCell>
                        <TableCell className="text-center px-3">{payment.Tipo}</TableCell>
                        <TableCell className="text-center px-3 hidden lg:table-cell">{payment.Turno}</TableCell>
                        <TableCell className="text-center px-3 hidden xl:table-cell">
                          <div className="max-w-[120px] mx-auto whitespace-nowrap overflow-hidden text-ellipsis" title={payment.Ultimo_Plan || undefined}>{payment.Ultimo_Plan || "—"}</div>
                        </TableCell>
                        <TableCell className="text-center px-3 hidden 2xl:table-cell">{payment.Responsable}</TableCell>
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
                      <TableCell colSpan={11} className="text-center py-4 text-muted-foreground">
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
              <Card key={idx} className="bg-card shadow-soft rounded-2xl border border-border/60 overflow-hidden">
                {/* Header */}
                <CardHeader className="bg-muted/40 px-4 py-3 flex border-b border-border/60">
                  <div className="flex items-end justify-between">
                    <CardTitle className="text-base font-bold">{p.Nombre}</CardTitle>
                    <p className="text-sm text-muted-foreground font-medium">{p.Hora || "—"} hs</p>
                  </div>

                </CardHeader>

                {/* Content: grid dos columnas */}
                <CardContent className="px-4 py-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div>
                    <p className="font-bold text-foreground">Monto</p>
                    <p className="text-emerald-600 dark:text-emerald-400 font-bold">${p.Monto}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Método</p>
                    <p className="text-muted-foreground font-medium">{p.Metodo_de_Pago}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Fecha Pago</p>
                    <p className="text-muted-foreground font-medium">{p.Fecha_de_Pago}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Vencimiento</p>
                    <p className="text-muted-foreground font-medium">{p.Fecha_de_Vencimiento}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Tipo</p>
                    <p className="text-muted-foreground font-medium">{p.Tipo}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Turno</p>
                    <p className="text-muted-foreground font-medium">{p.Turno}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Plan Pagado</p>
                    <p className="text-muted-foreground font-medium">{p.Ultimo_Plan || "—"}</p>
                  </div>
                  <div>
                    <p className="font-bold text-foreground">Registrado Por</p>
                    <p className="text-muted-foreground font-medium">{p.Responsable}</p>
                  </div>
                </CardContent>

                <CardFooter className="px-4 py-3 space-y-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    className="w-full justify-center font-bold rounded-xl"
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
                className="bg-card border border-border rounded-xl font-bold hover:bg-muted"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <span className="flex items-center px-2 text-sm font-medium">
                Página {currentPage} de {Math.ceil(filteredPayments.length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                className="bg-card border border-border rounded-xl font-bold hover:bg-muted"
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

          <div className="bg-card rounded-2xl shadow-soft border border-border/60 p-6 space-y-6">
            <div className="border-b border-border/60 pb-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                Totales del turno {selectedShift !== 'todos' && ` ${selectedShift}`}
              </h2>
              <div className="mt-2 text-xs text-muted-foreground font-medium flex items-center gap-2">
                <span className="inline-flex items-center gap-1">
                  <span className="font-bold">{selectedDay}/{selectedMonth}/{selectedYear}</span>
                </span>
                {selectedShift !== 'todos' && (
                  <>
                    <span className="text-brand-500">•</span>
                    <span className="inline-flex items-center gap-1">
                      Turno: <span className="font-bold capitalize">{selectedShift}</span>
                    </span>
                  </>
                )}
              </div>
            </div>
            
            {Object.keys(resumenPorTipo).length > 0 ? (
              <div className="flex flex-nowrap gap-6 overflow-x-auto pb-2">
                {Object.entries(resumenAgrupado).map(([tipo, { metodos, deuda }]) => {
                  const totalPorTipo = Object.values(metodos).reduce((sum, val) => sum + val, 0)
                  return (
                    <div
                      key={tipo}
                      className="flex-1 min-w-[180px] shrink-0 aspect-square bg-card rounded-2xl p-4 lg:p-5 border border-border/60 shadow-soft flex flex-col justify-between overflow-hidden"
                    >
                      <div className="min-h-0 flex-1 flex flex-col">
                        <div className="mb-3">
                          <h4 className="font-bold text-sm lg:text-lg text-foreground truncate" title={tipo}>
                            {tipo}
                          </h4>
                          {deuda > 0 && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900 px-2 py-0.5 rounded-full mt-1">
                              Incluye ${deuda.toLocaleString("es-AR")} de deuda
                            </span>
                          )}
                        </div>
                        <ul className="space-y-1.5 overflow-y-auto custom-scrollbar min-h-0">
                          {Object.entries(metodos).map(([metodo, total]) => (
                            <li key={metodo} className="flex justify-between items-center gap-2 bg-muted/40 px-2.5 py-1.5 rounded-lg">
                              <span className="text-xs lg:text-sm text-muted-foreground font-medium truncate">{metodo}</span>
                              <span className="text-xs lg:text-sm font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                                ${total.toLocaleString("es-AR")}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div className="flex justify-between items-center gap-2 border-t border-border/60 pt-3 mt-3">
                        <span className="text-xs lg:text-sm font-bold text-foreground truncate">Total {tipo}</span>
                        <span className="text-base lg:text-xl font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                          ${totalPorTipo.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  )
                })}
                
                <div className="flex-1 min-w-[180px] shrink-0 aspect-square bg-gradient-to-br from-brand-500 to-brand-600 dark:from-brand-600 dark:to-brand-700 rounded-2xl p-4 lg:p-5 border border-brand-400 shadow-brand-btn flex flex-col justify-between text-white overflow-hidden">
                  <div className="min-h-0 flex-1 flex flex-col">
                    <h4 className="font-bold text-sm lg:text-lg mb-3">
                      Métodos de Pago
                    </h4>
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center gap-2 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                        <span className="text-xs lg:text-sm font-medium">Tarjeta</span>
                        <span className="text-xs lg:text-sm font-bold whitespace-nowrap">
                          ${totalesPorMetodo.tarjeta.toLocaleString("es-AR")}
                        </span>
                      </div>
                      <div className="flex justify-between items-center gap-2 bg-white/20 backdrop-blur-sm px-2.5 py-1.5 rounded-lg">
                        <span className="text-xs lg:text-sm font-medium">Efectivo</span>
                        <span className="text-xs lg:text-sm font-bold whitespace-nowrap">
                          ${totalesPorMetodo.efectivo.toLocaleString("es-AR")}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center gap-2 border-t-2 border-white/30 pt-3 mt-3">
                    <span className="text-xs lg:text-sm font-bold">Total General</span>
                    <span className="text-base lg:text-xl font-bold whitespace-nowrap">
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
