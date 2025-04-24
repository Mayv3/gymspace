import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import axios from "axios"
import { Users, CalendarCheck, PieChart as PieIcon, DollarSign } from "lucide-react"
import { LineChart, Line } from "recharts"
import { DatePicker } from "@/components/dashboard/date-picker"
import dayjs from "dayjs"

const COLORS = [
  "#FFB74D", "#FFA726", "#FF9800", "#FB8C00", "#F57C00",
  "#EF6C00", "#E65100", "#BF360C"
]

export default function AdminOverviewCharts({ isVisible }: { isVisible: boolean }) {
  const [estadoAlumnos, setEstadoAlumnos] = useState({ activos: 0, vencidos: 0 })
  const [edadDistribucion, setEdadDistribucion] = useState<{ edad: number; cantidad: number }[]>([])
  const [planesDistribucion, setPlanesDistribucion] = useState([])
  const [asistenciasHora, setAsistenciasHora] = useState<{ hora: string; cantidad: number }[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [promedios, setPromedios] = useState<{ rango: string, promedio: number }[]>([])
  const [selectedRangeDate, setSelectedRangeDate] = useState(new Date())
  const [facturacionAnual, setFacturacionAnual] = useState<{ mes: string; gimnasio: number; clase: number }[]>([])

  const fetchAsistenciasPorHora = async (fecha: Date) => {
    const dia = dayjs(fecha).format("DD")
    const mes = dayjs(fecha).format("MM")
    const anio = dayjs(fecha).format("YYYY")

    const asistenciasRes = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias/por-hora/${dia}/${mes}/${anio}`)

    const dataHora = Object.entries(asistenciasRes.data).map(([hora, cantidad]) => ({
      hora,
      cantidad: Number(cantidad)
    }))

    setAsistenciasHora(dataHora)
  }

  const fetchPromedios = async (fecha: Date) => {
    const dia = dayjs(fecha).format("DD")
    const mes = dayjs(fecha).format("MM")
    const anio = dayjs(fecha).format("YYYY")
    const formattedDate = `${dia}/${mes}/${anio}`
    const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias/promedios-rangos/${formattedDate}`)

    const dataPromedios = [
      {
        rango: "Mañana (7-12hs)",
        promedio: res.data.rangos.manana.promedio ?? 0,
      },
      {
        rango: "Tarde (15-18hs)",
        promedio: res.data.rangos.tarde.promedio ?? 0,
      },
      {
        rango: "Noche (18-22hs)",
        promedio: res.data.rangos.noche.promedio ?? 0,
      },
    ]

    setPromedios(dataPromedios)
  }

  const fetchFacturacionAnual = async () => {
    const anio = dayjs().year()
    const promises = Array.from({ length: 12 }, (_, i) =>
      axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/pagos/facturacion/tipo/${i + 1}/${anio}`)
        .then(res => ({
          mes: res.data.mes,
          gimnasio: res.data.totales.GIMNASIO ?? 0,
          clase: res.data.totales.CLASE ?? 0
        }))
    )
    const data = await Promise.all(promises)
    setFacturacionAnual(data)
  }

  useEffect(() => {
    fetchAsistenciasPorHora(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    const fetchData = async () => {
      const [estadoRes, edadRes, planesRes] = await Promise.all([
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/estado`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/estadisticas/edades`),
        axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/alumnos/planes/distribucion`),
      ])

      setEstadoAlumnos(estadoRes.data)
      setEdadDistribucion(
        Object.entries(edadRes.data).map(([edad, cantidad]) => ({
          edad: Number(edad),
          cantidad: Number(cantidad)
        }))
      )
      setPlanesDistribucion(planesRes.data)
    }

    fetchData()
    fetchFacturacionAnual()
  }, [])

  useEffect(() => {
    fetchPromedios(selectedRangeDate)
  }, [selectedRangeDate])
  return (
    <div className={isVisible ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "hidden"}>
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <Users className="text-orange-500" />
          <CardTitle>Alumnos Activos vs Vencidos</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { estado: "Activos", cantidad: estadoAlumnos.activos },
              { estado: "Vencidos", cantidad: estadoAlumnos.vencidos },
            ]}>
              <XAxis dataKey="estado" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                <Cell fill="#FFA726" />
                <Cell fill="#FB8C00" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <CalendarCheck className="text-orange-500" />
          <CardTitle>Distribución por Edad</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={edadDistribucion}>
              <XAxis dataKey="edad" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                {edadDistribucion.map((_, index) => (
                  <Cell key={`edad-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <PieIcon className="text-orange-500" />
          <CardTitle>Alumnos por Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(planesDistribucion).map(([plan, cantidad]) => ({ plan, cantidad }))}
                dataKey="cantidad"
                nameKey="plan"
                outerRadius={100}
                animationDuration={500}
                label
              >
                {Object.entries(planesDistribucion).map(([_, __], index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-center">
          <div className="flex items-center flex-col gap-2">
            <Users className="text-orange-500" />
            <CardTitle>Asistencias por Hora</CardTitle>
          </div>
        </CardHeader>
        <div className="w-full flex justify-end">
          <div className="w-[200px] my-3 mx-5">
            <DatePicker date={selectedDate} setDate={setSelectedDate} />
          </div>
        </div>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={asistenciasHora}>
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="cantidad" stroke="#FFA726" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-col ">
          <div className="flex items-center flex-col gap-2">
            <Users className="text-orange-500" />
            <CardTitle>Promedio por Rangos (desde el 1 hasta hoy)</CardTitle>
          </div>
        </CardHeader>
        <div className="w-full flex justify-end">
          <div className="w-[200px] my-3 mx-5">
            <DatePicker date={selectedRangeDate} setDate={setSelectedRangeDate} />
          </div>
        </div>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={promedios}>
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="promedio" radius={[10, 10, 0, 0]} fill="#FFA726" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-3">
        <CardHeader className="flex w-full items-center">
            <DollarSign className="text-orange-500" />
            <CardTitle>Facturación mensual. Gimnasio y Clases</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={facturacionAnual}>
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip formatter={(value: number, name: string) => [`$${value}`, name]} />
              <Bar dataKey="gimnasio" fill="#FFA726" name="Gimnasio" radius={[10, 10, 0, 0]} />
              <Bar dataKey="clase" fill="#FF7043" name="Clase" radius={[10, 10, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

    </div>
  )
}