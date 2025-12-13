import { TooltipProps } from "recharts";

export const CustomTooltipProfesores: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        const isDark =
            typeof window !== "undefined" &&
            document.documentElement.classList.contains("dark");

        return (
            <div
                className="p-2 rounded-md shadow text-sm border w-max max-w-[300px]"
                style={{
                    backgroundColor: isDark ? "hsl(220, 14%, 20%)" : "#fff",
                    color: isDark ? "hsl(0, 0%, 95%)" : "#000",
                }}
            >
                <p className="font-semibold mb-2">
                    👨‍🏫 {data.profesor}: {data.cantidad} alumnos
                </p>

                {data.alumnos?.length > 0 && (
                    <div className="mt-1">
                        <p className="font-semibold text-xs mb-1">👥 Lista de alumnos:</p>
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