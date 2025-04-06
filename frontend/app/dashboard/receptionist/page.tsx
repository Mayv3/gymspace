"use client"

import { useEffect, useState } from "react"
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
import { DatePicker } from "@/components/date-picker"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { AddPaymentDialog } from "@/components/add-payment-dialog"
import { EditMemberDialog } from "@/components/edit-member-dialog"
import { motion } from "framer-motion"
import { DeleteMemberDialog } from "@/components/delete-member-dialog"
import dayjs from 'dayjs';
import { DeletePaymentDialog } from "@/components/delete-payment-dialog"

export default function ReceptionistDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [cashRegisterOpen, setCashRegisterOpen] = useState(false)
  const [initialAmount, setInitialAmount] = useState("0")
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedShift, setSelectedShift] = useState("mañana")
  const [members, setMembers] = useState([])
  const [payments, setPayments] = useState([])
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [selectedMemberToDelete, setSelectedMemberToDelete] = useState(null)
  const [showDeletePaymentDialog, setShowDeletePaymentDialog] = useState(false)
  const [selectedPaymentToDelete, setSelectedPaymentToDelete] = useState(null)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos`)
      const data = await res.json()
      setMembers(data)
    } catch (error) {
      console.error("Error al cargar los alumnos", error)
    }
  }

  const fetchPaymentsByDateAndShift = async () => {
    try {

      const dateStr = dayjs(selectedDate).format('DD-MM-YYYY');
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/fecha/${dateStr}/${selectedShift}`)
      const data = await res.json()
      setPayments(data)
    } catch (error) {
      console.error("Error al cargar pagos por turno", error)
    }
  }

  useEffect(() => {
    fetchPaymentsByDateAndShift()
  }, [selectedDate, selectedShift])

  const filteredMembers = members.filter(
    (member) =>
      member.Nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.Email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.Profesor_asignado.toLowerCase().includes(searchTerm) ||
      member.DNI.includes(searchTerm) ||
  
      member.Plan.includes(searchTerm)
  )

  const currentShiftPayments = payments

  const handleOpenCashRegister = () => {
    setCashRegisterOpen(true)
  }

  const handleCloseCashRegister = () => {
    setCashRegisterOpen(false)
    setInitialAmount("0")
  }

  const handleEditMember = (member) => {
    setSelectedMember(member)
    setShowEditDialog(true)
  }

  const handleSaveMember = (updated) => {
    const updatedList = members.map((member) =>
      member.DNI === updated.DNI ? updated : member
    )
    setMembers(updatedList)
    setShowEditDialog(false)
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
          <TabsList className="grid w-full grid-cols-2 md:w-auto">
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
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
                    <Table className="table-fixed w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[7.7%]">Nombre</TableHead>
                          <TableHead className="w-[7.7%]">DNI</TableHead>
                          <TableHead className="w-[7.7%]">Email</TableHead>
                          <TableHead className="w-[7.7%]">Teléfono</TableHead>

                          <TableHead className="w-[7.7%]">C.Pagadas</TableHead>
                          <TableHead className="w-[7.7%]">C.Realizadas</TableHead>
                          <TableHead className="w-[7.7%]">Inicio</TableHead>
                          <TableHead className="w-[7.7%]">Vencimiento</TableHead>

                          <TableHead className="w-[7.7%]">Nacimiento</TableHead>
                          <TableHead className="w-[7.7%]">Plan</TableHead>
                          <TableHead className="w-[7.7%]">Profesor</TableHead>
                          <TableHead className="w-[7.7%]">Estado</TableHead>
                          <TableHead className="w-[7.7%]">Acciones</TableHead>
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
                            <TableCell className="w-[7.7%]">

                              <span className="font-medium">{member.Nombre}</span>

                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {member.DNI}
                            </TableCell>
                            <TableCell className="w-[7.7%] whitespace-nowrap overflow-hidden text-ellipsis">
                              {member.Email}
                            </TableCell>
                            <TableCell className="w-[7.7%]">

                              {member.Telefono}

                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Clases_pagadas
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Clases_realizadas
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Fecha_inicio
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Fecha_vencimiento
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Fecha_nacimiento
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                member.Plan
                              }
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {member.Profesor_asignado}
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              <Badge
                                variant={new Date(member.Fecha_vencimiento) > new Date() ? "success" : "destructive"}
                                className="animate-pulse-scale"
                              >
                                {new Date(member.Fecha_vencimiento) > new Date() ? "Activo" : "Expirado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="w-[7.7%]">
                              {
                                <div className="flex gap-2">
                                  <Button size="icon" variant="ghost" onClick={() => handleEditMember(member)}>
                                    <Edit className="h-4 w-4 text-primary" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => {
                                      setSelectedMemberToDelete(member)
                                      setShowDeleteDialog(true)
                                    }}
                                  >
                                    <Trash className="h-4 w-4 text-destructive" />
                                  </Button>

                                </div>
                              }
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
                              key={payment.id}
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
                                  <Button size="icon" variant="ghost">
                                    <Edit className="h-4 w-4 text-primary" />
                                  </Button>
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
                      ${currentShiftPayments.reduce((sum, payment) => sum + parseFloat(payment.Monto || "0"), 0)}
                    </span>
                  </div>
                </div>

              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} onMemberAdded={fetchMembers} />
      <AddPaymentDialog open={showAddPayment} onOpenChange={setShowAddPayment} onPaymentAdded={fetchPaymentsByDateAndShift} />
      <EditMemberDialog
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        member={selectedMember}
        onSave={handleSaveMember}
      />
      {showDeleteDialog && selectedMemberToDelete && (
        <DeleteMemberDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          member={selectedMemberToDelete}
          onDelete={(deletedDNI) => {
            setMembers((prev) => prev.filter((m) => m.DNI !== deletedDNI))
          }}
        />
      )}
      {showDeletePaymentDialog && selectedPaymentToDelete && (
        <DeletePaymentDialog
        open={showDeletePaymentDialog}
        onOpenChange={setShowDeletePaymentDialog}
        payment={selectedPaymentToDelete}
        onDelete={() => {
          fetchPaymentsByDateAndShift()
        }}
      />
      )}
    </div>
  )
}

