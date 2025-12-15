import { TooltipProps } from "recharts";
import { parse, isValid, format } from "date-fns";

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
    <div className="p-2 rounded-md shadow text-sm border bg-white dark:bg-gray-800 dark:text-white">
      <p className="font-bold mb-1">
        📅{" "}
        {isValid(parse(data.fecha, "dd/MM/yyyy", new Date()))
          ? format(parse(data.fecha, "dd/MM/yyyy", new Date()), "dd/MM/yyyy")
          : "Fecha inválida"}
      </p>

      {["mañana", "tarde"].map((turno) => (
        <div key={turno} className="mb-2">
          <p className="font-semibold capitalize">{turno}</p>
          <ul className="ml-2 text-xs">
            <li>💵 Efectivo: ${formatMoney(data[`${turno}_efectivo`] ?? 0)}</li>
            <li>💳 Tarjeta: ${formatMoney(data[`${turno}_tarjeta`] ?? 0)}</li>
            <li>💰 Final: ${formatMoney(data[`${turno}_monto`] ?? 0)}</li>
          </ul>
        </div>
      ))}

      <div className="border-t mt-2 pt-2 text-sm">
        <p className="font-semibold">🔍 Desglose por tipo</p>
        <ul className="ml-2 text-xs">
          <li>🏋️ Gimnasio: ${formatMoney(montoGimnasio)}</li>
          <li>🤸 Clase: ${formatMoney(montoClase)}</li>
        </ul>
      </div>

      <div className="border-t mt-2 pt-2 text-sm">
        <p className="font-semibold">💳 Por método de pago</p>
        <ul className="ml-2 text-xs">
          <li>Total en Tarjeta: ${formatMoney(total_tarjeta)}</li>
          <li>Total en Efectivo: ${formatMoney(total_efectivo)}</li>
        </ul>
      </div>

      <div className="border-t mt-2 pt-2 text-sm font-semibold">
        🧾 Total del día: ${formatMoney(totalDia)}
      </div>
    </div>
  );
};
