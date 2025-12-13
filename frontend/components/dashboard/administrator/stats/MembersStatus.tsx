import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Users } from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"

import { CustomTooltip } from "@/components/dashboard/administrator/tooltips/CustomTooltip"
import { EstadoItem, EstadoData } from "@/models/stats/memberState"

const COLORS = [
  "#FFB74D",
  "#FFA726",
  "#FF9800",
  "#FB8C00",
  "#F57C00",
  "#EF6C00",
  "#E65100",
  "#BF360C",
]

const estadoExplicaciones = {
  Activos: "Alumnos con plan vigente y clases disponibles.",
  Vencidos: "Alumnos cuyo plan venció hace menos de 30 días.",
  Abandonos: "Alumnos con plan vencido hace más de 30 días.",
}

interface MembersStatusProps {
  estadoArray?: EstadoItem[] | EstadoData
}

export const MembersStatus = ({ estadoArray }: MembersStatusProps) => {
  const normalizeData = (
    input: EstadoItem[] | EstadoData | undefined
  ): EstadoItem[] => {
    if (!input) return []

    if (Array.isArray(input)) return input

    if (typeof input === "object") {
      return [
        { estado: "Activos", cantidad: input.activos ?? 0 },
        { estado: "Vencidos", cantidad: input.vencidos ?? 0 },
        { estado: "Abandonos", cantidad: input.abandonos ?? 0 },
      ]
    }

    return []
  }

  const data = normalizeData(estadoArray)

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="flex flex-col items-center gap-2">
        <Users className="text-orange-500" />
        <CardTitle className="text-center">
          Alumnos Activos / Vencidos / Abandonos
        </CardTitle>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center mt-8">
            No hay datos disponibles.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <XAxis
                dataKey="estado"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                content={<CustomTooltip explicaciones={estadoExplicaciones} />}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
