import { TooltipProps } from "recharts";
import { Calendar, Banknote, TrendingDown, TrendingUp, Briefcase, ShoppingCart } from "lucide-react";
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
        <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium w-max">
            <p className="font-bold mb-1 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 text-sky-500" /> {mes}</p>
            {billingView === "gimnasio" && (
                <>
                    <p className="font-bold flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-emerald-500" /> Ingreso Gimnasio: ${format(gimnasio)}</p>
                    <p className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Egreso Gimnasio: ${format(egGim)}</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Neto Gimnasio: ${format(gimnasio - egGim)}
                    </p>
                </>
            )}

            {billingView === "clase" && (
                <>
                    <p className="font-bold flex items-center gap-1.5"><Banknote className="w-3.5 h-3.5 text-emerald-500" /> Ingreso Clases: ${format(clase)}</p>
                    <p className="flex items-center gap-1.5"><TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Egreso Clases: ${format(egClase)}</p>
                    <p className="text-emerald-600 font-bold flex items-center gap-1.5">
                        <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Neto Clases: ${format(clase - egClase)}
                    </p>
                </>
            )}

            {billingView === "servicio" && (
                <p className="font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-indigo-500" /> Ingreso Servicios: ${format(servicio)}
                </p>
            )}

            {billingView === "producto" && (
                <p className="font-bold flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-orange-500" /> Ingreso Productos: ${format(producto)}
                </p>
            )}
        </div>
    )
}
