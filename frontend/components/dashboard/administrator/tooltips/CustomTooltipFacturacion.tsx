import { TooltipProps } from "recharts";
type BillingView = "gimnasio" | "clase" | "servicio" | "producto"

interface Props extends TooltipProps<number, string> {
    billingView: BillingView
}

export const CustomTooltipFacturacion: React.FC<Props> = ({
    active,
    payload,
    billingView,
}) => {
    if (!active || !payload || !payload.length) return null

    const data = payload[0].payload

    const format = (n: number = 0) =>
        new Intl.NumberFormat("es-AR").format(n)

    const gimnasio = data.gimnasio ?? 0
    const egGim = data.egresosGimnasio ?? data.egresosgimnasio ?? 0
    const mes = data.mes

    const clase = data.clase ?? 0
    const egClase = data.egresosClase ?? data.egresosclase ?? 0

    const servicio = data.servicio ?? 0
    const producto = data.producto ?? 0

    return (
        <div className="p-2 rounded-md shadow text-sm border w-max bg-white dark:bg-gray-800 dark:text-white">
            <p className="font-semibold mb-1">📅 {mes}</p>
            {billingView === "gimnasio" && (
                <>
                    <p className="font-semibold">💵 Ingreso Gimnasio: ${format(gimnasio)}</p>
                    <p>📉 Egreso Gimnasio: ${format(egGim)}</p>
                    <p className="text-green-500 font-semibold">
                        📈 Neto Gimnasio: ${format(gimnasio - egGim)}
                    </p>
                </>
            )}

            {billingView === "clase" && (
                <>
                    <p className="font-semibold">💵 Ingreso Clases: ${format(clase)}</p>
                    <p>📉 Egreso Clases: ${format(egClase)}</p>
                    <p className="text-green-500 font-semibold">
                        📈 Neto Clases: ${format(clase - egClase)}
                    </p>
                </>
            )}

            {billingView === "servicio" && (
                <p className="font-semibold">
                    💼 Ingreso Servicios: ${format(servicio)}
                </p>
            )}

            {billingView === "producto" && (
                <p className="font-semibold">
                    🛒 Ingreso Productos: ${format(producto)}
                </p>
            )}
        </div>
    )
}
