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
    LineChart,
    Line,
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

export const Assits = () => {
    const [tipo, setTipo] = useState<TipoPlan>("gimnasio");
    const [asistencias, setAsistencias] = useState<AssistItem[]>([]);
    const [loading, setLoading] = useState(false);

    // 👉 FECHA INTERNA (HOY)
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

    // 🔁 cuando cambia fecha → refetch
    useEffect(() => {
        fetchAsistencias();
    }, [selectedDate]);

    // 🔁 cuando cambia tipo → recalcular data
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
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
            <CardContent>
                <CardHeader className="flex flex-col gap-3 items-center pb-4">
                    <Users className="text-orange-500" />
                    <CardTitle>Asistencias por hora ({tipo})</CardTitle>

                    <div className="flex gap-3 justify-center w-full flex-wrap">
                        <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPlan)}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="gimnasio">Gimnasio</SelectItem>
                                <SelectItem value="clase">Clase</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex justify-end w-[180px]">
                            <DatePicker date={selectedDate} setDate={setSelectedDate} />
                        </div>
                    </div>
                </CardHeader>

                {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <CircularProgress sx={{ color: "#f97316" }} size={36} />
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={asistencias}>
                            <XAxis dataKey="hora" />
                            <YAxis />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="cantidad"
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    );
};

