"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Award, Dumbbell, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { mockMemberProfile, mockMemberPayments } from "@/lib/mock-data"
import { motion } from "framer-motion"

export default function MemberDashboard() {
  const daysLeft = Math.ceil(
    (new Date(mockMemberProfile.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24),
  )
  const progressPercentage = Math.min(100, Math.max(0, (daysLeft / 30) * 100))

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Miembro" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight gradient-text">
              GymSpace - ¡Bienvenido, {mockMemberProfile.name}!
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="card-hover-effect border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
                <Award className="h-5 w-5 text-primary animate-pulse-scale" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold gradient-text">{mockMemberProfile.plan}</div>
                <p className="text-xs text-muted-foreground">${mockMemberProfile.planPrice}/mes</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="card-hover-effect border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado de Membresía</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">{daysLeft > 0 ? `${daysLeft} días restantes` : "Expirado"}</div>
                  <Badge variant={daysLeft > 0 ? "success" : "destructive"} className="animate-pulse-scale">
                    {daysLeft > 0 ? "Activo" : "Expirado"}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Inicio: {mockMemberProfile.startDate}</span>
                    <span>Fin: {mockMemberProfile.endDate}</span>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="card-hover-effect border-primary/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clases Restantes</CardTitle>
                <Dumbbell className="h-5 w-5 text-primary icon-bounce" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{mockMemberProfile.remainingClasses}</div>
                <p className="text-xs text-muted-foreground">De {mockMemberProfile.totalClasses} clases este mes</p>
                <div className="mt-3">
                  <Progress
                    value={(mockMemberProfile.remainingClasses / mockMemberProfile.totalClasses) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card>
            <CardHeader className="bg-primary/5">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-primary mr-2" />
                <CardTitle>Historial de Pagos</CardTitle>
              </div>
              <CardDescription>Tus pagos recientes y renovaciones de membresía.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="overflow-auto max-w-[calc(100vw-2rem)]">
                <div className="min-w-[700px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {mockMemberPayments.map((payment, index) => (
                        <motion.tr
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: index * 0.05 }}
                          className="hover:bg-accent"
                        >
                          <TableCell>{payment.date}</TableCell>
                          <TableCell>{payment.description}</TableCell>
                          <TableCell className="font-medium text-green-600">${payment.amount}</TableCell>
                          <TableCell>{payment.method}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`capitalize ${payment.status === "completed" ? "text-green-600 border-green-600" : "text-amber-600 border-amber-600"}`}
                            >
                              {payment.status === "completed" ? "Completado" : "Pendiente"}
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
        </motion.div>
      </div>
    </div>
  )
}

