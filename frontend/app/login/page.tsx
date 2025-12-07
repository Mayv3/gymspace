"use client"

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import { Badge, Login } from '@mui/icons-material'

// Tema personalizado con colores naranja
const theme = createTheme({
  palette: {
    primary: {
      main: '#ea580c',
      light: '#fb923c',
      dark: '#c2410c',
    },
    error: {
      main: '#dc2626',
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

const LoginPage = () => {
  const [dni, setDni] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false)
  const router = useRouter();
  const { setUser } = useUser();
  const inputRef = useRef<HTMLInputElement>(null)

  // Autofocus al cargar la página
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage("");

    if (!dni.trim()) {
      setErrorMessage("Por favor ingresá un DNI válido.");
      return;
    }
    try {
      setLoading(true)
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/roles/${dni}`);
      const data = res.data;

      Cookies.set("dni", data.dni);
      Cookies.set("nombre", data.nombre);
      Cookies.set("rol", data.rol);

      setUser(data);

      if (data.rol === "Administrador") {
        router.push("/dashboard/administrator");
      } else if (data.rol === "Recepcionista") {
        router.push("/dashboard/receptionist");
      } else {
        router.push("/dashboard/member");
      }
      setLoading(false)
    } catch (error) {
      console.error("Error en login:", error);
      setErrorMessage("No se pudo encontrar un usuario con ese DNI.");
      setLoading(false)
    }
  };

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
            maxWidth: 420,
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
              Iniciar Sesión
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: 'rgba(255,255,255,0.8)',
                textAlign: 'center',
                mt: 0.5,
              }}
            >
              Ingresá tu DNI para acceder
            </Typography>
          </Box>

          <CardContent sx={{ p: 4 }}>
            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                type="number"
                value={dni}
                onChange={(e) => {
                  if (e.target.value.length <= 10) {
                    setDni(e.target.value)
                  }
                }}
                placeholder="Ej: 34023002"
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
                    <Login sx={{ mr: 1 }} />
                    Ingresar
                  </>
                )}
              </Button>

              {errorMessage && (
                <Alert 
                  severity="error" 
                  sx={{ 
                    mt: 3, 
                    borderRadius: 2,
                  }}
                >
                  {errorMessage}
                </Alert>
              )}
            </form>
          </CardContent>
        </Card>
      </Box>
    </ThemeProvider>
  );
};

export default LoginPage;
