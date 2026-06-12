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
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  ResponsiveContainer,
} from "recharts"

import { COLORS } from "./colors"
import { useState } from "react"
import { CustomTooltipEdades } from "../tooltips/CustomTooltipEdades"
import { useIsMobile } from "@/hooks/use-mobile"

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

  const isMobile = useIsMobile()

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
    <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow col-span-1 md:col-span-2 xl:col-span-2">
      <CardHeader className="flex flex-col gap-3">
        <div className="flex flex-col items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>

          <div>

          </div>
          <CardTitle className="text-center font-bold">
            Distribución por Edad
          </CardTitle>
        </div>

        <div className="w-full flex justify-end">
          <Select value={tipo} onValueChange={(v) => setTipo(v as any)}>
            <SelectTrigger className="w-[140px]">
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
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
              <XAxis
                dataKey="edad"
                stroke="hsl(var(--muted-foreground))"
                hide={isMobile}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />

              <YAxis
                stroke="hsl(var(--muted-foreground))"
                hide={isMobile}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                content={<CustomTooltipEdades />}
                allowEscapeViewBox={{ x: false, y: false }}
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
