import { TooltipProps } from "recharts";

export const CustomTooltip: React.FC<TooltipProps<number, string> & {
    explicaciones?: Record<string, string>;
}> = ({ active, payload, label, explicaciones = {} }) => {
    if (active && payload && payload.length) {
        const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");

        return (
            <div className="p-2 rounded-md shadow text-sm border w-max max-w-[240px]"
                style={{
                    backgroundColor: isDark ? "hsl(220, 14%, 20%)" : "#fff",
                    color: isDark ? "hsl(0, 0%, 95%)" : "#000",
                }}>
                {payload.length > 1 ? (
                    payload.map((entry, index) => (
                        <div key={index} className="mb-1">
                            <p className="font-semibold" style={{ color: isDark ? "hsl(30, 100%, 70%)" : "#000" }}>
                                {entry.name} : ${entry.value}
                            </p>
                        </div>
                    ))
                ) : (
                    <>
                        <p className="font-semibold mb-1">{payload[0].name}: {payload[0].value}</p>
                        {explicaciones[payload[0].payload.estado ?? ""] && (
                            <p className="text-muted-foreground">{explicaciones[payload[0].payload.estado]}</p>
                        )}
                    </>
                )}
            </div>
        );
    }
    return null;
};


