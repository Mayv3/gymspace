"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BarChart, Calendar, DollarSign, Search, Users, PlusCircle, TrendingUp, Activity } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { IncomeChart } from "@/components/income-chart"
import { DashboardHeader } from "@/components/dashboard-header"
import { mockMembers, mockPayments } from "@/lib/mock-data"
import { AddMemberDialog } from "@/components/add-member-dialog"
import { motion } from "framer-motion"

export default function AdministratorDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [showAddMember, setShowAddMember] = useState(false)

  const filteredMembers = mockMembers.filter(
    (member) =>
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.dni.includes(searchTerm),
  )

  const currentMonthIncome = mockPayments
    .filter((payment) => {
      const paymentDate = new Date(payment.date)
      const currentDate = new Date()
      return (
        paymentDate.getMonth() === currentDate.getMonth() && paymentDate.getFullYear() === currentDate.getFullYear()
      )
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  const yearlyIncome = mockPayments
    .filter((payment) => {
      const paymentDate = new Date(payment.date)
      const currentDate = new Date()
      return paymentDate.getFullYear() === currentDate.getFullYear()
    })
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Administrador" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight gradient-text">GymSpace - Panel de Control</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Calendar className="mr-2 h-4 w-4 text-[#ff6b00]" />
              <span className="text-[#ff6b00]">Descargar Informes</span>
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 md:w-auto">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <TrendingUp className="mr-2 h-4 w-4" />
              Resumen
            </TabsTrigger>
            <TabsTrigger value="members" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Users className="mr-2 h-4 w-4" />
              Miembros
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <DollarSign className="mr-2 h-4 w-4" />
              Pagos
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-[#ff6b00] data-[state=active]:text-white">
              <Activity className="mr-2 h-4 w-4" />
              Análisis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="card-hover-effect">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Mensuales</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${currentMonthIncome.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+20.1% desde el mes pasado</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              >
                <Card className="card-hover-effect">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingresos Anuales</CardTitle>
                    <DollarSign className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${yearlyIncome.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">+15% desde el año pasado</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 }}
              >
                <Card className="card-hover-effect">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
                    <Users className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{mockMembers.length}</div>
                    <p className="text-xs text-muted-foreground">+12 nuevos miembros este mes</p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 }}
              >
                <Card className="card-hover-effect">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Ingreso Promedio por Miembro</CardTitle>
                    <BarChart className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">${(yearlyIncome / mockMembers.length).toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">+2.5% desde el mes pasado</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            <div className="grid gap-4 grid-cols-1 lg:grid-cols-7">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="col-span-4"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Ingresos Mensuales</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <IncomeChart />
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="col-span-3"
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Pagos Recientes</CardTitle>
                    <CardDescription>Últimos 5 pagos procesados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-8">
                      {mockPayments.slice(0, 5).map((payment, index) => (
                        <motion.div
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: 0.1 * index }}
                          className="flex items-center"
                          key={payment.id}
                        >
                          <Avatar className="h-9 w-9 border-2 border-primary">
                            <AvatarImage src={`/placeholder.svg?height=36&width=36`} alt="Avatar" />
                            <AvatarFallback className="bg-primary/20 text-primary">
                              {payment.member.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">{payment.member}</p>
                            <p className="text-sm text-muted-foreground">{payment.method}</p>
                          </div>
                          <div className="ml-auto font-medium text-green-600">+${payment.amount}</div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="members" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Gestión de Miembros</CardTitle>
                  <CardDescription>
                    Administra los miembros del gimnasio, visualiza sus detalles y planes.
                  </CardDescription>
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
                          <TableHead>Plan</TableHead>
                          <TableHead>Fecha Inicio</TableHead>
                          <TableHead>Fecha Fin</TableHead>
                          <TableHead>Estado</TableHead>
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
                            <TableCell className="font-medium">{member.name}</TableCell>
                            <TableCell>{member.dni}</TableCell>
                            <TableCell>{member.email}</TableCell>
                            <TableCell>{member.plan}</TableCell>
                            <TableCell>{member.startDate}</TableCell>
                            <TableCell>{member.endDate}</TableCell>
                            <TableCell>
                              <Badge
                                variant={new Date(member.endDate) > new Date() ? "success" : "destructive"}
                                className="animate-pulse-scale"
                              >
                                {new Date(member.endDate) > new Date() ? "Activo" : "Expirado"}
                              </Badge>
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

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Historial de Pagos</CardTitle>
                  <CardDescription>Visualiza todos los pagos realizados por los miembros.</CardDescription>
                </div>
                <Button variant="orange">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Registrar Pago
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border overflow-auto max-w-[calc(100vw-2rem)]">
                  <div className="min-w-[800px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Miembro</TableHead>
                          <TableHead>Fecha</TableHead>
                          <TableHead>Monto</TableHead>
                          <TableHead>Método</TableHead>
                          <TableHead>Registrado Por</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockPayments.map((payment, index) => (
                          <motion.tr
                            key={payment.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.2, delay: index * 0.05 }}
                            className="hover:bg-accent"
                          >
                            <TableCell className="font-medium">{payment.member}</TableCell>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell className="text-green-600 font-medium">${payment.amount}</TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>{payment.recordedBy}</TableCell>
                          </motion.tr>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Ingresos Mensuales</CardTitle>
                <CardDescription>Visualiza los ingresos mensuales del gimnasio durante el último año.</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <IncomeChart />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      <AddMemberDialog open={showAddMember} onOpenChange={setShowAddMember} />
    </div>
  )
}

