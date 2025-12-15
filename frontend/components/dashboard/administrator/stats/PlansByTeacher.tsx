import {
    Card,
    CardContent,
    CardTitle,
    CardHeader
} from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tooltip as TooltipUI, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import dayjs from 'dayjs'
import 'dayjs/locale/es'
import { CalendarCheck, Info } from 'lucide-react'
import { BarChart, Bar, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { COLORS } from './colors'
import { CustomTooltipProfesores } from '../tooltips/CustomTooltipProfesores';
import { useIsMobile } from "@/hooks/use-mobile";

interface PlanPorProfesor {
    profesor: string;
    cantidad: number;
    alumnos?: string[];
}

interface PlansByTeacherProps {
    selectedYearPersonalizados: number;
    setSelectedYearPersonalizados: (year: number) => void;
    selectedMonthPersonalizados: string;
    setSelectedMonthPersonalizados: (month: string) => void;
    planesPorProfesor?: PlanPorProfesor[];
}

export const PlansByTeacher = ({
    selectedYearPersonalizados,
    setSelectedYearPersonalizados,
    selectedMonthPersonalizados,
    setSelectedMonthPersonalizados,
    planesPorProfesor = [],
}: PlansByTeacherProps) => {
    const data = Array.isArray(planesPorProfesor) ? planesPorProfesor : [];
    const isMobile = useIsMobile();
    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
            <CardContent>
                <div className='flex flex-col'>
                    <CardHeader className="flex items-center flex-col pb-4">
                        <CalendarCheck className="text-orange-500" />
                        <CardTitle>Planes Personalizados por Profesor</CardTitle>
                    </CardHeader>
                    <div className="flex justify-end gap-4 w-full items-center">
                        <div className="w-[170px] flex items-center gap-2">
                            <Select
                                value={selectedMonthPersonalizados}
                                onValueChange={(val) => setSelectedMonthPersonalizados(val)}
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
                                value={selectedYearPersonalizados.toString()}
                                onValueChange={(val) => setSelectedYearPersonalizados(Number(val))}
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

                        <div>
                            <TooltipProvider>
                                <TooltipUI>
                                    <TooltipTrigger asChild>
                                        <Info className="text-muted-foreground w-6 h-6" />
                                    </TooltipTrigger>
                                    <TooltipContent side="top">
                                        <p className="text-sm max-w-[220px] text-center">
                                            Muestra cuántos alumnos pagaron un plan personalizado con cada profesor en el mes y año seleccionados.
                                        </p>
                                    </TooltipContent>
                                </TooltipUI>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
                {data.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center mt-8">
                        No hay planes personalizados para esta fecha.
                    </p>
                ) : (
                    <ResponsiveContainer width="100%" height={360}>
                        <BarChart data={data}>
                            <XAxis dataKey="profesor" hide={isMobile} />
                            <YAxis hide={isMobile} />
                            <Tooltip content={<CustomTooltipProfesores />} allowEscapeViewBox={{ x: false, y: false }}
                            />
                            <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}
