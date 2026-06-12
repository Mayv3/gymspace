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
    CartesianGrid,
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

const REFERENCIAS_COLORS: Record<string, string> = {
    instagram: "#E1306C",
    amigos_familiares: "#ff6a00",
    google: "#4285F4",
    otro: "#8b5cf6",
}

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
        <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow">
            <CardHeader className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center">
                    <BarChart3Icon className="w-5 h-5" />
                </div>
                <CardTitle className="font-bold">Altas por referencia</CardTitle>
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
                        <CircularProgress sx={{ color: "#ff6a00" }} size={36} />
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
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                            <XAxis dataKey="mes" hide={isMobile} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                            <YAxis hide={isMobile} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                shared
                                cursor={{ fill: "rgba(0,0,0,0.04)" }}
                                content={<CustomTooltipReferencia anio={anio} />}
                            />

                            {REFERENCIAS_KEYS.filter(key =>
                                data.some(d => (d as any)[key] > 0)
                            ).map((key) => (
                                <Bar
                                    key={key}
                                    dataKey={key}
                                    fill={REFERENCIAS_COLORS[key]}
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
        <div className="bg-card rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium">
            <p className="font-bold mb-2">
                {mesNombre} de {anio}
            </p>

            {payload.filter((item: any) => item.value > 0).map((item: any) => (
                <div key={item.dataKey} className="flex justify-between gap-4 items-center">
                    <span style={{ color: REFERENCIAS_COLORS[item.dataKey] }} className="font-medium">
                        {REFERENCIAS_LABELS[item.dataKey]}
                    </span>
                    <span className="font-medium">{item.value}</span>
                </div>
            ))}
        </div>
    )
}

