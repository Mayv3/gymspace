import { TooltipProps } from "recharts";
import { parse, isValid, format } from "date-fns";
import { Calendar, Banknote, CreditCard, Wallet, Search, Dumbbell, Activity, Receipt } from "lucide-react";

const formatMoney = (value: number) =>
  new Intl.NumberFormat("es-AR").format(value);

export const CustomTooltipCajas: React.FC<TooltipProps<number, string>> = ({
  active,
  payload,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload;

  const montoTarde = data["tarde_monto"] || 0;
  const montoManana = data["mañana_monto"] || 0;
  const totalDia = montoTarde + montoManana;

  const mañana_tarjeta = data["mañana_tarjeta"] || 0;
  const mañana_efectivo = data["mañana_efectivo"] || 0;
  const tarde_tarjeta = data["tarde_tarjeta"] || 0;
  const tarde_efectivo = data["tarde_efectivo"] || 0;

  const total_tarjeta = mañana_tarjeta + tarde_tarjeta;
  const total_efectivo = mañana_efectivo + tarde_efectivo;

  const montoGimnasio =
    (data["mañana_gimnasio"] || 0) + (data["tarde_gimnasio"] || 0);
  const montoClase =
    (data["mañana_clases"] || 0) + (data["tarde_clases"] || 0);

  return (
    <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium">
      <p className="font-bold mb-1 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-sky-500" />{" "}
        {isValid(parse(data.fecha, "dd/MM/yyyy", new Date()))
          ? format(parse(data.fecha, "dd/MM/yyyy", new Date()), "dd/MM/yyyy")
          : "Fecha inválida"}
      </p>

      {["mañana", "tarde"].map((turno) => (
        <div key={turno} className="mb-2">
          <p className="font-bold capitalize">{turno}</p>
          <ul className="ml-2 text-xs space-y-0.5">
            <li className="flex items-center gap-1.5"><Banknote className="w-3 h-3 text-emerald-500" /> Efectivo: ${formatMoney(data[`${turno}_efectivo`] ?? 0)}</li>
            <li className="flex items-center gap-1.5"><CreditCard className="w-3 h-3 text-sky-500" /> Tarjeta: ${formatMoney(data[`${turno}_tarjeta`] ?? 0)}</li>
            <li className="flex items-center gap-1.5"><Wallet className="w-3 h-3 text-amber-500" /> Final: ${formatMoney(data[`${turno}_monto`] ?? 0)}</li>
          </ul>
        </div>
      ))}

      <div className="border-t border-border/60 mt-2 pt-2 text-sm">
        <p className="font-bold flex items-center gap-1.5"><Search className="w-3.5 h-3.5 text-muted-foreground" /> Desglose por tipo</p>
        <ul className="ml-2 text-xs space-y-0.5">
          <li className="flex items-center gap-1.5"><Dumbbell className="w-3 h-3 text-indigo-500" /> Gimnasio: ${formatMoney(montoGimnasio)}</li>
          <li className="flex items-center gap-1.5"><Activity className="w-3 h-3 text-orange-500" /> Clase: ${formatMoney(montoClase)}</li>
        </ul>
      </div>

      <div className="border-t border-border/60 mt-2 pt-2 text-sm">
        <p className="font-bold flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5 text-sky-500" /> Por método de pago</p>
        <ul className="ml-2 text-xs">
          <li>Total en Tarjeta: ${formatMoney(total_tarjeta)}</li>
          <li>Total en Efectivo: ${formatMoney(total_efectivo)}</li>
        </ul>
      </div>

      <div className="border-t border-border/60 mt-2 pt-2 text-sm font-bold flex items-center gap-1.5">
        <Receipt className="w-3.5 h-3.5 text-emerald-600" /> Total del día: ${formatMoney(totalDia)}
      </div>
    </div>
  );
};
