'use client'

import { useState } from 'react'
import {
  Box,
  Modal,
  Fade,
  Paper,
  IconButton,
  Typography,
  LinearProgress,
  Chip,
  Divider,
  Button,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import {
  CheckCircle,
  Cancel,
  AccessTime,
  Badge,
  CalendarMonth,
  MonetizationOn,
  Close,
} from '@mui/icons-material'

// Tema personalizado con colores naranja
const theme = createTheme({
  palette: {
    primary: { main: '#ff6a00', light: '#ff7033', dark: '#f04b00' },
    success: { main: '#16a34a' },
    error: { main: '#dc2626' },
    warning: { main: '#eab308' },
  },
  typography: { fontFamily: 'inherit' },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 12, textTransform: 'none', fontWeight: 600 },
      },
    },
  },
})

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [data, setData] = useState<any>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!dni) return
    if (timeoutId) clearTimeout(timeoutId)

    try {
      setLoading(true)
      const res = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dni })
      })

      const result = await res.json()
      setData({ ...result, success: res.ok })

      const id = setTimeout(() => setData(null), 3000)
      setTimeoutId(id)

      setDni('')
      setLoading(false)
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error)
      setLoading(false)
    }
  }

  const closeModal = () => setData(null)

  const porcentaje = data?.clasesPagadas
    ? Math.min(100, Math.round((data.clasesRealizadas / data.clasesPagadas) * 100))
    : 0

  const yaRegistro = data?.message?.toLowerCase().includes('ya registró')

  const renderIcon = () => {
    if (!data) return null
    if (yaRegistro) return <AccessTime sx={{ fontSize: 80, color: 'white' }} />
    if (data.success) return <CheckCircle sx={{ fontSize: 80, color: 'white' }} />
    return <Cancel sx={{ fontSize: 80, color: 'white' }} />
  }

  return (
    <ThemeProvider theme={theme}>
      <div className="min-h-screen bg-orange-500 flex items-center justify-center px-6 py-10 relative">
        <div className="bg-white p-10 md:p-14 rounded-3xl shadow-2xl w-full max-w-2xl">
          <div className="flex flex-col items-center mb-6">
            <img src="/Gymspace-logo-png.png" alt="Gymspace Logo" className="w-24 md:w-32" />
          </div>
          <h1 className="text-center text-gray-600 text-lg md:text-2xl mb-8">
            Ingresá tu DNI para registrar tu asistencia
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <input
              type="number"
              value={dni}
              onChange={(e) => setDni(e.target.value)}
              placeholder="Ej: 45082803"
              className="w-full px-5 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-3 text-lg rounded-xl transition"
            >
              {loading ? "Registrando..." : "Registrar asistencia"}
            </button>
          </form>
        </div>

        {/* Modal de resultado */}
        <Modal
          open={!!data}
          onClose={closeModal}
          closeAfterTransition
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}
        >
          <Fade in={!!data}>
            <Paper
              elevation={24}
              sx={{ width: '100%', maxWidth: 480, borderRadius: 4, overflow: 'hidden', outline: 'none' }}
            >
              {/* Header del modal */}
              <Box
                sx={{
                  background: data?.success
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : yaRegistro
                    ? 'linear-gradient(135deg, #eab308, #f59e0b)'
                    : 'linear-gradient(135deg, #dc2626, #ef4444)',
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  position: 'relative',
                }}
              >
                <IconButton
                  onClick={closeModal}
                  sx={{ position: 'absolute', top: 8, right: 8, color: 'white' }}
                >
                  <Close />
                </IconButton>

                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {renderIcon()}
                </Box>

                <Typography variant="h5" sx={{ color: 'white', fontWeight: 700, textAlign: 'center' }}>
                  {data?.success ? '¡Bienvenido!' : yaRegistro ? 'Ya registraste asistencia' : 'Aviso'}
                </Typography>
                {data?.success && (
                  <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)', fontWeight: 600, textAlign: 'center' }}>
                    {data.nombre}
                  </Typography>
                )}
                {!data?.success && (
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', textAlign: 'center', mt: 1 }}>
                    {data?.message}
                  </Typography>
                )}
              </Box>

              {/* Contenido del modal */}
              {data?.success && (
                <Box sx={{ p: 3 }}>
                  {/* Barra de progreso */}
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        Progreso de clases
                      </Typography>
                      <Chip
                        label={`${data.clasesRealizadas}/${data.clasesPagadas}`}
                        size="small"
                        color="primary"
                        sx={{ fontWeight: 600 }}
                      />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={porcentaje}
                      sx={{
                        height: 12,
                        borderRadius: 6,
                        bgcolor: 'rgba(255, 106, 0, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(90deg, #ff6a00, #ff7033)',
                        },
                      }}
                    />
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: 'block', textAlign: 'right', mt: 0.5 }}
                    >
                      {porcentaje}% completado
                    </Typography>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Información del usuario */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.light',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <Badge sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">Plan actual</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>{data.plan}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 2, bgcolor: 'primary.light',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <CalendarMonth sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">Vencimiento</Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>{data.fechaVencimiento}</Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40, height: 40, borderRadius: 2, bgcolor: '#fbbf24',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          <MonetizationOn sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">GYMSPACE Coins</Typography>
                      </Box>
                      <Chip
                        label={data.gymCoins}
                        sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '1rem' }}
                      />
                    </Box>
                  </Box>

                  <Button fullWidth variant="contained" onClick={closeModal} sx={{ mt: 3, py: 1.5 }}>
                    ¡A entrenar!
                  </Button>
                </Box>
              )}

              {!data?.success && (
                <Box sx={{ p: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={yaRegistro ? 'warning' : 'error'}
                    onClick={closeModal}
                    sx={{ py: 1.5 }}
                  >
                    Entendido
                  </Button>
                </Box>
              )}
            </Paper>
          </Fade>
        </Modal>
      </div>
    </ThemeProvider>
  )
}
