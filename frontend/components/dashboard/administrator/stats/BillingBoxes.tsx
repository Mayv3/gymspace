import {
    Card,
    CardContent,
    CardTitle,
    CardHeader
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { CustomTooltipCajas } from '@/components/dashboard/administrator/tooltips/CustomTooltipBillingBox';
import { parse, isValid, format } from "date-fns";
import { COLORS } from '@/components/dashboard/administrator/stats/colors';
import dayjs from 'dayjs';
import 'dayjs/locale/es';
import { BillingBoxesProps } from '@/models/stats/BillingBox'

export const BillingBoxes = ({
    selectedYear,
    setSelectedYear,
    selectedMonthCajas,
    setSelectedMonthCajas,
    cajasTransformadas = [],
}: BillingBoxesProps) => {
    const data = Array.isArray(cajasTransformadas) ? cajasTransformadas : [];

    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
            <CardContent>
                <div className="flex flex-col gap-2">
                    <CardHeader className="flex items-center gap-2 flex-col">
                        <DollarSign className="text-orange-500" />
                        <CardTitle>Cajas registradas por año y mes</CardTitle>
                    </CardHeader>
                    <div className="flex justify-end gap-4 w-full">
                        <div className="w-[120px]">
                            <Select
                                value={selectedMonthCajas}
                                onValueChange={(val) => setSelectedMonthCajas(val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Mes" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 12 }, (_, i) => (
                                        <SelectItem key={i} value={(i + 1).toString()}>
                                            {dayjs().month(i).locale("es").format("MMMM")}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="w-[100px]">
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(val) => setSelectedYear(Number(val))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {["2024", "2025", "2026", "2027", "2028", "2029", "2030"].map((anio) => (
                                        <SelectItem key={anio} value={anio}>
                                            {anio}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>


                    </div>
                </div>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No hay datos disponibles para el mes seleccionado.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={data} margin={{ top: 5, right: 10, left: 5, bottom: 5 }}>
                            <XAxis
                                dataKey="fecha"
                                tickFormatter={(val) => {
                                    const parsed = parse(val, "dd/MM/yyyy", new Date());
                                    return isValid(parsed) ? format(parsed, "dd/MM/yyyy") : "Fecha inválida";
                                }}
                            />
                            <YAxis width={80} tickFormatter={(val) => new Intl.NumberFormat("es-AR").format(val)} />
                            <Tooltip
                                content={<CustomTooltipCajas />}
                                position={{ y: -100 }}
                                wrapperStyle={{ zIndex: 1000 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="tarde_monto"
                                name="Tarde"
                                stroke={COLORS[4]}
                                strokeWidth={2}
                                dot={{ r: 5 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="mañana_monto"
                                name="Mañana"
                                stroke={COLORS[0]}
                                strokeWidth={2}
                                dot={{ r: 4 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
