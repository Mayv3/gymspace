import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import axios from "axios"
import { Users, CalendarCheck, PieChart as PieIcon } from "lucide-react"

const COLORS = [
  "#FFB74D",
  "#FFA726",
  "#FF9800",
  "#FB8C00",
  "#F57C00",
  "#EF6C00",
  "#E65100",
  "#BF360C"
]


export default function AdminOverviewCharts({ isVisible }: { isVisible: boolean }) {
  const [estadoAlumnos, setEstadoAlumnos] = useState({ activos: 0, vencidos: 0 })
  const [edadDistribucion, setEdadDistribucion] = useState<{ edad: number; cantidad: number }[]>([])
  const [planesDistribucion, setPlanesDistribucion] = useState([])

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
  }, [])


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
    </div>
  )
}