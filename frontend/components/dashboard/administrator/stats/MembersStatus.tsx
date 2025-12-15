"use client";

import {
  Card,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import dayjs from "dayjs";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { CustomTooltipAltasBajas } from "../tooltips/CustomTooltipAltasBajas";

const COLORS = ["#f97316", "#ef4444"];

type TipoPlan = "gimnasio" | "clase";
type TipoSlice = "altas" | "bajas";

interface Alumno {
  nombre: string;
  dni: string;
  plan: string;
  profesor?: string;
  fecha_inicio?: string;
  fecha_baja?: string;
}

export const MembersStatus = () => {
  const [open, setOpen] = useState(false);
  const [tipoPlan, setTipoPlan] = useState<TipoPlan>("gimnasio");
  const [data, setData] = useState<any>(null);
  const [selectedSlice, setSelectedSlice] = useState<TipoSlice | null>(null);
  const [alumnos, setAlumnos] = useState<Alumno[]>([]);
  const [filtroProfesor, setFiltroProfesor] = useState("");
  const inputProfesorRef = useRef<HTMLInputElement | null>(null);

  const [selectedMonth, setSelectedMonth] = useState<number>(
    new Date().getMonth() + 1
  );
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/altas-bajas`,
        {
          params: {
            anio: selectedYear,
            mes: selectedMonth,
          },
        }
      );
      setData(res.data);
      setSelectedSlice(null);
      setAlumnos([]);
      setFiltroProfesor("");
    };

    fetchData();
  }, [selectedMonth, selectedYear]);


  useEffect(() => {
    setSelectedSlice(null);
    setAlumnos([]);
    setFiltroProfesor("");
  }, [tipoPlan]);

  const pieData = data
    ? [
      {
        name: "Altas",
        key: "altas",
        value: data.totales.altas[tipoPlan],
      },
      {
        name: "Bajas",
        key: "bajas",
        value: data.totales.bajas[tipoPlan],
      },
    ]
    : [];

  const handleSliceClick = (slice: any) => {
    const key = slice.key as TipoSlice;

    setTimeout(() => {
      inputProfesorRef.current?.focus();
    }, 0);

    setSelectedSlice(key);
    setAlumnos(data[key][tipoPlan] ?? []);
    setFiltroProfesor("");
    setOpen(true);
  };


  const cantidad =
    selectedSlice === "altas"
      ? data?.altas?.[tipoPlan]?.length ?? 0
      : data?.bajas?.[tipoPlan]?.length ?? 0;

  const alumnosOrdenados = [...alumnos].sort((a, b) => {
    const fechaA =
      selectedSlice === "bajas" ? a.fecha_baja : a.fecha_inicio;
    const fechaB =
      selectedSlice === "bajas" ? b.fecha_baja : b.fecha_inicio;

    if (!fechaA || !fechaB) return 0;
    return dayjs(fechaB).valueOf() - dayjs(fechaA).valueOf();
  });

  const alumnosFiltrados = alumnosOrdenados.filter((a) => {
    if (!filtroProfesor.trim()) return true;
    return a.profesor
      ?.toLowerCase()
      .includes(filtroProfesor.toLowerCase());
  });

  const sinDatos =
    pieData.reduce((acc, i) => acc + Number(i.value || 0), 0) === 0;

  useEffect(() => {
    if (selectedSlice && alumnosFiltrados.length === 0) {
      inputProfesorRef.current?.focus();
    }
  }, [alumnosFiltrados.length, selectedSlice]);

  return (
    <>
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex flex-col items-center gap-2">
          <Users className="text-orange-500" />
          <CardTitle>Altas vs Bajas</CardTitle>
        </CardHeader>

        <div className="flex justify-center gap-2 px-4 mb-2 flex-wrap">
          {/* TIPO PLAN */}
          <Select
            value={tipoPlan}
            onValueChange={(v) => setTipoPlan(v as "gimnasio" | "clase")}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gimnasio">Gimnasio</SelectItem>
              <SelectItem value="clase">Clase</SelectItem>
            </SelectContent>
          </Select>

          {/* MES */}
          <Select
            value={String(selectedMonth)}
            onValueChange={(v) => setSelectedMonth(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Enero</SelectItem>
              <SelectItem value="2">Febrero</SelectItem>
              <SelectItem value="3">Marzo</SelectItem>
              <SelectItem value="4">Abril</SelectItem>
              <SelectItem value="5">Mayo</SelectItem>
              <SelectItem value="6">Junio</SelectItem>
              <SelectItem value="7">Julio</SelectItem>
              <SelectItem value="8">Agosto</SelectItem>
              <SelectItem value="9">Septiembre</SelectItem>
              <SelectItem value="10">Octubre</SelectItem>
              <SelectItem value="11">Noviembre</SelectItem>
              <SelectItem value="12">Diciembre</SelectItem>
            </SelectContent>
          </Select>

          {/* AÑO */}
          <Select
            value={String(selectedYear)}
            onValueChange={(v) => setSelectedYear(Number(v))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[2023, 2024, 2025, 2026].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {sinDatos ? (
          <div className="h-[280px] flex items-center justify-center text-sm text-muted-foreground">
            No hay datos para el período seleccionado
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={0}
                  stroke="none"
                  onClick={handleSliceClick}
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} cursor="pointer" stroke="none" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltipAltasBajas tipoPlan={tipoPlan} />} />
              </PieChart>
            </ResponsiveContainer>

            <p className="text-center text-xs text-muted-foreground mt-1 mb-3">
              Hacé click en el gráfico para ver el detalle de alumnos
            </p>
          </>
        )}
      </Card>

      {/* MODAL */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          className="
      p-0
      h-[70vh] w-[90vw]
      rounded-lg
      md:h-auto md:max-w-4xl md:rounded-lg
      overflow-y-auto md:overflow-hidden
    "
        >
          {/* HEADER */}
          <DialogHeader className="px-4 py-3 border-b sticky top-0 bg-background z-20">
            <DialogTitle className="flex flex-wrap items-center justify-center gap-2 ">
              <span className="text-base md:text-lg font-semibold">
                Altas y Bajas de Alumnos
              </span>

              {selectedSlice && (
                <span
                  className={`text-xs md:text-sm px-2 md:px-3 py-1 rounded-full font-bold ${selectedSlice === "altas"
                    ? "bg-orange-100 text-orange-900"
                    : "bg-red-100 text-red-700"
                    }`}
                >
                  {cantidad}{" "}
                  {cantidad === 1
                    ? selectedSlice === "altas"
                      ? "Alta"
                      : "Baja"
                    : selectedSlice === "altas"
                      ? "Altas"
                      : "Bajas"}{" "}
                  · {tipoPlan}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* BODY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 min-h-[550px]">
            <div className="flex flex-col items-center justify-center">
              <ResponsiveContainer width="100%" height={200} className="md:h-[260px]">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={95}
                    stroke="none"
                    onClick={handleSliceClick}
                  >
                    {pieData.map((_, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i]}
                        cursor="pointer"
                        stroke="none"
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipAltasBajas tipoPlan={tipoPlan} />} />
                </PieChart>
              </ResponsiveContainer>

              <p className="text-xs text-muted-foreground mt-2 text-center">
                Tocá Altas o Bajas para ver el detalle
              </p>
            </div>

            <div className="md:col-span-2">
              {!selectedSlice ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
                  Seleccioná una porción del gráfico para ver los alumnos
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="px-4 py-3 border-b bg-background dark:bg-gray-900 z-10">
                    <h2 className="mb-2">
                      Filtrar por profesor:
                    </h2>
                    <input

                      ref={inputProfesorRef}
                      type="text"
                      placeholder="Filtrar por profesor…"
                      value={filtroProfesor}
                      onChange={(e) => setFiltroProfesor(e.target.value)}
                      className="
                  w-full rounded-md border px-3 py-2 text-sm
                  focus:outline-none focus:ring-2 focus:ring-orange-500
                  dark:bg-gray-800 dark:border-gray-600 dark:text-white
                  border-none
                "
                    />
                  </div>

                  {alumnosFiltrados.length === 0 ? (
                    <div className="p-6 flex flex-col items-center gap-2 text-sm text-muted-foreground min- text-center">
                      <span>No hay alumnos que coincidan con este profesor.</span>
                      <button
                        onClick={() => {
                          setFiltroProfesor("");
                          inputProfesorRef.current?.focus();
                        }}
                        className="text-orange-600 text-xs underline"
                      >
                        Limpiar filtro
                      </button>
                    </div>
                  ) : (
                    <ul className="divide-y max-h-[400px] overflow-y-auto">
                      {alumnosFiltrados.map((a) => (
                        <li
                          key={a.dni}
                          className="px-4 py-3 flex justify-between items-center hover:bg-muted/40 transition"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-sm">{a.nombre}</span>
                            <span className="text-xs text-muted-foreground">
                              {a.plan}
                              {a.profesor && ` · Profesor: ${a.profesor}`}
                            </span>
                          </div>

                          <div className="text-xs text-muted-foreground text-right">
                            {selectedSlice === "altas" && a.fecha_inicio && (
                              <>Inicio: {dayjs(a.fecha_inicio).format("DD/MM/YYYY")}</>
                            )}
                            {selectedSlice === "bajas" && a.fecha_baja && (
                              <>Baja: {dayjs(a.fecha_baja).format("DD/MM/YYYY")}</>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </>
  );


};
