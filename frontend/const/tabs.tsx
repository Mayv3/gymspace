import GroupIcon from '@mui/icons-material/Group'
import AttachMoneyIcon from '@mui/icons-material/AttachMoney'
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong'
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter'
import ScheduleIcon from '@mui/icons-material/Schedule'
import TrendingDownIcon from '@mui/icons-material/TrendingDown'
import SportsHandballIcon from '@mui/icons-material/SportsHandball'
import MailOutlineIcon from '@mui/icons-material/MailOutline'
import BarChartIcon from '@mui/icons-material/BarChart'
import TrendingUpIcon from '@mui/icons-material/TrendingUp'

export const recepcionistTabs = [
    { label: "Miembros", icon: <GroupIcon />, value: "members" },
    { label: "Pagos", icon: <AttachMoneyIcon />, value: "shift-payments" },
    { label: "Deudas", icon: <ReceiptLongIcon />, value: "deudas" },
    { label: "Planes", icon: <FitnessCenterIcon />, value: "plans" },
    { label: "Turnos", icon: <ScheduleIcon />, value: "shifts" },
    { label: "Egresos", icon: <TrendingDownIcon />, value: "egresos" },
    { label: "El Club", icon: <SportsHandballIcon />, value: "elclub" },
    { label: "Difusión", icon: <MailOutlineIcon />, value: "difusion" },
]

export const adminTabs = [
  { label: "Resumen", icon: <BarChartIcon />, value: "overview" },
  { label: "Miembros", icon: <GroupIcon />, value: "members" },
  { label: "Pagos", icon: <AttachMoneyIcon />, value: "shift-payments" },
  { label: "Deudas", icon: <ReceiptLongIcon />, value: "deudas" },
  { label: "Asistencias", icon: <TrendingUpIcon />, value: "assists" },
  { label: "Planes", icon: <FitnessCenterIcon />, value: "plans" },
  { label: "Turnos", icon: <ScheduleIcon />, value: "shifts" },
  { label: "Egresos", icon: <TrendingDownIcon />, value: "egresos" },
  { label: "El Club", icon: <SportsHandballIcon />, value: "elclub" },
  { label: "Difusión", icon: <MailOutlineIcon />, value: "difusion" },
]