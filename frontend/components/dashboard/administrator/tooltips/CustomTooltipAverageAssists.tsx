import { TooltipProps } from "recharts";

interface TooltipData {
    rango: string;
    total: number;
    dias: number;
    promedio: number;
}

const formatNumber = (n: number) =>
    new Intl.NumberFormat("es-AR").format(n);

export const CustomTooltipAverageAssists = ({
    active,
    payload,
}: TooltipProps<number, string>) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload as TooltipData;
    console.log(payload);

    return (
        <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium min-w-[220px]">
            <p className="font-bold mb-2">{data.rango}</p>

            <ul className="text-sm space-y-1">
                <li>Asistencias: {formatNumber(data.total)}</li>
                <li>Días con actividad en este turno: {data.dias}</li>
                <li className="font-bold">
                    Promedio por día activo: {Math.round(data.promedio)}
                </li>
            </ul>
        </div>
    );
};
