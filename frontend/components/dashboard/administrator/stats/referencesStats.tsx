"use client"

import React, { useEffect, useState } from "react"
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
import axios from "axios"
import { BarChart3Icon } from "lucide-react"
import { useIsMobile } from "@/hooks/use-mobile"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { COLORS } from "./colors"
import CircularProgress from "@mui/material/CircularProgress"

interface AltasPorReferenciaMes {
    mes: number
    instagram: number
    facebook: number
    amigos_familiares: number
    google: number
    otro: number
    total: number
}

const REFERENCIAS_KEYS = [
    "instagram",
    "amigos_familiares",
    "google",
    "otro",
]

const MESES = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
]

const REFERENCIAS_LABELS: Record<string, string> = {
    instagram: "Instagram",
    amigos_familiares: "Amigos/Familiares",
    google: "Google",
    otro: "Otro",
}

const MESES_LABEL: Record<number, string> = {
    1: "Enero",
    2: "Febrero",
    3: "Marzo",
    4: "Abril",
    5: "Mayo",
    6: "Junio",
    7: "Julio",
    8: "Agosto",
    9: "Septiembre",
    10: "Octubre",
    11: "Noviembre",
    12: "Diciembre",
}


export const ReferencesStats = () => {
    const isMobile = useIsMobile()

    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1

    const [anio, setAnio] = useState<number>(currentYear)

    const [mes, setMes] = useState<string>(String(currentMonth))

    const [data, setData] = useState<AltasPorReferenciaMes[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        setLoading(true)

        axios
            .get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/altas-por-referencia`, {
                params: {
                    anio,
                    mes: mes === "all" ? undefined : Number(mes),
                },
            })
            .then(res => setData(res.data ?? []))
            .catch(err => {
                console.error("Error altas por referencia:", err)
                setData([])
            })
            .finally(() => setLoading(false))
    }, [anio, mes])

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all">
            <CardHeader className="flex flex-col items-center gap-2">
                <BarChart3Icon className="text-orange-500" />
                <CardTitle>Altas por referencia</CardTitle>
            </CardHeader>

            <CardContent>
                <div className="flex gap-3 justify-end mb-4">
                    <Select value={String(anio)} onValueChange={v => setAnio(Number(v))}>
                        <SelectTrigger className="w-[110px]">
                            <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                            {['2025', '2026', '2027', '2028', '2029', '2030'].map(y => (
                                <SelectItem key={y} value={String(y)}>
                                    {y}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={mes} onValueChange={setMes}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                            {MESES.map(m => (
                                <SelectItem key={m.value} value={m.value}>
                                    {m.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {loading ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        <CircularProgress sx={{ color: "#f97316" }} size={36} />
                    </p>
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No hay datos disponibles.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={320}>
                        <BarChart
                            data={data}
                            barGap={8}
                            barCategoryGap={24}
                        >
                            <XAxis dataKey="mes" hide={isMobile} />
                            <YAxis hide={isMobile} />
                            <Tooltip
                                shared
                                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                content={<CustomTooltipReferencia anio={anio} />}
                            />

                            {REFERENCIAS_KEYS.map((key, index) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={COLORS[index % COLORS.length]}
                                    radius={[4, 4, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>

                )}
            </CardContent>
        </Card>
    )
}

const CustomTooltipReferencia = ({
    active,
    payload,
    label,
    anio,
}: any) => {
    if (!active || !payload?.length) return null

    const mesNombre = MESES_LABEL[label]

    return (
        <div className="rounded-lg border bg-background p-3 shadow-md text-sm">
            <p className="font-semibold mb-2">
                {mesNombre} de {anio}
            </p>

            {payload.map((item: any) => (
                <div key={item.dataKey} className="flex justify-between gap-4">
                    <span style={{ color: 'text-foregroung' }}>
                        {REFERENCIAS_LABELS[item.dataKey]}
                    </span>
                    <span className="font-medium">{item.value}</span>
                </div>
            ))}
        </div>
    )
}

