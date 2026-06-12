import {
  Users,
  DollarSign,
  ReceiptText,
  Dumbbell,
  Clock,
  TrendingDown,
  Activity,
  Mail,
  BarChart3,
} from 'lucide-react'

export const recepcionistTabs = [
    { label: "Miembros", icon: <Users />, value: "members" },
    { label: "Pagos", icon: <DollarSign />, value: "shift-payments" },
    { label: "Deudas", icon: <ReceiptText />, value: "deudas" },
    { label: "Planes", icon: <Dumbbell />, value: "plans" },
    { label: "Turnos", icon: <Clock />, value: "shifts" },
    { label: "Egresos", icon: <TrendingDown />, value: "egresos" },
    { label: "El Club", icon: <Activity />, value: "elclub" },
    { label: "Difusión", icon: <Mail />, value: "difusion" },
]

export const adminTabs = [
  { label: "Resumen", icon: <BarChart3 />, value: "overview" },
  { label: "Miembros", icon: <Users />, value: "members" },
  { label: "Pagos", icon: <DollarSign />, value: "shift-payments" },
  { label: "Deudas", icon: <ReceiptText />, value: "deudas" },
  { label: "Planes", icon: <Dumbbell />, value: "plans" },
  { label: "Turnos", icon: <Clock />, value: "shifts" },
  { label: "Egresos", icon: <TrendingDown />, value: "egresos" },
  { label: "El Club", icon: <Activity />, value: "elclub" },
  { label: "Difusión", icon: <Mail />, value: "difusion" },
]
