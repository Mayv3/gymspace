import { TooltipProps } from "recharts";

export const CustomTooltip: React.FC<TooltipProps<number, string> & {
    explicaciones?: Record<string, string>;
}> = ({ active, payload, label, explicaciones = {} }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium w-max max-w-[240px]">
                {payload.length > 1 ? (
                    payload.map((entry, index) => (
                        <div key={index} className="mb-1">
                            <p className="font-bold text-brand-600 dark:text-brand-300">
                                {entry.name} : ${entry.value}
                            </p>
                        </div>
                    ))
                ) : (
                    <>
                        <p className="font-bold mb-1">{payload[0].name}: {payload[0].value}</p>
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
