"use client";

import {
  Card,
  CardContent,
  CardTitle,
  CardHeader,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { CustomTooltipAverageAssists } from "../tooltips/CustomTooltipAverageAssists";
import { COLORS } from "./colors";
import dayjs from "dayjs";
import axios from "axios";
import { useEffect, useState } from "react";
import { CircularProgress } from "@mui/material";
import { useIsMobile } from "@/hooks/use-mobile";
import { AnnualCalendarModal } from "./AnnualCalendarModal";

type TipoPlan = "gimnasio" | "clase";
type Periodo = "30d" | "anual";

interface PromedioItem {
  rango: string;
  total: number;
  dias: number;
  promedio: number;
}

export const AverageAssits = () => {
  const [tipo, setTipo] = useState<TipoPlan>("gimnasio");
  const [periodo, setPeriodo] = useState<Periodo>("30d");
  const [loading, setLoading] = useState(false);
  const [promedios, setPromedios] = useState<PromedioItem[]>([]);
  const [openCalendar, setOpenCalendar] = useState(false);

  const isMobile = useIsMobile();

  const fetchPromedios = async () => {
    try {
      setLoading(true);

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/promedios-asistencias`,
        {
          params: {
            fecha: dayjs().format("YYYY-MM-DD"),
            periodo,
          },
        }
      );

      const data = res.data?.[tipo];

      if (!data) {
        setPromedios([
          { rango: "Mañana (7–12hs)", total: 0, dias: 0, promedio: 0 },
          { rango: "Tarde (15–18hs)", total: 0, dias: 0, promedio: 0 },
          { rango: "Noche (18–22hs)", total: 0, dias: 0, promedio: 0 },
        ]);
        return;
      }

      setPromedios([
        {
          rango: "Mañana (7–12hs)",
          total: Number(data.manana?.total ?? 0),
          dias: Number(data.manana?.dias ?? 0),
          promedio: Number(data.manana?.promedio ?? 0),
        },
        {
          rango: "Tarde (15–18hs)",
          total: Number(data.tarde?.total ?? 0),
          dias: Number(data.tarde?.dias ?? 0),
          promedio: Number(data.tarde?.promedio ?? 0),
        },
        {
          rango: "Noche (18–22hs)",
          total: Number(data.noche?.total ?? 0),
          dias: Number(data.noche?.dias ?? 0),
          promedio: Number(data.noche?.promedio ?? 0),
        },
      ]);
    } catch (e) {
      console.error("Error promedios asistencias:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromedios();
  }, [tipo, periodo]);

  return (
    <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
      <CardContent>
        <CardHeader className="flex flex-col items-center gap-2 pb-6">
          <CalendarCheck className="text-orange-500" />
          <CardTitle className="text-center">
            Promedio de asistencias
          </CardTitle>

          {/* SELECTORES */}
          <div className="flex gap-2 mt-2">
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoPlan)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gimnasio">Gimnasio</SelectItem>
                <SelectItem value="clase">Clase</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={periodo}
              onValueChange={(v) => setPeriodo(v as Periodo)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="anual">Anual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-1">
            Promedio diario de asistencias por franja horaria
          </p>
        </CardHeader>

        {loading ? (
          <div className="flex justify-center items-center h-[260px]">
            <CircularProgress size={32} sx={{ color: "#f97316" }} />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={promedios}>
              <XAxis dataKey="rango" hide={isMobile} />
              <YAxis allowDecimals={false} hide={isMobile} />
              <Tooltip
                content={<CustomTooltipAverageAssists />}
                offset={30}
                allowEscapeViewBox={{ x: false, y: false }}
              />
              <Bar dataKey="promedio" radius={[10, 10, 0, 0]}>
                {promedios.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
        {periodo === "anual" && (
          <div className="flex w-full justify-center">
            <button
              className="text-md text-white bg-orange-400 w-[50%] mt-4 rounded-md py-1 hover:bg-orange-500 transition"
              onClick={() => setOpenCalendar(true)}
            >
              Ver calendario anual
            </button>
          </div>
        )}

        <AnnualCalendarModal
          open={openCalendar}
          onClose={() => setOpenCalendar(false)}
          tipo={tipo}
        />
      </CardContent>
    </Card>
  );
};
