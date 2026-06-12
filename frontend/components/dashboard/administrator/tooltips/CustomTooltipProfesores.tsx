import { TooltipProps } from "recharts";
import { GraduationCap, Users } from "lucide-react";

export const CustomTooltipProfesores: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;

        return (
            <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium w-max max-w-[300px]">
                <p className="font-bold mb-2 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" /> {data.profesor}: {data.cantidad} alumnos
                </p>

                {data.alumnos?.length > 0 && (
                    <div className="mt-1">
                        <p className="font-bold text-xs mb-1 flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-500" /> Lista de alumnos:</p>
                        <div className="grid grid-cols-5 gap-x-2 gap-y-1 text-xs">
                            {data.alumnos.map((alumno: string, i: number) => (
                                <span key={i} className="truncate">
                                    {alumno}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }
    return null;
};
