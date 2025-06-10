"use client"

import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Calendar, Award, Dumbbell, TrendingUp, Coins } from "lucide-react"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { motion, AnimatePresence } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import axios from "axios"
import customParseFormat from "dayjs/plugin/customParseFormat"
import { useUser } from "@/context/UserContext";
import { CheckCircle, XCircle } from "lucide-react"
import dayjs from "dayjs"
import { useRouter } from "next/navigation"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore"
dayjs.extend(isSameOrBefore)
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
  GymCoins: "";
}

interface Clase {
  ID: string
  'Nombre de clase': string
  Dia: string
  Hora: string
  'Cupo maximo': string
  Inscriptos: string
  ProximaFecha?: string
}

export default function MemberDashboard() {
  const [user, setUser] = useState<Member | null>(null);
  const [clases, setClases] = useState<Clase[]>([]);
  const [loadingClases, setLoadingClases] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");
  const [showFeedback, setShowFeedback] = useState(false);
  const [loadingClaseId, setLoadingClaseId] = useState<string | null>(null);
  const [topAlumnosCoins, setTopAlumnosCoins] = useState([]);
  const [rankingAlumno, setRankingAlumno] = useState<number | null>(null);

  const hasFetched = useRef(false)

  const { user: contextUser, loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !contextUser) {
      router.push("/login")
    }
  }, [loading, contextUser, router])

  useEffect(() => {
    if (!contextUser || hasFetched.current) return
    hasFetched.current = true
    fetchUser();
    fetchClases();
    fetchTopAlumnos();
    fetchRankingAlumno();
  }, [contextUser])

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${contextUser!.dni}`)
      const raw = res.data
      const member: Member = {
        Nombre: raw.Nombre,
        Plan: raw.Plan,
        Fecha_vencimiento: raw.Fecha_vencimiento,
        Clases_restantes: parseInt(raw.Clases_pagadas) - parseInt(raw.Clases_realizadas),
        Clases_pagadas: parseInt(raw.Clases_pagadas),
        Precio: parseInt(raw.Precio),
        Tipo_de_plan: raw.Tipo_de_plan,
        Pagos: raw.Pagos || [],
        GymCoins: raw.GymCoins
      }
      setUser(member)
    } catch (err) {
      console.error("Error fetching user:", err)
    }
  }

  const fetchRankingAlumno = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/posicion/${contextUser!.dni}`);
      const { data } = res;
      const { posicion } = data
      setRankingAlumno(posicion);
    } catch (error) {
      console.error("Error al traer ranking:", error);
      setRankingAlumno(0);
    }
  };

  const fetchClases = async () => {
    try {
      setLoadingClases(true)
      const res = await axios.get<Clase[]>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club`)
      setClases(res.data)
    } catch (err) {
      console.error("Error al cargar clases:", err)
    } finally {
      setLoadingClases(false)
    }
  }

  const fetchTopAlumnos = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/topAlumnosCoins`)
      setTopAlumnosCoins(res.data)
    } catch (err) {
      console.error("Error fetching user:", err)
    }
  }

  const handleSubscribe = async (claseID: string, desuscribir = false) => {
    try {
      setLoadingClaseId(claseID);
      const payload: any = { dni: contextUser!.dni }
      if (desuscribir) payload.desuscribir = true

      const { data } = await axios.put(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/clases-el-club/${claseID}`,
        payload
      )

      setClases(prev =>
        prev.map(c => {
          if (c.ID !== claseID) return c
          const arr = c.Inscriptos
            ? c.Inscriptos.split(",").map(d => d.trim())
            : []
          const newArr = desuscribir
            ? arr.filter(d => d !== contextUser!.dni)
            : [...arr, contextUser!.dni]
          return { ...c, Inscriptos: newArr.join(",") }
        })
      )

      setFeedbackMessage(data.message)
      setFeedbackType("success")
      setShowFeedback(true)
    } catch (err: any) {
      setFeedbackMessage(err.response?.data?.message || "Error en la operación")
      setFeedbackType("error")
      setShowFeedback(true)
    } finally {
      setLoadingClaseId(null)
    }
  }

  if (loading || (!contextUser && !user)) {
    return <div className="p-8 text-muted-foreground">Verificando sesión…</div>
  }
  if (!user) {
    return <div className="p-8 text-muted-foreground">Cargando datos del usuario...</div>
  }

  const rawFecha = user.Fecha_vencimiento
  const fechaVencimiento = dayjs(rawFecha, ["D/M/YYYY", "DD/MM/YYYY"])
  const today = dayjs().startOf("day")

  const fechaValida = fechaVencimiento.isValid()
  const vencido = !fechaValida || fechaVencimiento.isSameOrBefore(today, "day")
  const daysLeft = vencido ? 0 : fechaVencimiento.diff(today, "day")

  const agotado = user.Clases_restantes <= 0
  const planInhabilitado = vencido

  const progressPercentage = fechaValida
    ? Math.min(100, Math.max(0, (daysLeft / 30) * 100))
    : 0

  return (
    <div className="flex min-h-screen flex-col">
      <AnimatePresence>
        {showFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.8 }}
              className="bg-white rounded-2xl p-6 shadow-xl max-w-xs w-full text-center space-y-4"
            >
              {feedbackType === "success" ? (
                <CheckCircle className="mx-auto h-10 w-10 text-green-500" />
              ) : (
                <XCircle className="mx-auto h-10 w-10 text-red-500" />
              )}
              <p className="text-justify tracking-tight	 text-lg font-medium text-red-600">
                {feedbackMessage}
              </p>
              <button
                onClick={() => setShowFeedback(false)}
                className="mt-2 w-full py-2 rounded-lg bg-primary text-white font-semibold hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                Cerrar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <DashboardHeader role="Miembro" />
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold tracking-tight gradient-text">
              GymSpace - ¡Bienvenido, {user.Nombre}!
            </h2>
          </div>
        </motion.div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {/* Plan Actual */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
            <Card className="card-hover-effect border-primary/20 h-[20vh] dark:bg-zinc-800 dark:border-none">
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
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="w-full"
          >
            <Card className="w-full h-[20vh] card-hover-effect border-primary/20 dark:bg-zinc-800 dark:border-none">
              <CardHeader className="flex justify-between h-12 px-4">
                <CardTitle className="text-sm font-medium">
                  Estado de Membresía
                </CardTitle>
                <Calendar className="h-5 w-5 text-primary" />
              </CardHeader>

              <CardContent className="pt-2 px-4 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold gradient-text">
                    {planInhabilitado
                      ? "Plan inhabilitado"
                      : `${daysLeft} días restantes`}
                  </div>
                  <div className="flex justify-between mb-5">
                    <div className="text-xs text-muted-foreground mt-1">
                      Fin: {user.Fecha_vencimiento}
                    </div>
                    <Badge
                      variant={planInhabilitado ? "destructive" : "success"}
                      className="animate-pulse-scale"
                    >
                      {vencido
                        ? "VENCIMIENTO"
                        : planInhabilitado
                          ? "INHABILITADO"
                          : "Activo"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Progress
                    value={progressPercentage}
                    className="h-2 flex-1 ml-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Clases Restantes */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="w-full"
          >
            <Card className="w-full h-[20vh] card-hover-effect border-primary/20 dark:bg-zinc-800 dark:border-none">
              <CardHeader className="flex justify-between h-12 px-4">
                <CardTitle className="text-sm font-medium">
                  Clases Restantes
                </CardTitle>
                <Dumbbell className="h-5 w-5 text-primary" />
              </CardHeader>

              <CardContent className="pt-2 px-4 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold gradient-text">
                    {planInhabilitado ? "Sin acceso" : user.Clases_restantes}
                  </div>
                  <div className="flex justify-between mb-5">
                    <div className="text-xs text-muted-foreground mt-1">
                      De {user.Clases_pagadas} clases este mes
                    </div>
                    <Badge
                      variant={planInhabilitado ? "destructive" : "success"}
                      className="animate-pulse-scale"
                    >
                      {agotado
                        ? "LÍMITE DE CLASES"
                        : planInhabilitado
                          ? "INHABILITADO"
                          : "Activo"}
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Progress
                    value={(user.Clases_restantes / user.Clases_pagadas) * 100}
                    className="h-2 flex-1 ml-2"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            className="w-full"
          >
            <Card className="w-full card-hover-effect border-primary/20 dark:bg-zinc-800 dark:border-none">
              <CardHeader className="flex justify-between h-12 px-4">
                <CardTitle className="text-sm font-medium">
                  GymspaceCoins
                </CardTitle>
                <Dumbbell className="h-5 w-5 text-primary" />
              </CardHeader>
              <CardContent className="pt-2 px-4 flex flex-col justify-between">
                <div>
                  <div className="text-2xl font-bold flex items-center gap-1 gradient-text">
                    <p className="text-2xl">
                      #{rankingAlumno} - {planInhabilitado ? "Sin acceso" : user.GymCoins}
                    </p>
                    <Coins />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground leading-snug ">
                    <span className="flex items-center gap-1 mb-3">
                      Estos puntos te serviran para llegar a estar en el ranking de los 10 mejores !Participando de un sorteo mensual!
                    </span>
                    <ul className="list-disc list-inside ml-1 mt-1 space-y-0.5">
                      <li>Según tu antigüedad, compromiso de pago.</li>
                      <li>Mientras más asistas, más puntos vas a acumular.</li>
                      <li>Mejorando tu plan obtendrás más puntos.</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="mt-6"
        >
          <Card className="border-primary/20 dark:bg-zinc-800 dark:border-none">
            <CardHeader className="flex justify-between items-center bg-primary/5 mb-5">
              <CardTitle>Ranking GymSpace Coins</CardTitle>
              <CardDescription>
                Los 10 mejores participantes {user.Tipo_de_plan === "GIMNASIO" ? "del GIMNASIO" : "del CLUB"}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {user?.Tipo_de_plan === "GIMNASIO"
                ? topAlumnosCoins.top10Gimnasio.map((alumno, index) => {
                  const esUsuarioActual = alumno.DNI === contextUser?.dni;
                  return (
                    <motion.div
                      key={alumno.DNI}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: esUsuarioActual ? 1.05 : 1 }}
                      transition={{ duration: 0.4 }}
                      className={`rounded-lg border p-4 flex flex-col items-center justify-center text-center cursor-default
                ${esUsuarioActual ? 'bg-yellow-400 dark:bg-yellow-900 font-bold shadow-lg' : 'bg-background dark:bg-zinc-900'}
                hover:shadow-md transition-shadow`}
                    >
                      <div className="text-2xl text-primary font-extrabold mb-1">#{index + 1}</div>
                      <div className="text-lg font-semibold truncate max-w-full">{alumno.Nombre}</div>
                      <div className="mt-2 flex items-center gap-1 text-2xl font-bold gradient-text">
                        {alumno.GymCoins}
                        <Coins className="w-6 h-6" />
                      </div>
                    </motion.div>
                  );
                })
                : topAlumnosCoins.top10Clases.map((alumno, index) => {
                  const esUsuarioActual = alumno.DNI === contextUser?.dni;
                  return (
                    <motion.div
                      key={alumno.DNI}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: esUsuarioActual ? 1.05 : 1 }}
                      transition={{ duration: 0.4 }}
                      className={`rounded-lg border p-4 flex flex-col items-center justify-center text-center cursor-default
                ${esUsuarioActual ? 'bg-yellow-400 dark:bg-yellow-900 font-bold shadow-lg' : 'bg-background dark:bg-zinc-900'}
                hover:shadow-md transition-shadow`}
                    >
                      <div className="text-2xl text-primary font-extrabold mb-1">#{index + 1}</div>
                      <div className="text-lg font-semibold truncate max-w-full">{alumno.Nombre}</div>
                      <div className="mt-2 flex items-center gap-1 text-2xl font-bold gradient-text">
                        {alumno.GymCoins}
                        <Coins className="w-6 h-6" />
                      </div>
                    </motion.div>
                  );
                })}
            </CardContent>
          </Card>
        </motion.div>


        {/* Historial de pagos */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.4 }}>
          <Card className="dark:bg-zinc-900 dark:border-none rounded-lg">
            <CardHeader className="bg-primary/5 dark:bg-zinc-800 dark:border-none rounded-lg">
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
        {/* Inscripción a Clases como cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
        >
          {user.Tipo_de_plan === "CLASE" ? (
            <Card>
              <CardHeader className="bg-primary/5 bg">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 text-primary mr-2" />
                  <CardTitle>Inscripción a Clases</CardTitle>
                </div>
                <CardDescription>Elige tu clase y gestiona tu inscripción.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {loadingClases
                  ? <p>Cargando clases...</p>
                  : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {clases.map((clase, idx) => {
                        const inscritos = clase.Inscriptos
                          ? clase.Inscriptos.split(',').map(d => d.trim())
                          : []
                        const estaInscripto = inscritos.includes(contextUser!.dni)

                        const now = dayjs()
                        const claseDate = dayjs(clase.Dia, 'D/M/YYYY')
                          .hour(parseInt(clase.Hora.split(':')[0]))
                          .minute(parseInt(clase.Hora.split(':')[1]))
                        const minutosParaClase = claseDate.diff(now, 'minute')
                        const minutosDesdeClase = now.diff(claseDate, 'minute')

                        let estado: string
                        let puedeActuar = false

                        if (minutosDesdeClase >= 0) {
                          estado = "Clase finalizada"
                        } else if (inscritos.length >= Number(clase['Cupo maximo'])) {
                          estado = "Cupo completo"
                        } else if (!estaInscripto && minutosParaClase < 60) {
                          estado = "Inscripción cerrada"
                        } else if (estaInscripto && minutosDesdeClase > 60) {
                          estado = "Desuscripción cerrada"
                        } else {
                          estado = estaInscripto ? "Desuscribirse" : "Inscribirse"
                          puedeActuar = true
                        }

                        return (
                          <Card
                            key={clase.ID}
                            className={`bg-background text-foreground rounded-lg border border-orange-500 transition p-6 flex flex-col justify-between`}
                          >
                            <div>
                              <div className="flex justify-between items-center mb-4 w-full">
                                <CardTitle className="text-xl font-bold">{clase['Nombre de clase']}</CardTitle>
                                <Badge variant="outline" className="text-sm font-semibold bg-background text-foreground">
                                  {clase.Dia} - {clase.ProximaFecha}
                                </Badge>
                              </div>
                              <p className="text-1xl font-medium mb-3">{clase.Hora}hs</p>
                              <p className="text-lg">
                                <span className="font-semibold">{inscritos.length}</span> /{' '}
                                <span className="font-semibold">{clase['Cupo maximo']}</span> Inscriptos
                              </p>
                            </div>
                            <div className="mt-4">
                              <button
                                onClick={() => puedeActuar && handleSubscribe(clase.ID, estado === "Desuscribirse")}
                                disabled={!puedeActuar || loadingClaseId === clase.ID}
                                className={`w-full py-3 rounded-lg font-semibold ${puedeActuar ? estado === "Desuscribirse" ? "bg-red-600 text-white hover:bg-red-700" : "bg-orange-600 text-white hover:bg-orange-700" : "bg-gray-200 text-gray-600 cursor-not-allowed"}`}>
                                {loadingClaseId === clase.ID ? (
                                  <div className="flex items-center justify-center">
                                    <svg
                                      className="animate-spin mr-2 h-5 w-5 text-white"
                                      xmlns="http://www.w3.org/2000/svg"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                    >
                                      <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                      />
                                      <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 100 16v-4l-3 3 3 3v-4a8 8 0 01-8-8z"
                                      />
                                    </svg>
                                    {estado === "Desuscribirse" ? "Desuscribiendo..." : "Inscribiendo..."}
                                  </div>
                                ) : (
                                  estado
                                )}
                              </button>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  )
                }
              </CardContent>
            </Card>) : (<></>)}
        </motion.div>
      </div>
    </div>
  )
}
