import {
  Card,
  CardContent,
  CardTitle,
  CardHeader
} from "@/components/ui/card"
import { CalendarCheck } from 'lucide-react'
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { CustomTooltip } from '../tooltips/CustomTooltip'
import { COLORS } from './colors'
import { AverageAssitsProps } from '@/models/stats/AverageAssists'

export const AverageAssits = ({ promedios }: AverageAssitsProps) => {
    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
            <CardContent>
                <CardHeader className="flex items-center flex-col pb-14">
                    <CalendarCheck className="text-orange-500" />
                    <CardTitle>Promedio de asistencias (gimnasio)</CardTitle>
                </CardHeader>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={promedios}>
                        <XAxis dataKey="rango" />
                        <YAxis />

                        <Tooltip content={<CustomTooltip />} />

                        <Bar dataKey="promedio" radius={[10, 10, 0, 0]}>
                            {promedios.map((_, i) => (
                                <Cell key={i} fill={COLORS[i % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
