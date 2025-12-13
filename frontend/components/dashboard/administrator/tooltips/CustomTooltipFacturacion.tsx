import { TooltipProps } from "recharts";

export const CustomTooltipFacturacion: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0]?.payload;

        const formatNumber = (num: number) =>
            new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0 }).format(num);

        const gimnasio = data.gimnasio || 0;
        const clases = data.clase || 0;

        const egresosGimnasio = data.egresosGimnasio || 0;
        const egresosClases = data.egresosClase || 0;

        const netoGimnasio = data.netoGimnasio || (gimnasio - egresosGimnasio);
        const netoClase = data.netoClase || (clases - egresosClases);

        const servicio = data.servicio || 0;
        const producto = data.producto || 0;

        const tarjeta = data.tarjeta || 0;
        const efectivo = data.efectivo || 0;

        const netoTotal = netoGimnasio + netoClase + servicio + producto;

        return (
            <div className="p-2 rounded-md shadow text-sm border w-max max-w-[260px] bg-white dark:bg-gray-800 dark:text-white">
                <p className="font-semibold mb-1">💵 Ingreso Gimnasio: ${formatNumber(gimnasio)}</p>
                <p>📉 Egreso Gimnasio: ${formatNumber(egresosGimnasio)}</p>
                <p className="mb-1 text-green-500">📈 Neto Gimnasio: ${formatNumber(netoGimnasio)}</p>

                <p className="font-semibold mt-2">💵 Ingreso Clases: ${formatNumber(clases)}</p>
                <p>📉 Egreso Clases: ${formatNumber(egresosClases)}</p>
                <p className="mb-1 text-green-500">📈 Neto Clases: ${formatNumber(netoClase)}</p>

                <p className="font-semibold mt-2">💼 Ingreso Servicios: ${formatNumber(servicio)}</p>
                <p className="font-semibold">🛒 Ingreso Productos: ${formatNumber(producto)}</p>

                <hr className="my-2" />
                <p className="font-semibold text-blue-500">💳 Pagos con Tarjeta: ${formatNumber(tarjeta)}</p>
                <p className="font-semibold text-green-600">💵 Pagos en Efectivo: ${formatNumber(efectivo)}</p>

                <hr className="my-2" />
                <p className="font-bold text-orange-500">🧮 Neto Total: ${formatNumber(netoTotal)}</p>
            </div>
        );
    }

    return null;
};