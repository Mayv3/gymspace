"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DollarSign, Edit, Search, Trash, Users, PlusCircle, Clock, CreditCard } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { mockMembers, mockPayments } from "@/lib/mock-data"
import { DatePicker } from "@/components/date-picker"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { motion } from "framer-motion"

export default function ReceptionistDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0")
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")

  const filteredMembers = mockMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.dni.includes(searchTerm),
  )

  const currentShiftPayments = mockPayments.filter((payment) => {
    const paymentDate = new Date(payment.date)
    return paymentDate.toDateString() === selectedDate.toDateString() && payment.shift === selectedShift
  })

  const handleOpenCashRegister = () => {
    setCashRegisterOpen(true)
  }

  const handleCloseCashRegister = () => {
    setCashRegisterOpen(false)
    setInitialAmount("0")
  }

  const handleEditMember = (id: string) => {
    setEditingMemberId(id)
  }

  const handleSaveMember = () => {
    setEditingMemberId(null)
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Recepcionista" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de Recepción</h2>
          <div className="flex items-center gap-2">
            {!cashRegisterOpen ? (
              <Button variant="orange" onClick={handleOpenCashRegister} className="animate-pulse-scale">
                <DollarSign className="mr-2 h-4 w-4" />
                Abrir Caja
              </Button>
            ) : (
              <Button variant="destructive" onClick={handleCloseCashRegister}>
                <DollarSign className="mr-2 h-4 w-4" />
                Cerrar Caja
              </Button>
            )}
          </div>
        </div>

        {cashRegisterOpen && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            <Card className="mb-4 border-primary/50 shadow-lg">
              <CardHeader className="bg-primary/10">
                <CardTitle className="flex items-center">
                  <DollarSign className="mr-2 h-5 w-5 text-primary" />
                  Caja Registradora
                </CardTitle>
                <CardDescription>
                  Turno actual: {selectedShift.charAt(0).toUpperCase() + selectedShift.slice(1)} - Recepcionista: Juan
                  Pérez
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="initialAmount">Monto Inicial</Label>
                    <Input
                      id="initialAmount"
                      value={initialAmount}
                      onChange={(e) => setInitialAmount(e.target.value)}
                      type="number"
                      min="0"
                      className="border-primary/50 focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Recaudado</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm font-semibold text-green-600">
                      ${currentShiftPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Balance Final</Label>
                    <div className="h-10 px-3 py-2 rounded-md border border-primary bg-primary/5 text-sm font-bold">
                      ${Number(initialAmount) + currentShiftPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        <Tabs defaultValue="members" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:w-auto">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <PlusCircle className="mr-2 h-4 w-4" />
              Registrar Miembro
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <CreditCard className="mr-2 h-4 w-4" />
              Registrar Pago
            </TabsTrigger>
            <TabsTrigger
              value="shift-payments"
              className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pagos por Turno
            </TabsTrigger>
          </TabsList>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestión de Miembros</CardTitle>
                  <CardDescription>Ver y editar información de miembros.</CardDescription>
                </div>
                <Button variant="orange" onClick={() => setShowAddMember(true)}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Miembro
                </Button>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar miembros..."
                    className="max-w-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Nombre</TableHead>
                          <TableHead>DNI</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Teléfono</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Estado</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredMembers.map((member, index) => (
                          <motion.tr
                            key={member.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-accent"
                          >
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Input defaultValue={member.name} className="max-w-[150px]" />
                              ) : (
                                <span className="font-medium">{member.name}</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Input defaultValue={member.dni} className="max-w-[100px]" />
                              ) : (
                                member.dni
                              )}
                            </TableCell>
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Input defaultValue={member.email} className="max-w-[180px]" />
                              ) : (
                                member.email
                              )}
                            </TableCell>
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Input defaultValue={member.phone} className="max-w-[120px]" />
                              ) : (
                                member.phone
                              )}
                            </TableCell>
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Select defaultValue={member.plan}>
                                  <SelectTrigger className="max-w-[130px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Básico">Básico</SelectItem>
                                    <SelectItem value="Estándar">Estándar</SelectItem>
                                    <SelectItem value="Premium">Premium</SelectItem>
                                  </SelectContent>
                                </Select>
                              ) : (
                                member.plan
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={new Date(member.endDate) > new Date() ? "success" : "destructive"}
                                className="animate-pulse-scale"
                              >
                                {new Date(member.endDate) > new Date() ? "Activo" : "Expirado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {editingMemberId === member.id ? (
                                <Button size="sm" onClick={handleSaveMember}>
                                  Guardar
                                </Button>
                              ) : (
                                <div className="flex gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => handleEditMember(member.id)}>
                                    <Edit className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button size="icon" variant="ghost">
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Nuevo Miembro</CardTitle>
                <CardDescription>Añade un nuevo miembro al gimnasio.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre Completo</Label>
                      <Input id="name" placeholder="Juan Pérez" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dni">DNI/Identificación</Label>
                      <Input id="dni" placeholder="12345678" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Correo Electrónico</Label>
                      <Input id="email" type="email" placeholder="juan@ejemplo.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input id="phone" placeholder="+34 123 456 789" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="plan">Plan de Membresía</Label>
                      <Select>
                        <SelectTrigger id="plan">
                          <SelectValue placeholder="Seleccionar plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Básico">Básico (30€/mes)</SelectItem>
                          <SelectItem value="Estándar">Estándar (50€/mes)</SelectItem>
                          <SelectItem value="Premium">Premium (80€/mes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <DatePicker />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin</Label>
                      <DatePicker />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas Adicionales</Label>
                    <Input id="notes" placeholder="Cualquier consideración especial o notas" />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="orange">Registrar Miembro</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Registrar Pago</CardTitle>
                <CardDescription>Registra un nuevo pago de un miembro.</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="member">Miembro</Label>
                      <Select>
                        <SelectTrigger id="member">
                          <SelectValue placeholder="Seleccionar miembro" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockMembers.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              {member.name} ({member.dni})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="amount">Monto</Label>
                      <Input id="amount" type="number" min="0" placeholder="0.00" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="method">Método de Pago</Label>
                      <Select>
                        <SelectTrigger id="method">
                          <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Efectivo">Efectivo</SelectItem>
                          <SelectItem value="Tarjeta de Crédito">Tarjeta de Crédito</SelectItem>
                          <SelectItem value="Tarjeta de Débito">Tarjeta de Débito</SelectItem>
                          <SelectItem value="Transferencia Bancaria">Transferencia Bancaria</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Inicio</Label>
                      <DatePicker />
                    </div>
                    <div className="space-y-2">
                      <Label>Fecha de Fin</Label>
                      <DatePicker />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notas de Pago</Label>
                    <Input id="notes" placeholder="Cualquier nota sobre este pago" />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="flex justify-end">
                <Button variant="orange">Registrar Pago</Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="shift-payments" className="space-y-4">
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
                        <SelectItem value="noche">Noche</SelectItem>
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
                          <TableHead>Concepto</TableHead>
                          <TableHead>Registrado Por</TableHead>
                          <TableHead>Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {currentShiftPayments.length > 0 ? (
                          currentShiftPayments.map((payment, index) => (
                            <motion.tr
                              key={payment.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="hover:bg-accent"
                            >
                              <TableCell className="font-medium">{payment.member}</TableCell>
                              <TableCell>{payment.time || "10:30"}</TableCell>
                              <TableCell className="text-green-600 font-medium">${payment.amount}</TableCell>
                              <TableCell>{payment.method}</TableCell>
                              <TableCell>{payment.concept || "Mensualidad"}</TableCell>
                              <TableCell>{payment.recordedBy}</TableCell>
                              <TableCell>
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
                            <TableCell colSpan={7} className="text-center py-4 text-muted-foreground">
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
                      ${currentShiftPayments.reduce((sum, payment) => sum + payment.amount, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} />
      <AddPaymentDialog open={showAddPayment} onOpenChange={setShowAddPayment} />
    </div>
  )
}

