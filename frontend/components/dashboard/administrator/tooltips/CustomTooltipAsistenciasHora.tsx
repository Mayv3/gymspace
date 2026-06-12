import { TooltipProps } from "recharts";
import { Clock, Tag, Users } from "lucide-react";

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
    <div className="bg-card text-foreground rounded-xl border border-border/60 shadow-floating px-3 py-2 text-sm font-medium min-w-[160px]">
      <p className="font-bold mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-sky-500" /> {data.hora}</p>
      <p className="text-xs mb-1 flex items-center gap-1.5"><Tag className="w-3.5 h-3.5 text-amber-500" /> {formatTipo}</p>
      <p className="font-bold flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-violet-500" /> Asistencias: {data.cantidad}</p>
    </div>
  );
};
