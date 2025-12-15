"use client";

import {
    Card,
    CardContent,
    CardTitle,
    CardHeader,
} from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { DollarSign } from "lucide-react";
import {
    LineChart,
    Line,
    ResponsiveContainer,
    XAxis,
    YAxis,
    Tooltip,
} from "recharts";
import { CustomTooltipCajas } from "@/components/dashboard/administrator/tooltips/CustomTooltipBillingBox";
import dayjs from "dayjs";
import axios from "axios";
import { useEffect, useState } from "react";
import { COLORS } from "@/components/dashboard/administrator/stats/colors";
import { CircularProgress } from "@mui/material";
import { parse, isValid, format } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

// Función para completar los días del mes con 0
const buildFullMonthData = (
    year: number,
    month: number,
    apiData: any[]
) => {
    const daysInMonth = dayjs(`${year}-${month}-01`).daysInMonth();

    const dataMap = new Map(
        apiData.map((d) => [d.fecha, d])
    );

    return Array.from({ length: daysInMonth }, (_, i) => {
        const date = dayjs(`${year}-${month}-${i + 1}`);
        const key = date.format("DD/MM/YYYY");

        return (
            dataMap.get(key) || {
                fecha: key,

                mañana_monto: 0,
                tarde_monto: 0,

                mañana_efectivo: 0,
                mañana_tarjeta: 0,
                tarde_efectivo: 0,
                tarde_tarjeta: 0,

                mañana_gimnasio: 0,
                tarde_gimnasio: 0,
                mañana_clases: 0,
                tarde_clases: 0,
            }
        );
    });
};

export const BillingBoxes = () => {
    const [selectedMonth, setSelectedMonth] = useState(
        (dayjs().month() + 1).toString()
    );
    const [selectedYear, setSelectedYear] = useState(
        dayjs().year().toString()
    );

    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const isMobile = useIsMobile();
    // Función para obtener los ingresos mensuales
    const fetchIngresosMensuales = async () => {
        try {
            setLoading(true);

            const res = await axios.get(
                `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/ingresos-mensuales`,
                {
                    params: {
                        anio: Number(selectedYear),
                        mes: Number(selectedMonth),
                    },
                }
            );

            const fullMonthData = buildFullMonthData(
                Number(selectedYear),
                Number(selectedMonth),
                Array.isArray(res.data) ? res.data : []
            );

            setData(fullMonthData);
        } catch (e) {
            console.error("Error ingresos mensuales:", e);
            setData([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchIngresosMensuales();
    }, [selectedMonth, selectedYear]);

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
            <CardContent>
                <CardHeader className="flex flex-col items-center gap-2">
                    <DollarSign className="text-orange-500" />
                    <CardTitle>Cajas del mes</CardTitle>

                    <div className="flex gap-3 mt-2">
                        <Select
                            value={selectedMonth}
                            onValueChange={setSelectedMonth}
                        >
                            <SelectTrigger className="w-[140px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }, (_, i) => (
                                    <SelectItem key={i} value={(i + 1).toString()}>
                                        {dayjs().month(i).locale("es").format("MMMM")}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* AÑO */}
                        <Select
                            value={selectedYear}
                            onValueChange={setSelectedYear}
                        >
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {["2025", "2026", "2027", "2028", "2029", "2030"].map((y) => (
                                    <SelectItem key={y} value={y}>
                                        {y}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <p className="text-xs text-muted-foreground text-center">
                        Ingresos diarios separados por turno
                    </p>
                </CardHeader>

                {loading ? (
                    <div className="flex justify-center items-center h-[300px]">
                        <CircularProgress sx={{ color: "#f97316" }} size={36} />
                    </div>
                ) : data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No hay datos disponibles para el mes seleccionado.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data}>
                            <XAxis
                                dataKey="fecha"
                                tickFormatter={(val) => {
                                    const parsed = parse(val, "dd/MM/yyyy", new Date());
                                    return isValid(parsed)
                                        ? format(parsed, "dd/MM")
                                        : val;
                                }}
                                hide={isMobile}
                            />
                            <YAxis
                                tickFormatter={(val) =>
                                    new Intl.NumberFormat("es-AR").format(val)
                                }
                                width={80}
                                hide={isMobile}
                            />
                            <Tooltip
                                content={<CustomTooltipCajas />}
                                position={{ y: -100 }}
                                offset={50}
                                allowEscapeViewBox={{ x: false, y: false }}
                                wrapperStyle={{ zIndex: 1000 }}
                            />

                            <Line
                                type="monotone"
                                dataKey="mañana_monto"
                                name="Mañana"
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="tarde_monto"
                                name="Tarde"
                                stroke={COLORS[4]}
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
