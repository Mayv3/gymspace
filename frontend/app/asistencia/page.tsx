'use client'

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Modal,
  LinearProgress,
  Fade,
  CircularProgress,
  Paper,
  Divider,
  IconButton,
  Chip
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
  FitnessCenter
} from '@mui/icons-material'

// Tema personalizado con colores naranja
const theme = createTheme({
  palette: {
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
  },
  typography: {
    fontFamily: 'inherit',
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
  },
})

export default function AsistenciaPage() {
  const [dni, setDni] = useState('')
  const [data, setData] = useState<any>(null)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

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

      const id = setTimeout(() => {
        setData(null)
        inputRef.current?.focus()
      }, 500000)
      setTimeoutId(id)

      setDni('')
      setLoading(false)
    } catch (error) {
      console.error('❌ Error al registrar asistencia:', error)
      setLoading(false)
    }
  }

  const closeModal = () => {
    setData(null)
    setTimeout(() => inputRef.current?.focus(), 100)
  }

  // Escuchar tecla Enter cuando el modal está abierto
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && data) {
        closeModal()
      }
    }

    if (data) {
      window.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [data])

  // Autofocus al cargar la página
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const porcentaje = data?.clasesPagadas
    ? Math.min(100, Math.round((data.clasesRealizadas / data.clasesPagadas) * 100))
    : 0

  const renderIcon = () => {
    if (!data) return null
    if (data.message?.toLowerCase().includes('ya registró')) {
      return <AccessTime sx={{ fontSize: 80, color: 'warning.main' }} />
    }
    if (data.success) return <CheckCircle sx={{ fontSize: 80, color: 'white' }} />
    return <Cancel sx={{ fontSize: 80, color: 'error.main' }} />
  }

  const getStatusColor = () => {
    if (!data) return 'primary'
    if (data.message?.toLowerCase().includes('ya registró')) return 'error'
    if (data.success) return 'success'
    return 'error'
  }

  return (
    <ThemeProvider theme={theme}>
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #ea580c 0%, #fb923c 50%, #ea580c 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos de fondo */}
        <Box
          sx={{
            position: 'absolute',
            top: -100,
            right: -100,
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            bottom: -150,
            left: -150,
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
          }}
        />

        <Card
          elevation={24}
          sx={{
            width: '100%',
            maxWidth: 500,
            position: 'relative',
            zIndex: 1,
            overflow: 'visible',
          }}
        >
          {/* Header con logo */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #ea580c, #c2410c)',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: '24px 24px 0 0',
            }}
          >
            <Box
              sx={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                bgcolor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                mb: 2,
                boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              }}
            >
              <img
                src="/Gymspace-logo-png.png"
                alt="Gymspace Logo"
                style={{ width: 70, height: 'auto' }}
              />
            </Box>
            <Typography
              variant="h5"
              sx={{
                color: 'white',
                fontWeight: 700,
                textAlign: 'center',
              }}
            >
              Control de Asistencia
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                mt: 0.5,
              }}
            >
              Ingresá tu DNI para registrar tu entrada
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                type="number"
                value={dni}
                onChange={(e) => {
                  if (e.target.value.length <= 10) {
                    setDni(e.target.value)
                  }
                }}
                placeholder="Ej: 45082803"
                label="Número de DNI"
                variant="outlined"
                inputRef={inputRef}
                inputProps={{ maxLength: 10 }}
                sx={{ mb: 3 }}
                InputProps={{
                  startAdornment: (
                    <Badge sx={{ color: 'primary.main', mr: 1 }} />
                  ),
                }}
              />
              <Button
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                disabled={loading || !dni}
                sx={{
                  py: 1.5,
                  fontSize: '1.1rem',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.4)',
                  '&:hover': {
                    boxShadow: '0 6px 20px rgba(234, 88, 12, 0.5)',
                  },
                }}
              >
                {loading ? (
                  <CircularProgress size={24} color="inherit" />
                ) : (
                  <>
                     Registrar Asistencia
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Modal de resultado */}
        <Modal
          open={!!data}
          onClose={closeModal}
          closeAfterTransition
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            p: 2,
          }}
        >
          <Fade in={!!data}>
            <Paper
              elevation={24}
              sx={{
                width: '100%',
                maxWidth: 480,
                borderRadius: 4,
                overflow: 'hidden',
                outline: 'none',
              }}
            >
              {/* Header del modal */}
              <Box
                sx={{
                  background: data?.success
                    ? 'linear-gradient(135deg, #16a34a, #22c55e)'
                    : data?.message?.toLowerCase().includes('ya registró')
                    ? 'linear-gradient(135deg, #dc2626, #ef4444)'
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
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    color: data?.message?.toLowerCase().includes('ya registró') ? '#92400e' : 'white',
                  }}
                >
                  <Close />
                </IconButton>
                
                <Box
                  sx={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    bgcolor: data?.message?.toLowerCase().includes('ya registró') 
                      ? 'rgba(234, 179, 8, 0.3)' 
                      : 'rgba(255,255,255,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    mb: 2,
                  }}
                >
                  {renderIcon()}
                </Box>
                
                <Typography
                  variant="h5"
                  sx={{
                    color: data?.message?.toLowerCase().includes('ya registró') ? 'white' : 'white',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                >
                  {data?.success ? `¡Bienvenido!` : data?.message?.toLowerCase().includes('ya registró') ? 'Ya registraste asistencia' : 'Aviso'}
                </Typography>
                {data?.success && (
                  <Typography
                    variant="h6"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      fontWeight: 600,
                      textAlign: 'center',
                    }}
                  >
                    {data.nombre}
                  </Typography>
                )}
                {!data?.success && (
                  <Typography
                    variant="body1"
                    sx={{
                      color: 'rgba(255,255,255,0.9)',
                      textAlign: 'center',
                      mt: 1,
                    }}
                  >
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
                        bgcolor: 'rgba(234, 88, 12, 0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 6,
                          background: 'linear-gradient(90deg, #ea580c, #fb923c)',
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
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Badge sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Plan actual
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        {data.plan}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: 'primary.light',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <CalendarMonth sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Vencimiento
                        </Typography>
                      </Box>
                      <Typography variant="body1" fontWeight={600}>
                        {data.fechaVencimiento}
                      </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: 2,
                            bgcolor: '#fbbf24',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <MonetizationOn sx={{ color: 'white' }} />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          GymspaceCoins
                        </Typography>
                      </Box>
                      <Chip
                        label={data.gymCoins}
                        sx={{
                          bgcolor: '#fef3c7',
                          color: '#b45309',
                          fontWeight: 700,
                          fontSize: '1rem',
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    onClick={closeModal}
                    sx={{ mt: 3, py: 1.5 }}
                  >
                    ¡A entrenar!
                  </Button>
                </Box>
              )}

              {!data?.success && (
                <Box sx={{ p: 3 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    color={getStatusColor() as any}
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
      </Box>
    </ThemeProvider>
  )
}
