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
import {
  CircularProgress,
  Box,
  Card as MuiCard,
  CardContent as MuiCardContent,
  Typography,
  LinearProgress,
  Chip,
  Paper,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Avatar,
  Divider,
  Modal,
  Fade,
  IconButton,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import {
  EmojiEvents,
  CalendarMonth,
  FitnessCenter,
  AttachMoney,
  Close,
  CheckCircle as MuiCheckCircle,
  Cancel,
  Toll,
  TrendingUp as MuiTrendingUp,
} from '@mui/icons-material'

import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone"

// Función para crear tema dinámico
const createAppTheme = (isDark: boolean) => createTheme({
  palette: {
    mode: isDark ? 'dark' : 'light',
    primary: {
      main: '#ea580c',
      light: '#fb923c',
      dark: '#c2410c',
    },
    success: {
      main: '#16a34a',
    },
    error: {
      main: '#dc2626',
    },
    warning: {
      main: '#eab308',
    },
    background: {
      default: isDark ? '#18181b' : '#f9fafb',
      paper: isDark ? '#27272a' : '#ffffff',
    },
    text: {
      primary: isDark ? '#fafafa' : '#18181b',
      secondary: isDark ? '#a1a1aa' : '#71717a',
    },
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: isDark ? '#27272a' : '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: isDark ? '#27272a' : '#ffffff',
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
})

dayjs.extend(utc)
dayjs.extend(timezone)
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
  GymCoins: string | number;
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
  const [roleChecked, setRoleChecked] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  const { user: contextUser, loading } = useUser()
  const router = useRouter();

  const [showBanner, setShowBanner] = useState(false);

  // Marcar como montado para evitar hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Detectar cambios en el dark mode
  useEffect(() => {
    if (!mounted) return
    
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains('dark')
      setIsDarkMode(isDark)
    }
    
    // Check inicial
    checkDarkMode()
    
    // Observer para detectar cambios en la clase
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          checkDarkMode()
        }
      })
    })
    
    observer.observe(document.documentElement, { attributes: true })
    
    return () => observer.disconnect()
  }, [mounted])

  // Crear tema dinámico basado en dark mode
  const theme = createAppTheme(isDarkMode)

  useEffect(() => {
    if (!loading && !contextUser) {
      router.push("/login")
    }
  }, [loading, contextUser, router])

  useEffect(() => {
    if (!loading && contextUser) {
      if (contextUser.rol !== 'Miembro') {
        router.replace("/")
      }
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

  useEffect(() => {
    if (!loading && contextUser) {
      if (contextUser.rol === 'Miembro') {
        setRoleChecked(true)
      }
    }
  }, [loading, contextUser])

  useEffect(() => {
    const ARG_TZ = "America/Argentina/Buenos_Aires";
    const now = dayjs().tz(ARG_TZ);
    const mañana = now.add(1, "day").startOf("day");
    const ms = mañana.diff(now);

    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;

    console.log(`Faltan ${totalMinutes} minutos y ${remainingSeconds} segundos hasta medianoche.`);
    const timer = setTimeout(() => {
      fetchClases();
    }, ms);

    return () => clearTimeout(timer);
  }, []);


  const fetchUser = async () => {
    if (!contextUser) return;

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/${contextUser.dni}`)
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
      if (!contextUser) return;
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/posicion/${contextUser.dni}`);
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

      if (!contextUser) return;
      const payload: any = { dni: contextUser.dni }
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
            : [...arr, contextUser.dni]
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
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      </ThemeProvider>
    )
  }


  if (!user) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      </ThemeProvider>
    )
  }

  if (!roleChecked) {
    return (
      <ThemeProvider theme={theme}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: 'primary.main' }} />
        </Box>
      </ThemeProvider>
    )
  }

  const rawFecha = user.Fecha_vencimiento
  const fechaVencimiento = dayjs(rawFecha, ["D/M/YYYY", "DD/MM/YYYY"])
  const today = dayjs().startOf("day")

  const fechaValida = fechaVencimiento.isValid()
  const vencido = !fechaValida || fechaVencimiento.isBefore(today, "day")
  const daysLeft = vencido ? 0 : fechaVencimiento.diff(today, "day")

  const agotado = user.Clases_restantes <= 0
  const planInhabilitado = vencido

  const progressPercentage = fechaValida
    ? Math.min(100, Math.max(0, (daysLeft / 30) * 100))
    : 0

  const ARG_TZ = "America/Argentina/Buenos_Aires";
  const now = dayjs().tz(ARG_TZ);

  const todosLosDias = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"];

  const hoy = now.locale("es").day();
  const indiceHoy = hoy === 0 ? 6 : hoy - 1;

  const upcomingClases = clases.filter((clase) => {
    const fechaRaw = clase.ProximaFecha?.trim() || "";
    const [horaStr, minutoStr] = clase.Hora.split(":");
    const fechaClase = dayjs(fechaRaw, ["D/M/YYYY", "DD/MM/YYYY"])
      .hour(parseInt(horaStr, 10))
      .minute(parseInt(minutoStr, 10))
      .tz(ARG_TZ);
    return fechaClase.isAfter(now);
  });

  const diasOrden = [
    ...todosLosDias.slice(indiceHoy),
    ...todosLosDias.slice(0, indiceHoy),
  ];

  const clasesAgrupadas = diasOrden.map((dia) => {
    const clasesDelDia = upcomingClases
      .filter((clase) => clase.Dia.toLowerCase() === dia.toLowerCase())
      .sort((a, b) => {
        const [horaA, minutoA] = a.Hora.split(":").map(Number);
        const [horaB, minutoB] = b.Hora.split(":").map(Number);
        return horaA - horaB || minutoA - minutoB;
      });

    return {
      dia,
      clases: clasesDelDia,
    };
  });


  const diaHoy = diasOrden[0];

  return (
    <ThemeProvider theme={theme}>
      <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-zinc-900">

        {/* Modal de Banner */}
        <Modal
          open={showBanner}
          onClose={() => setShowBanner(false)}
          closeAfterTransition
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Fade in={showBanner}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                maxWidth: 400,
                width: '90%',
                borderRadius: 4,
                textAlign: 'center',
                outline: 'none',
              }}
            >
              <Typography variant="h5" fontWeight={700} mb={2}>
                ¡Gran Inauguración!
              </Typography>
              <Chip
                label="VIERNES 20 — 17:00 HS"
                sx={{
                  bgcolor: 'rgba(234, 88, 12, 0.1)',
                  color: 'primary.main',
                  fontWeight: 600,
                  mb: 2,
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                <CalendarMonth sx={{ color: 'error.main', mr: 1 }} />
                <Typography variant="body2" color="text.secondary">
                  Humahuaca 41
                </Typography>
              </Box>
              <Typography variant="body1" color="text.secondary" mb={3}>
                Mañana celebramos la apertura de nuestra nueva sede.
                ¡Te esperamos con amigos para compartir merienda y disfrutar de cosas ricas!
              </Typography>
              <button
                onClick={() => setShowBanner(false)}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                ¡Nos vemos allí!
              </button>
            </Paper>
          </Fade>
        </Modal>

        {/* Modal de Feedback */}
        <Modal
          open={showFeedback}
          onClose={() => setShowFeedback(false)}
          closeAfterTransition
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Fade in={showFeedback}>
            <Paper
              elevation={24}
              sx={{
                p: 4,
                maxWidth: 350,
                width: '90%',
                borderRadius: 4,
                textAlign: 'center',
                outline: 'none',
              }}
            >
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  bgcolor: feedbackType === "success" ? 'rgba(22, 163, 74, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mx: 'auto',
                  mb: 2,
                }}
              >
                {feedbackType === "success" ? (
                  <MuiCheckCircle sx={{ fontSize: 50, color: 'success.main' }} />
                ) : (
                  <Cancel sx={{ fontSize: 50, color: 'error.main' }} />
                )}
              </Box>
              <Typography
                variant="body1"
                fontWeight={500}
                color={feedbackType === "success" ? "success.main" : "error.main"}
                mb={3}
              >
                {feedbackMessage}
              </Typography>
              <button
                onClick={() => setShowFeedback(false)}
                className="w-full py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
              >
                Cerrar
              </button>
            </Paper>
          </Fade>
        </Modal>

        <DashboardHeader role="Miembro" />

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 } }}>
          {/* Header de bienvenida */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Paper
              elevation={0}
              sx={{
                background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 50%, #ea580c 100%)',
                borderRadius: 4,
                p: 3,
                mb: 3,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  top: -50,
                  right: -50,
                  width: 150,
                  height: 150,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 60,
                    height: 60,
                    bgcolor: 'white',
                    color: 'primary.main',
                    fontWeight: 700,
                    fontSize: '1.5rem',
                  }}
                >
                  {user.Nombre?.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
                    ¡Bienvenido, {user.Nombre}!
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                    Tu panel de control GymSpace
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </motion.div>

          {/* Grid de tarjetas de estadísticas */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
            {/* Plan Actual */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.1 }}>
              <MuiCard
                elevation={4}
                sx={{
                  height: '100%',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)'
                    : 'linear-gradient(135deg, #fff 0%, #fef3ed 100%)',
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' },
                }}
              >
                <MuiCardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6"  fontWeight={900} color="text.secondary">
                      Plan Actual
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'rgba(234, 88, 12, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <EmojiEvents sx={{ color: 'primary.main' }} />
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color="primary.main" mb={1}>
                    {user.Plan}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    <AttachMoney sx={{ color: 'success.main', fontSize: 20 }} />
                    <Typography variant="body1" color="text.secondary">
                      ${user.Precio}
                    </Typography>
                  </Box>
                </MuiCardContent>
              </MuiCard>
            </motion.div>

            {/* Estado de Membresía */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.2 }}>
              <MuiCard
                elevation={4}
                sx={{
                  height: '100%',
                  background: planInhabilitado
                    ? isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)' : 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)'
                    : isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)' : 'linear-gradient(135deg, #fff 0%, #f0fdf4 100%)',
                  border: `1px solid ${planInhabilitado ? 'rgba(220, 38, 38, 0.2)' : 'rgba(22, 163, 74, 0.2)'}`,
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' },
                }}
              >
                <MuiCardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6"  fontWeight={900} color="text.secondary">
                      Estado de Membresía
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: planInhabilitado ? 'rgba(220, 38, 38, 0.1)' : 'rgba(22, 163, 74, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <CalendarMonth sx={{ color: planInhabilitado ? 'error.main' : 'success.main' }} />
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color={planInhabilitado ? 'error.main' : 'success.main'} mb={1}>
                    {planInhabilitado ? "Inhabilitado" : `${daysLeft} días`}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Vence: {user.Fecha_vencimiento}
                    </Typography>
                    <Chip
                      size="small"
                      label={vencido ? "VENCIDO" : planInhabilitado ? "INHABILITADO" : "ACTIVO"}
                      color={planInhabilitado ? "error" : "success"}
                      sx={{ fontSize: '0.65rem' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={progressPercentage}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: planInhabilitado ? 'error.main' : 'success.main',
                        borderRadius: 3,
                      },
                    }}
                  />
                </MuiCardContent>
              </MuiCard>
            </motion.div>

            {/* Clases Restantes */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.3 }}>
              <MuiCard
                elevation={4}
                sx={{
                  height: '100%',
                  background: agotado
                    ? isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)' : 'linear-gradient(135deg, #fff 0%, #fef2f2 100%)'
                    : isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)' : 'linear-gradient(135deg, #fff 0%, #eff6ff 100%)',
                  border: `1px solid ${agotado ? 'rgba(220, 38, 38, 0.2)' : 'rgba(59, 130, 246, 0.2)'}`,
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' },
                }}
              >
                <MuiCardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6"  fontWeight={900} color="text.secondary">
                      Clases Restantes
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: agotado ? 'rgba(220, 38, 38, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <FitnessCenter sx={{ color: agotado ? 'error.main' : '#3b82f6' }} />
                    </Box>
                  </Box>
                  <Typography variant="h5" fontWeight={700} color={agotado ? 'error.main' : '#3b82f6'} mb={1}>
                    {planInhabilitado ? "Sin acceso" : user.Clases_restantes}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" color="text.secondary">
                      De {user.Clases_pagadas} clases/mes
                    </Typography>
                    <Chip
                      size="small"
                      label={agotado ? "AGOTADO" : planInhabilitado ? "INHABILITADO" : "DISPONIBLE"}
                      color={agotado || planInhabilitado ? "error" : "primary"}
                      sx={{ fontSize: '0.65rem' }}
                    />
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={user.Clases_pagadas > 0 ? (user.Clases_restantes / user.Clases_pagadas) * 100 : 0}
                    sx={{
                      height: 6,
                      borderRadius: 3,
                      bgcolor: 'rgba(0,0,0,0.1)',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: agotado ? 'error.main' : '#3b82f6',
                        borderRadius: 3,
                      },
                    }}
                  />
                </MuiCardContent>
              </MuiCard>
            </motion.div>

            {/* GymSpace Coins */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: 0.4 }}>
              <MuiCard
                elevation={4}
                sx={{
                  height: '100%',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #27272a 0%, #3f3f46 100%)'
                    : 'linear-gradient(135deg, #fff 0%, #fefce8 100%)',
                  border: '1px solid rgba(234, 179, 8, 0.2)',
                  '&:hover': { transform: 'translateY(-4px)', transition: 'transform 0.3s ease' },
                }}
              >
                <MuiCardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                    <Typography variant="h6" fontWeight={900} color="text.secondary">
                      GymSpace Coins
                    </Typography>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        bgcolor: 'rgba(234, 179, 8, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Toll sx={{ color: '#eab308' }} />
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <Typography variant="h5" fontWeight={700} color="#eab308">
                      #{rankingAlumno ?? "-"}
                    </Typography>
                    <Typography variant="h6" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="h5" fontWeight={700} color="#eab308">
                      {planInhabilitado ? "0" : (user.GymCoins ?? 0)}
                    </Typography>
                    <Toll sx={{ color: '#eab308', fontSize: 24 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.4 }}>
                    ¡Participa del sorteo mensual! Acumula puntos asistiendo y mejorando tu plan.
                  </Typography>
                </MuiCardContent>
              </MuiCard>
            </motion.div>
          </Box>

          {/* Ranking GymSpace Coins */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <MuiCard elevation={4} sx={{ mb: 3 }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                  p: 3,
                  borderRadius: '16px 16px 0 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <EmojiEvents sx={{ color: '#fbbf24', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                      Ranking GymSpace Coins
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Los 10 mejores participantes {user.Tipo_de_plan === "GIMNASIO" ? "del GIMNASIO" : "del CLUB"}
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <MuiCardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {user?.Tipo_de_plan === "GIMNASIO"
                    ? (topAlumnosCoins.top10Gimnasio || []).map((alumno: any, index: number) => {
                        const esUsuarioActual = alumno.DNI === contextUser?.dni;
                        return (
                          <motion.div
                            key={alumno.DNI}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                          >
                            <Paper
                              elevation={esUsuarioActual ? 8 : 2}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: esUsuarioActual ? '2px solid #eab308' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                bgcolor: esUsuarioActual ? (isDarkMode ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)') : (isDarkMode ? '#1f1f23' : 'background.paper'),
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={800}
                                  color="primary.main"
                                  sx={{ minWidth: 20 }}
                                >
                                  #{index + 1}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  fontWeight={600}
                                >
                                  {alumno.Nombre}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="h6" fontWeight={700} color="#eab308">
                                  {alumno.GymCoins}
                                </Typography>
                                <Toll sx={{ color: '#eab308', fontSize: 20 }} />
                              </Box>
                            </Paper>
                          </motion.div>
                        );
                      })
                    : (topAlumnosCoins.top10Clases || []).map((alumno: any, index: number) => {
                        const esUsuarioActual = alumno.DNI === contextUser?.dni;
                        return (
                          <motion.div
                            key={alumno.DNI}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.4, delay: index * 0.05 }}
                          >
                            <Paper
                              elevation={esUsuarioActual ? 8 : 2}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: esUsuarioActual ? '2px solid #eab308' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                bgcolor: esUsuarioActual ? (isDarkMode ? 'rgba(234, 179, 8, 0.15)' : 'rgba(234, 179, 8, 0.1)') : (isDarkMode ? '#1f1f23' : 'background.paper'),
                                transition: 'all 0.3s ease',
                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 4 },
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography
                                  variant="h6"
                                  fontWeight={800}
                                  color="primary.main"
                                  sx={{ minWidth: 40 }}
                                >
                                  #{index + 1}
                                </Typography>
                                <Typography
                                  variant="body1"
                                  fontWeight={600}
                                >
                                  {alumno.Nombre}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                <Typography variant="h6" fontWeight={700} color="#eab308">
                                  {alumno.GymCoins}
                                </Typography>
                                <Toll sx={{ color: '#eab308', fontSize: 20 }} />
                              </Box>
                            </Paper>
                          </motion.div>
                        );
                      })}
                </Box>
              </MuiCardContent>
            </MuiCard>
          </motion.div>

          {/* Historial de pagos */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.6 }}>
            <MuiCard elevation={4} sx={{ mb: 3 }}>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #16a34a, #22c55e)',
                  p: 3,
                  borderRadius: '16px 16px 0 0',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <MuiTrendingUp sx={{ color: 'white', fontSize: 32 }} />
                  <Box>
                    <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                      Historial de Pagos
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                      Tus pagos recientes y renovaciones de membresía
                    </Typography>
                  </Box>
                </Box>
              </Box>
              <MuiCardContent sx={{ p: 2, position: 'relative' }}>
                {user.Pagos.length === 0 ? (
                  <Box sx={{ py: 4, textAlign: 'center' }}>
                    <Typography color="text.secondary">No hay pagos registrados aún.</Typography>
                  </Box>
                ) : (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 2,
                        maxHeight: 380,
                        overflowY: 'auto',
                        py: 1,
                        px: 1,
                        mb: 1,
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                        '&::-webkit-scrollbar': {
                          display: 'none',
                        },
                      }}
                    >
                      {[...user.Pagos]
                        .sort((a, b) =>
                          dayjs(b.Fecha_de_Pago, "D/M/YYYY").unix() -
                          dayjs(a.Fecha_de_Pago, "D/M/YYYY").unix()
                        )
                        .map((pago, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                          >
                            <Paper
                              elevation={2}
                              sx={{
                                p: 2,
                                borderRadius: 3,
                                border: isDarkMode ? '1px solid rgba(22, 163, 74, 0.3)' : '1px solid rgba(22, 163, 74, 0.2)',
                                bgcolor: isDarkMode ? '#1f1f23' : 'background.paper',
                                '&:hover': {
                                  boxShadow: 4,
                                  transform: 'translateX(4px)',
                                  transition: 'all 0.2s ease',
                                },
                              }}
                            >
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Box>
                                  <Typography variant="subtitle1" fontWeight={600} color="text.primary">
                                    {pago.Tipo}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {pago.Responsable}
                                  </Typography>
                                </Box>
                                <Chip
                                  size="small"
                                  label={pago.Fecha_de_Vencimiento ? "Completado" : "Pendiente"}
                                  color={pago.Fecha_de_Vencimiento ? "success" : "warning"}
                                  sx={{ fontWeight: 600 }}
                                />
                              </Box>
                              <Divider sx={{ my: 1.5 }} />
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ display: 'flex', gap: 3 }}>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Fecha
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                      {pago.Fecha_de_Pago}
                                    </Typography>
                                  </Box>
                                  <Box>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                      Método
                                    </Typography>
                                    <Typography variant="body2" fontWeight={500}>
                                      {pago.Metodo_de_Pago}
                                    </Typography>
                                  </Box>
                                </Box>
                                <Box sx={{ textAlign: 'right' }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Monto
                                  </Typography>
                                  <Typography variant="h6" fontWeight={700} color="success.main">
                                    ${pago.Monto}
                                  </Typography>
                                </Box>
                              </Box>
                            </Paper>
                          </motion.div>
                        ))}
                    </Box>
                    {user.Pagos.length > 3 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          pt: 2,
                          pb: 1,
                        }}
                      >
                        <motion.div
                          animate={{ y: [0, 6, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              color: 'text.secondary',
                            }}
                          >
                            <Typography variant="caption" sx={{ mb: 0.5 }}>
                              Desliza para ver más
                            </Typography>
                            <Box
                              sx={{
                                width: 24,
                                height: 24,
                                borderRadius: '50%',
                                bgcolor: 'rgba(22, 163, 74, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Box
                                component="span"
                                sx={{
                                  width: 0,
                                  height: 0,
                                  borderLeft: '5px solid transparent',
                                  borderRight: '5px solid transparent',
                                  borderTop: '6px solid #16a34a',
                                }}
                              />
                            </Box>
                          </Box>
                        </motion.div>
                      </Box>
                    )}
                  </>
                )}
              </MuiCardContent>
            </MuiCard>
          </motion.div>

          {/* Inscripción a Clases como cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7 }}
          >
            {user.Tipo_de_plan === "CLASE" ? (
              <MuiCard elevation={4} sx={{ mb: 3 }}>
                <Box
                  sx={{
                    background: 'linear-gradient(135deg, #ea580c, #f97316)',
                    p: 3,
                    borderRadius: '16px 16px 0 0',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <CalendarMonth sx={{ color: 'white', fontSize: 32 }} />
                    <Box>
                      <Typography variant="h6" sx={{ color: 'white', fontWeight: 700 }}>
                        Inscripción a Clases
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)' }}>
                        Elige tu clase y gestiona tu inscripción
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <MuiCardContent sx={{ p: 3 }}>
                  {loadingClases ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                      <CircularProgress sx={{ color: 'primary.main' }} />
                    </Box>
                  ) : (
                    clasesAgrupadas.map(({ dia, clases }) => (
                      <Box key={dia} sx={{ mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                          <Box
                            sx={{
                              width: 4,
                              height: 28,
                              bgcolor: 'primary.main',
                              borderRadius: 2,
                            }}
                          />
                          <Typography variant="h5" fontWeight={700} color="primary.main">
                            {dia}
                          </Typography>
                        </Box>

                        {dia === diaHoy && clases.length === 0 ? (
                          <Paper
                            elevation={0}
                            sx={{
                              p: 3,
                              textAlign: 'center',
                              bgcolor: isDarkMode ? '#1f1f23' : 'grey.50',
                              borderRadius: 3,
                            }}
                          >
                            <Typography color="text.secondary">
                              Ya pasaron todas las clases del día.
                            </Typography>
                          </Paper>
                        ) : (
                          <Box>
                            <Box
                              sx={{
                                display: 'flex',
                                gap: 2,
                                overflowX: 'scroll',
                                pb: 2,
                                px: 0.5,
                                alignItems: 'stretch',
                                scrollbarWidth: 'thin',
                                scrollbarColor: isDarkMode ? '#52525b #27272a' : '#d4d4d4 #f5f5f5',
                                '&::-webkit-scrollbar': {
                                  height: 8,
                                  display: 'block',
                                },
                                '&::-webkit-scrollbar-track': {
                                  bgcolor: isDarkMode ? '#27272a' : '#f5f5f5',
                                  borderRadius: 4,
                                },
                                '&::-webkit-scrollbar-thumb': {
                                  bgcolor: isDarkMode ? '#52525b' : '#d4d4d4',
                                  borderRadius: 4,
                                },
                              }}
                            >
                              {clases.map((clase) => {
                                const inscritos = clase.Inscriptos
                                  ? clase.Inscriptos.split(",").map(d => d.trim()).filter(Boolean)
                                  : [];
                                const estaInscripto = inscritos.includes(contextUser!.dni);

                              const ARG_TZ = "America/Argentina/Buenos_Aires";
                              const now = dayjs().tz(ARG_TZ);

                              const fechaClase = clase.ProximaFecha?.trim() || "";
                              const [horaStr, minutoStr] = clase.Hora.split(":");
                              const claseDate = dayjs(fechaClase, ["D/M/YYYY", "DD/MM/YYYY"])
                                .hour(parseInt(horaStr, 10))
                                .minute(parseInt(minutoStr, 10))
                                .tz(ARG_TZ);

                              const minutosParaClase = claseDate.diff(now, "minute");
                              const minutosDesdeClase = now.diff(claseDate, "minute");

                              let estado = "";
                              let puedeActuar = false;

                              if (minutosDesdeClase >= 0) {
                                estado = "Clase finalizada";
                              } else if (inscritos.length >= Number(clase["Cupo maximo"])) {
                                estado = "Cupo completo";
                              } else if (!estaInscripto && minutosParaClase < 30) {
                                estado = "Inscripción cerrada";
                              } else if (estaInscripto && minutosDesdeClase > 60) {
                                estado = "Desuscripción cerrada";
                              } else {
                                estado = estaInscripto ? "Desuscribirse" : "Inscribirse";
                                puedeActuar = true;
                              }

                              const cupoPercentage = (inscritos.length / Number(clase["Cupo maximo"])) * 100;

                              return (
                                <Paper
                                  key={clase.ID}
                                  elevation={3}
                                  sx={{
                                    px: 0,
                                    borderRadius: 3,
                                    overflow: 'hidden',
                                    border: estaInscripto ? '2px solid #ea580c' : isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease',
                                    minWidth: { xs: 280, sm: 300 },
                                    maxWidth: { xs: 280, sm: 300 },
                                    flexShrink: 0,
                                    bgcolor: isDarkMode ? '#1f1f23' : 'background.paper',
                                    '&:hover': {
                                      transform: 'translateY(-4px)',
                                      boxShadow: 6,
                                    },
                                  }}
                                >
                                  <Box
                                    sx={{
                                      background: estaInscripto
                                        ? 'linear-gradient(135deg, #ea580c, #f97316)'
                                        : isDarkMode ? 'linear-gradient(135deg, #2a2a2e, #35353a)' : 'linear-gradient(135deg, #f5f5f5, #fff)',
                                      p: 2.5,
                                      borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                      <Typography
                                        variant="h6"
                                        fontWeight={700}
                                        sx={{ color: estaInscripto ? 'white' : 'text.primary', fontSize: '1.1rem' }}
                                      >
                                        {clase["Nombre de clase"]}
                                      </Typography>
                                      {estaInscripto && (
                                        <Chip
                                          size="small"
                                          label="INSCRIPTO"
                                          sx={{
                                            bgcolor: 'rgba(255,255,255,0.2)',
                                            color: 'white',
                                            fontWeight: 600,
                                            fontSize: '0.7rem',
                                          }}
                                        />
                                      )}
                                    </Box>
                                    <Typography
                                      variant="body2"
                                      fontWeight={500}
                                      sx={{ color: estaInscripto ? 'rgba(255,255,255,0.9)' : 'text.secondary' }}
                                    >
                                      {clase.Dia} — {clase.ProximaFecha}
                                    </Typography>
                                  </Box>

                                  <Box sx={{ p: 2.5 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                      <Box
                                        sx={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: 2,
                                          bgcolor: 'rgba(234, 88, 12, 0.1)',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <FitnessCenter sx={{ color: 'primary.main', fontSize: 20 }} />
                                      </Box>
                                      <Typography variant="h5" fontWeight={700} color="text.primary">
                                        {clase.Hora}hs
                                      </Typography>
                                    </Box>

                                    <Box sx={{ mb: 2 }}>
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                          Cupos disponibles
                                        </Typography>
                                        <Typography variant="body1" fontWeight={700} color="text.primary">
                                          {inscritos.length}/{clase["Cupo maximo"]}
                                        </Typography>
                                      </Box>
                                      <LinearProgress
                                        variant="determinate"
                                        value={cupoPercentage}
                                        sx={{
                                          height: 8,
                                          borderRadius: 4,
                                          bgcolor: 'rgba(0,0,0,0.1)',
                                          '& .MuiLinearProgress-bar': {
                                            bgcolor: cupoPercentage >= 100 ? 'error.main' : cupoPercentage >= 80 ? 'warning.main' : 'primary.main',
                                            borderRadius: 4,
                                          },
                                        }}
                                      />
                                    </Box>

                                    <button
                                      onClick={() =>
                                        puedeActuar && handleSubscribe(clase.ID, estado === "Desuscribirse")
                                      }
                                      disabled={!puedeActuar || loadingClaseId === clase.ID}
                                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${puedeActuar
                                        ? estado === "Desuscribirse"
                                          ? "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg"
                                          : "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-md hover:shadow-lg"
                                        : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                        }`}
                                    >
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
                                  </Box>
                                </Paper>
                              );
                            })}
                          </Box>
                          </Box>
                        )}
                      </Box>
                    ))
                  )}
                </MuiCardContent>
              </MuiCard>
            ) : null}
          </motion.div>
        </Box>
      </div>
    </ThemeProvider>
  )
}