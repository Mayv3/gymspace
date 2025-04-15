"use client"

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Award, Dumbbell, TrendingUp } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import axios from "axios"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useUser } from "@/context/UserContext";
import dayjs from "dayjs"
import { useRouter } from "next/navigation"

dayjs.extend(customParseFormat)

interface Pago {
  ID: string;
  "Socio DNI": string;
  Nombre: string;
  Monto: string;
  Metodo_de_Pago: string;
  Fecha_de_Pago: string;
  Fecha_de_Vencimiento: string;
  Responsable: string;
  Turno: string;
  Hora: string;
  Tipo: string;
}

interface Member {
  Nombre: string;
  Plan: string;
  Fecha_vencimiento: string;
  Clases_restantes: number;
  Clases_pagadas: number;
  Precio: number;
  Tipo_de_plan: string;
  Pagos: Pago[];
}

export default function MemberDashboard() {
  const [user, setUser] = useState<Member | null>(null)
  const { user: contextUser } = useUser()
  const router = useRouter()

  useEffect(() => {
  if (!contextUser?.dni || !contextUser?.rol) {
    router.push("/login")
  }
}, [contextUser, router])

  const fetchUser = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/alumnos/${contextUser?.dni}`)
      const rawData = response.data

      const userData: Member = {
        Nombre: rawData.Nombre,
        Plan: rawData.Plan,
        Fecha_vencimiento: rawData.Fecha_vencimiento,
        Clases_restantes: parseInt(rawData.Clases_pagadas) - parseInt(rawData.Clases_realizadas),
        Clases_pagadas: parseInt(rawData.Clases_pagadas),
        Precio: parseInt(rawData.Precio),
        Tipo_de_plan: rawData.Tipo_de_plan,
        Pagos: rawData.Pagos || [],
      }

      setUser(userData)
    } catch (error) {
      console.error("Error fetching user:", error)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [])

  if (!user) {
    return <div className="p-8 text-muted-foreground">Cargando datos del usuario...</div>
  }

  const daysLeft = user?.Fecha_vencimiento
    ? Math.max(0, dayjs(user.Fecha_vencimiento, "D/M/YYYY").diff(dayjs().startOf("day"), "day") + 1)
    : 0

  const progressPercentage = user.Fecha_vencimiento
    ? Math.min(100, Math.max(0, (daysLeft / 30) * 100))
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardHeader role="Miembro" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight gradient-text">
              GymSpace - ¡Bienvenido, {user.Nombre}!
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {/* Plan Actual */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="card-hover-effect border-primary/20 h-[20vh]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Plan Actual</CardTitle>
                <Award className="h-5 w-5 text-primary animate-pulse-scale" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold gradient-text">{user.Plan}</div>
                <div className="mt-3 space-y-2">
                  <p className="text-lg text-muted-foreground">Precio del plan: ${user.Precio}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Estado de Membresía */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
            <Card className="card-hover-effect border-primary/20 h-[20vh]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Estado de Membresía</CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">
                    {daysLeft > 0 ? `${daysLeft} días restantes` : "Expirado"}
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Fin: {user.Fecha_vencimiento}</span>
                    <Badge variant={daysLeft > 0 ? "success" : "destructive"} className="animate-pulse-scale">
                      {daysLeft > 0 ? "Activo" : "Expirado"}
                    </Badge>
                  </div>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clases restantes */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
            <Card className="card-hover-effect border-primary/20 h-[20vh]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clases Restantes</CardTitle>
                <Dumbbell className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.Clases_restantes}</div>
                <div className="flex justify-between items-center gap-2 w-full">
                  <p className="text-xs text-muted-foreground">
                    De {user.Clases_pagadas} clases este mes
                  </p>
                  {user.Clases_restantes === 0 && (
                    <Badge variant="destructive" className="animate-pulse-scale">LÍMITE DE CLASES</Badge>
                  )}
                </div>
                <div className="mt-3">
                  <Progress
                    value={(user.Clases_restantes / user.Clases_pagadas) * 100}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Historial de pagos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
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
                      {user.Pagos.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            No hay pagos registrados aún.
                          </TableCell>
                        </TableRow>
                      ) : (
                        [...user.Pagos]
                          .sort((a, b) =>
                            dayjs(b.Fecha_de_Pago, "D/M/YYYY").unix() -
                            dayjs(a.Fecha_de_Pago, "D/M/YYYY").unix()
                          )
                          .map((pago, index) => (
                            <motion.tr
                              key={index}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.2, delay: index * 0.05 }}
                              className="hover:bg-accent"
                            >
                              <TableCell>{pago.Fecha_de_Pago}</TableCell>
                              <TableCell>{`${pago.Tipo} (${pago.Responsable})`}</TableCell>
                              <TableCell className="font-medium text-green-600">${pago.Monto}</TableCell>
                              <TableCell>{pago.Metodo_de_Pago}</TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`capitalize ${pago.Fecha_de_Vencimiento
                                    ? "text-green-600 border-green-600"
                                    : "text-amber-600 border-amber-600"
                                    }`}
                                >
                                  {pago.Fecha_de_Vencimiento ? "Completado" : "Pendiente"}
                                </Badge>
                              </TableCell>
                            </motion.tr>
                          ))
                      )}
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
