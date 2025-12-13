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

import { CustomTooltip } from "../tooltips/CustomTooltip"
import { COLORS } from "./colors"

interface EdadItem {
  edad: number
  cantidad: number
}

type EdadDistribucion = EdadItem[] | Record<string, number>

interface MembersYearsOldProps {
  edadDistribucion?: EdadDistribucion
}

export const MembersYearsOld = ({ edadDistribucion }: MembersYearsOldProps) => {
  const normalizeData = (data?: EdadDistribucion): EdadItem[] => {
    if (!data) return []

    if (Array.isArray(data)) return data

    return Object.entries(data).map(([edad, cantidad]) => ({
      edad: Number(edad),
      cantidad: Number(cantidad),
    }))
  }

  const data = normalizeData(edadDistribucion)

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="flex flex-col items-center gap-2">
        <Users className="text-orange-500" />
        <CardTitle className="text-center">
          Distribución por Edad
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
                dataKey="edad"
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
              />
              <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                {data.map((_, i) => (
                  <Cell
                    key={i}
                    fill={COLORS[i % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
