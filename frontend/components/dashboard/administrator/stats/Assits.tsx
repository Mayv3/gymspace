"use client";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import {
    AreaChart,
    Area,
    CartesianGrid,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { DatePicker } from "../../date-picker";
import { CustomTooltip } from "../tooltips/CustomTooltip";
import { COLORS } from "./colors";
import { useEffect, useState } from "react";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import dayjs from "dayjs";

interface AssistItem {
    hora: string;
    cantidad: number;
}


type TipoPlan = "gimnasio" | "clase";

import { useIsMobile } from "./UseIsMobile";
import { CustomTooltipAsistenciasHora } from "../tooltips/CustomTooltipAsistenciasHora";

export const Assits = () => {
    const [tipo, setTipo] = useState<TipoPlan>("gimnasio");
    const [asistencias, setAsistencias] = useState<AssistItem[]>([]);
    const [loading, setLoading] = useState(false);

    const isMobile = useIsMobile();

    const [selectedDate, setSelectedDate] = useState<Date>(new Date());

    const [rawData, setRawData] = useState<{
        gimnasio?: Record<string, number>;
        clase?: Record<string, number>;
    }>({});

    const fetchAsistencias = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/asistencias/distribucion`,
                {
                    params: {
                        fecha: dayjs(selectedDate).format("YYYY-MM-DD"),
                    },
                }
            );

            setRawData(res.data ?? {});
        } catch (e) {
            console.error("Error asistencias por hora:", e);
            setRawData({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAsistencias();
    }, [selectedDate]);

    useEffect(() => {
        const data = rawData?.[tipo] ?? {};

        const normalized: AssistItem[] = Object.entries(data).map(
            ([hora, cantidad]) => ({
                hora,
                cantidad: Number(cantidad),
            })
        );

        setAsistencias(normalized);
    }, [rawData, tipo]);

    return (
        <Card className="rounded-2xl border-border/60 shadow-soft hover:shadow-floating transition-shadow col-span-1 md:col-span-2 xl:col-span-2">
            <CardContent className="p-0 md:px-0">
                <CardHeader className="flex flex-col gap-3 items-center pb-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-500 flex items-center justify-center">
                        <Users className="w-5 h-5" />
                    </div>
                    <CardTitle className="font-bold">Asistencias por hora ({tipo})</CardTitle>

                    <div className="flex gap-2 justify-center w-full flex-wrap">
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPlan)}>
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gimnasio">Gimnasio</SelectItem>
                                <SelectItem value="clase">Clase</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex justify-end w-[140px]">
                            <DatePicker date={selectedDate} setDate={setSelectedDate} />
                        </div>
                    </div>
                </CardHeader>

                {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <CircularProgress sx={{ color: "#ff6a00" }} size={36} />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={290} style={{ padding: "0 24px" }}>
                        <AreaChart data={asistencias}>
                            <defs>
                                <linearGradient id="assitsGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#ff6a00" stopOpacity={0.3} />
                                    <stop offset="100%" stopColor="#ff6a00" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" vertical={false} />
                            <XAxis dataKey="hora" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                            <YAxis hide={isMobile} tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                            <Tooltip
                                content={<CustomTooltipAsistenciasHora tipo={tipo} />}
                                offset={30}
                                allowEscapeViewBox={{ x: false, y: false }}
                            />
                            <Area
                                type="monotone"
                                dataKey="cantidad"
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                fill="url(#assitsGradient)"
                                dot={{ r: 4, fill: COLORS[0], strokeWidth: 0 }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};

