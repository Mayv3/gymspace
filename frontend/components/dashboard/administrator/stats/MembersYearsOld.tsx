import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

import { COLORS } from "./colors"
import { useState } from "react"
import { CustomTooltipEdades } from "../tooltips/CustomTooltipEdades"

interface EdadItem {
  edad: number
  cantidad: number
}

type EdadDistribucion = EdadItem[] | Record<string, number>

type EdadDistribucionMap = {
  gimnasio?: Record<string, number>
  clase?: Record<string, number>
}

interface MembersYearsOldProps {
  edades?: EdadDistribucionMap
}

export const MembersYearsOld = ({ edades }: MembersYearsOldProps) => {
  const [tipo, setTipo] = useState<"gimnasio" | "clase">("gimnasio")

  const normalizeData = (data?: EdadDistribucion): EdadItem[] => {
    if (!data) return []

    if (Array.isArray(data)) return data

    return Object.entries(data).map(([edad, cantidad]) => ({
      edad: Number(edad),
      cantidad: Number(cantidad),
    }))
  }

  const data = normalizeData(edades?.[tipo])

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2">
          <Users className="text-orange-500" />

          <div>

          </div>
          <CardTitle className="text-center">
            Distribución por Edad
          </CardTitle>
        </div>

        <div className="w-full flex justify-end">
          <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
            <SelectTrigger className="w-[20%]">
              <SelectValue placeholder="Seleccionar tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gimnasio">Gimnasio</SelectItem>
              <SelectItem value="clase">Clase</SelectItem>
            </SelectContent>
          </Select>
        </div>

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
                content={<CustomTooltipEdades />}
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
