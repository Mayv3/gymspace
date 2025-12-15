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

    return (
        <div className="p-3 rounded-md shadow text-sm border bg-white dark:bg-gray-800 dark:text-white min-w-[220px]">
            <p className="font-semibold mb-2">{data.rango}</p>

            <ul className="text-sm space-y-1">
                <li> Asistencias: {formatNumber(data.total)}</li>
                <li> Días considerados: {data.dias}</li>
                <li className="font-semibold">
                    Promedio diario: {Math.round(data.promedio)}
                </li>
            </ul>
        </div>
    );
};
