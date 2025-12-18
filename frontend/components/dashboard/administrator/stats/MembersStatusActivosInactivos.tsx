"use client"

import React from "react"
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from "recharts"
import { Users } from "lucide-react"
import { COLORS } from "./colors"
import { useIsMobile } from "@/hooks/use-mobile"
import { Cell } from "recharts"

interface MembersStatusChartProps {
    estado: {
        activos: number
        vencidos: number
        abandonos: number
    }
}

const ESTADO_DESCRIPCION: Record<string, string> = {
    Activos: "Alumnos al día con su cuota.",
    Vencidos: "Alumnos con la cuota vencida hasta 10 días.",
    Abandonos: "Alumnos con más de 30 días desde el vencimiento.",
}

export const MembersStatusActivosInactivos = ({ estado }: MembersStatusChartProps) => {
    const isMobile = useIsMobile()

    const data = [
        { estado: "Activos", cantidad: estado.activos },
        { estado: "Vencidos", cantidad: estado.vencidos },
        { estado: "Abandonos", cantidad: estado.abandonos },
    ]

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-col items-center gap-2">
                <Users className="text-orange-500" />
                <CardTitle>Estado de Alumnos</CardTitle>
            </CardHeader>

            <CardContent>
                <ResponsiveContainer width="100%" height={370}>
                    <BarChart
                        data={data}
                        barGap={12}
                        barCategoryGap={32}
                    >
                        <XAxis
                            dataKey="estado"
                            tick={!isMobile}
                            hide={isMobile}
                        />
                        <YAxis hide={isMobile} />
                        <Tooltip content={<CustomTooltipEstado />} />


                        <Bar dataKey="cantidad" radius={[6, 6, 0, 0]}>
                            {data.map((_, index) => (
                                <Cell
                                    key={index}
                                    fill={COLORS[index % COLORS.length]}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}


const CustomTooltipEstado = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null

    const item = payload[0]

    return (
        <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
            <p className="font-semibold mb-2">{label}</p>

            <p className="text-xs text-muted-foreground mb-2">
                {ESTADO_DESCRIPCION[label]}
            </p>

            <div className="flex justify-between gap-4 items-center">
                <span style={{ color: item.color }}>Cantidad</span>
                <span className="font-medium">{item.value}</span>
            </div>
        </div>
    )
}
