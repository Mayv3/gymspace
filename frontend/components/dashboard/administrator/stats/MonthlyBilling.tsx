
import {
    Card,
    CardContent,
    CardTitle,
    CardHeader
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CustomTooltipFacturacion } from "../tooltips/CustomTooltipFacturacion";
import { COLORS } from "./colors";
import { Factura } from "@/models/stats/factura";
import React from 'react'

type BillingView = "gimnasio" | "clase" | "servicio" | "producto"

export const MonthlyBilling = ({ facturacionData, selectedYearFacturacion, setSelectedYearFacturacion }: { facturacionData: Factura[], selectedYearFacturacion: number, setSelectedYearFacturacion: React.Dispatch<React.SetStateAction<number>> }) => {
    const [billingView, setBillingView] = React.useState<BillingView>("gimnasio")

    const facturacionNormalizada = facturacionData.map(f => ({
        ...f,
        egresosClase: f.egresosclase ?? 0,
        egresosGimnasio: f.egresosgimnasio ?? 0,
    }));


    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-3">
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-5">
                    <CardHeader className="flex flex-row items-center gap-2 justify-center">
                        <div className="flex flex-row gap-5 justify-center items-center">
                            <CardTitle>Facturación Mensual: Ingresos, Egresos y Neto</CardTitle>
                            <Select
                                value={selectedYearFacturacion.toString()}
                                onValueChange={(val) => setSelectedYearFacturacion(Number(val))}
                            >
                                <Select
                                    value={billingView}
                                    onValueChange={(val) => setBillingView(val as BillingView)}
                                >
                                    <SelectTrigger className="w-[160px]">
                                        <SelectValue placeholder="Tipo" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gimnasio">Gimnasio</SelectItem>
                                        <SelectItem value="clase">Clases</SelectItem>
                                        <SelectItem value="servicio">Servicios</SelectItem>
                                        <SelectItem value="producto">Productos</SelectItem>
                                    </SelectContent>
                                </Select>

                                <SelectTrigger className="w-[100px]">
                                    <SelectValue placeholder="Año" />
                                </SelectTrigger>
                                <SelectContent>
                                    {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() + i).map((anio) => (
                                        <SelectItem key={anio} value={anio.toString()}>
                                            {anio}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>

                        </div>

                    </CardHeader>

                </div>
                {facturacionData.length === 0 || facturacionData.every(f => f.gimnasio === 0 && f.clase === 0 && (f.egresosgimnasio ?? 0) === 0 && (f.egresosclase ?? 0) === 0) ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No hay datos de facturación para este año.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={350}>
                        <BarChart data={facturacionNormalizada}
                            margin={{ top: 0, right: 0, left: 20, bottom: 10 }}>
                            <XAxis dataKey="mes" />
                            <YAxis />
                            <Tooltip content={<CustomTooltipFacturacion billingView={billingView} />} />

                            {billingView === "gimnasio" && (
                                <Bar
                                    dataKey="gimnasio"
                                    stackId="gimnasio"
                                >
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill={COLORS[0]} />
                                    ))}
                                </Bar>
                            )}

                            {billingView === "gimnasio" && (
                                <Bar
                                    dataKey="egresosgimnasio"
                                    stackId="gimnasio"
                                    radius={[6, 6, 0, 0]}
                                >
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill="#ef4444" />
                                    ))}
                                </Bar>
                            )}

                            {billingView === "clase" && (
                                <Bar
                                    dataKey="clase"
                                    stackId="clase"
                                    name="Ingreso Clases"
                                >
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill={COLORS[2]} />
                                    ))}
                                </Bar>
                            )}

                            {billingView === "clase" && (
                                <Bar
                                    dataKey="egresosclase"
                                    stackId="clase"
                                    radius={[6, 6, 0, 0]}
                                    name="Egreso Clases"
                                >
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill="#f87171" />
                                    ))}
                                </Bar>
                            )}


                            {billingView === "servicio" && (
                                <Bar radius={[6, 6, 0, 0]} dataKey="servicio" name="Ingreso Servicios">
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill="#10b981" />
                                    ))}
                                </Bar>
                            )}

                            {billingView === "producto" && (
                                <Bar radius={[6, 6, 0, 0]} dataKey="producto" name="Ingreso Productos">
                                    {facturacionNormalizada.map((_, i) => (
                                        <Cell key={i} fill="#8b5cf6" />
                                    ))}
                                </Bar>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}