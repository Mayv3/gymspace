import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
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
import { AssitsProps } from "@/models/stats/Assists";

export const Assits = ({
    selectedDate,
    setSelectedDate,
    asistencias = [],
}: AssitsProps) => {
    return (
        <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">

            <CardContent>
                <CardHeader className="flex flex-col items-center pb-4">
                    <Users className="text-orange-500" />
                    <CardTitle>Asistencias por hora (gimnasio)</CardTitle>
                </CardHeader>
                <div className="flex justify-end w-full">
                    <div className="w-auto">
                        <DatePicker date={selectedDate} setDate={setSelectedDate} />
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={asistencias}>
                        <XAxis dataKey="hora" />
                        <YAxis />
                        <Tooltip content={<CustomTooltip />} />
                        <Line
                            type="monotone"
                            dataKey="cantidad"
                            stroke={COLORS[0]}
                            strokeWidth={3}
                            dot={{ r: 4 }}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
};

