import { TooltipProps } from "recharts";

interface Props extends TooltipProps<number, string> {
  tipo: "gimnasio" | "clase";
}

export const CustomTooltipAsistenciasHora: React.FC<Props> = ({
  active,
  payload,
  tipo,
}) => {
  if (!active || !payload || !payload.length) return null;

  const data = payload[0].payload as {
    hora: string;
    cantidad: number;
  };

  const formatTipo = tipo === "gimnasio" ? "Gimnasio" : "Clase";

  return (
    <div className="p-2 rounded-md shadow text-sm border bg-white dark:bg-gray-800 dark:text-white min-w-[160px]">
      <p className="font-semibold mb-1">🕒 {data.hora}</p>
      <p className="text-xs mb-1">🏷️ {formatTipo}</p>
      <p className="font-semibold">👥 Asistencias: {data.cantidad}</p>
    </div>
  );
};
