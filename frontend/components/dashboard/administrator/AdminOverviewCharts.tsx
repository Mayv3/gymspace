"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  TooltipProps,
} from "recharts";
import { DatePicker } from "@/components/dashboard/date-picker";
import axios from "axios";
import {
  Users,
  CalendarCheck,
  PieChart as PieIcon,
  DollarSign,
} from "lucide-react";
import { PlanSelect } from "@/components/PlanSelect";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { Tooltip as TooltipUI, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { Info } from "lucide-react";

import dayjs from "dayjs";
import 'dayjs/locale/es';
dayjs.locale('es');

const COLORS = [
  "#FFB74D",
  "#FFA726",
  "#FF9800",
  "#FB8C00",
  "#F57C00",
  "#EF6C00",
  "#E65100",
  "#BF360C",
];

// --- Interfaces para tipar datos ---
interface EstadoData {
  activos: number;
  vencidos: number;
  abandonos: number;
}

interface Plan {
  plan: string;
  cantidad: number;
  tipo: "GIMNASIO" | "CLASE";
}

interface Factura {
  mes: string;
  gimnasio: number;
  clase: number;
}

type TipoPlan = "TODOS" | "GIMNASIO" | "CLASE";

interface Promedio {
  rango: string;
  promedio: number;
}

interface planesPorProfesor {
  profesor: string;
  cantidad: number;
  alumnos: string[];
}

interface DashboardData {
  estado: EstadoData;
  edades: Record<string, number>;
  planes: Plan[];
  asistenciasPorHora: Record<string, number>;
  facturacion: Factura[];
  planesPorProfesor: planesPorProfesor[];
  cajasDelMes: { turno: string; monto: number }[];
}

const CustomTooltip: React.FC<TooltipProps<number, string> & {
  explicaciones?: Record<string, string>;
}> = ({ active, payload, label, explicaciones = {} }) => {
  if (active && payload && payload.length) {
    const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");

    return (
      <div className="p-2 rounded-md shadow text-sm border w-max max-w-[240px]"
        style={{
          backgroundColor: isDark ? "hsl(220, 14%, 20%)" : "#fff",
          color: isDark ? "hsl(0, 0%, 95%)" : "#000",
        }}>
        {payload.length > 1 ? (
          payload.map((entry, index) => (
            <div key={index} className="mb-1">
              <p className="font-semibold" style={{ color: isDark ? "hsl(30, 100%, 70%)" : "#000" }}>
                {entry.name} : ${entry.value}
              </p>
            </div>
          ))
        ) : (
          <>
            <p className="font-semibold mb-1">{payload[0].name}: {payload[0].value}</p>
            {explicaciones[payload[0].payload.estado ?? ""] && (
              <p className="text-muted-foreground">{explicaciones[payload[0].payload.estado]}</p>
            )}
          </>
        )}
      </div>
    );
  }
  return null;
};

const CustomTooltipCajas: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;

  const montoManiana = data["mañana_monto"] || 0;
  const montoTarde = data["tarde_monto"] || 0;
  const totalDia = montoManiana + montoTarde;

  return (
    <div className="p-2 rounded-md shadow text-sm border bg-white dark:bg-gray-800 dark:text-white">
      <p className="font-bold mb-1">📅 {data.fecha}</p>

      {["mañana", "tarde"].map((turno) => (
        data[`${turno}_monto`] !== undefined && (
          <div key={turno} className="mb-2">
            <p className="font-semibold capitalize">{turno}</p>
            <ul className="ml-2 text-xs">
              <li>🔹 Inicial: ${data[`${turno}_saldoInicial`] ?? 0}</li>
              <li>💵 Efectivo: ${data[`${turno}_efectivo`] ?? 0}</li>
              <li>💳 Tarjeta: ${data[`${turno}_tarjeta`] ?? 0}</li>
              <li>💰 Final: ${data[`${turno}_monto`] ?? 0}</li>
            </ul>
          </div>
        )
      ))}

      <div className="border-t mt-2 pt-2 text-sm font-semibold">
        🧾 Total del día: ${totalDia}
      </div>
    </div>
  );
};


export default function AdminOverviewCharts({
  isVisible,
}: {
  isVisible: boolean;
}) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [tipoPlan, setTipoPlan] = useState<TipoPlan>("TODOS");
  const [selectedYear, setSelectedYear] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedFecha, setSelectedFecha] = useState<Date | null>(null);
  const [selectedMonthPersonalizados, setSelectedMonthPersonalizados] = useState<string>("");

  const [selectedMonthCajas, setSelectedMonthCajas] = useState<string>("");
  const [selectedYearPersonalizados, setSelectedYearPersonalizados] = useState<number>(new Date().getFullYear());
  const [asistenciasPorHora, setAsistenciasPorHora] = useState<{ hora: string; cantidad: number }[]>([]);
  const [promedios, setPromedios] = useState<Promedio[]>([
    { rango: "Mañana (7-12hs)", promedio: 0 },
    { rango: "Tarde (15-18hs)", promedio: 0 },
    { rango: "Noche (18-22hs)", promedio: 0 },
  ]);
  const [cajasDelMes, setCajasDelMes] = useState([]);
  const [planesPorProfesor, setPlanesPorProfesor] = useState<planesPorProfesor[]>([]);

  const fetchDashboard = async () => {
    try {
      const params: any = {
        fecha: dayjs(selectedDate).format("YYYY-MM-DD"),
        mesCajas: selectedMonthCajas,
        anioCajas: selectedYear,
      };
      if (selectedMonthPersonalizados) {
        params.mesPersonalizados = selectedMonthPersonalizados;
      }
      if (selectedYearPersonalizados) {
        params.anioPersonalizados = selectedYearPersonalizados;
      }

      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard`, { params });
      setDashboardData(res.data);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    }
  };

  const fetchPromedios = async () => {
    try {
      const params: any = {
        anio: selectedYear,
      };

      if (selectedMonth) params.mes = Number(selectedMonth);
      if (selectedFecha) params.fecha = dayjs(selectedFecha).format("YYYY-MM-DD");

      const res = await axios.get<{
        manana: { promedio: string };
        tarde: { promedio: string };
        noche: { promedio: string };
      }>(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias/promedios`, { params });

      setPromedios([
        { rango: "Mañana (7-12hs)", promedio: Number(res.data.manana.promedio) },
        { rango: "Tarde (15-18hs)", promedio: Number(res.data.tarde.promedio) },
        { rango: "Noche (18-22hs)", promedio: Number(res.data.noche.promedio) },
      ]);
    } catch (error) {
      console.error("Error al cargar promedios:", error);
    }
  };

  const fetchAsistenciasPorHora = async () => {
    try {
      const fecha = dayjs(selectedDate);
      const dia = fecha.date();
      const mes = fecha.month() + 1;
      const anio = fecha.year();

      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/asistencias/por-hora/${dia}/${mes}/${anio}`);

      const data = Object.entries(res.data).map(([hora, cantidad]) => ({
        hora,
        cantidad: Number(cantidad),
      }));
      console.log(`${dia}/${mes}/${anio}`, data)
      setAsistenciasPorHora(data);
    } catch (error) {
      console.error("Error al cargar asistencias por hora:", error);
    }
  };

  const fetchCajasDelMes = async () => {
    const hoy = dayjs();
    const mes = selectedMonthCajas || (hoy.month() + 1).toString();
    const anio = selectedYear || hoy.year();

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/caja/mes`, {
        params: { mes, anio },
      });
      console.log("caja:", JSON.stringify(cajasDelMes, null, 2));
      setCajasDelMes(res.data);
    } catch (error) {
      console.error("Error al cargar cajas del mes:", error);
    }
  };

  const fetchPlanesPersonalizados = async () => {
    const hoy = dayjs();
    const mes = selectedMonthPersonalizados || (hoy.month() + 1).toString();
    const anio = selectedYearPersonalizados || hoy.year();

    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/planes/personalizados`, {
        params: { mes, anio },
      });
      setPlanesPorProfesor(res.data);
    } catch (error) {
      console.error("Error al cargar planes personalizados por profesor:", error);
    }
  };

  const cajasTransformadas = cajasDelMes.reduce((acc: any[], caja: any) => {
    const fecha = dayjs(caja.Fecha, "D/M/YYYY", true).isValid()
      ? dayjs(caja.Fecha, "D/M/YYYY").format("D/M/YYYY")
      : caja.Fecha;

    const turno = caja.Turno?.toLowerCase();
    const monto = Number(caja["Total Final"]?.replace(/\./g, "").replace(",", ".")) || 0;

    let existente = acc.find((item) => item.fecha === fecha);

    if (!existente) {
      existente = {
        fecha,
        mañana_monto: 0,
        tarde_monto: 0,
        mañana_saldoInicial: 0,
        tarde_saldoInicial: 0,
        mañana_efectivo: 0,
        tarde_efectivo: 0,
        mañana_tarjeta: 0,
        tarde_tarjeta: 0,
      };
      acc.push(existente);
    }

    existente[`${turno}_monto`] = monto;
    existente[`${turno}_saldoInicial`] = Number(caja["Saldo Inicial"]) || 0;
    existente[`${turno}_efectivo`] = Number(caja["Total Efectivo"]) || 0;
    existente[`${turno}_tarjeta`] = Number(caja["Total Tarjeta"]) || 0;

    return acc;
  }, []);


  useEffect(() => {
    fetchPlanesPersonalizados();
  }, [selectedMonthPersonalizados, selectedYearPersonalizados]);

  useEffect(() => {
    fetchAsistenciasPorHora();
  }, [selectedDate]);

  useEffect(() => {
    fetchPromedios();
  }, [selectedYear, selectedMonth, selectedFecha]);

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate, selectedMonthPersonalizados, selectedYearPersonalizados, selectedMonthCajas, selectedYear]);

  useEffect(() => {
    fetchCajasDelMes();
  }, [selectedMonthCajas, selectedYear]);
  if (!dashboardData) return null;

  const { estado, edades, planes, facturacion } = dashboardData;

  const estadoArray = [
    { estado: "Activos", cantidad: estado.activos },
    { estado: "Vencidos", cantidad: estado.vencidos },
    { estado: "Abandonos", cantidad: estado.abandonos },
  ];

  const estadoExplicaciones = {
    Activos: "Alumnos con plan vigente y clases disponibles.",
    Vencidos: "Alumnos cuyo plan venció hace menos de 30 días.",
    Abandonos: "Alumnos con plan vencido hace más de 30 días.",
  };

  const edadDistribucion = Object.entries(edades).map(([edad, cantidad]) => ({
    edad: Number(edad),
    cantidad,
  }));

  const planesFiltrados = planes.filter((p) =>
    tipoPlan === "TODOS" ? true : p.tipo === tipoPlan
  );
  
  return (
    <div
      className={
        isVisible ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" : "hidden"
      }
    >
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <Users className="text-orange-500" />
          <CardTitle>Alumnos Activos vs Vencidos vs Abandonos</CardTitle>
        </CardHeader>
        <CardContent>
          {estadoArray.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay datos disponibles.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={estadoArray}>
                <XAxis dataKey="estado" />
                <YAxis />
                <Tooltip content={<CustomTooltip explicaciones={estadoExplicaciones} />} />
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                  {estadoArray.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. Distribución por Edad */}

      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <CalendarCheck className="text-orange-500" />
          <CardTitle>Distribución por Edad</CardTitle>
        </CardHeader>
        <CardContent>
          {edadDistribucion.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay datos disponibles.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={edadDistribucion}>
                <XAxis dataKey="edad" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                  {edadDistribucion.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 3. Alumnos por Plan */}
      <Card className="shadow-lg hover:shadow-xl transition-all">
        <CardHeader className="flex items-center gap-2">
          <PieIcon className="text-orange-500" />
          <CardTitle>Alumnos por Plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-end mb-2">
            <div className="w-[140px]">
              <PlanSelect tipoPlan={tipoPlan} setTipoPlan={setTipoPlan} />
            </div>
          </div>
          {planesFiltrados.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay datos disponibles.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={planesFiltrados}
                  dataKey="cantidad"
                  nameKey="plan"
                  outerRadius={80}
                  label
                >
                  {planesFiltrados.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 4. Asistencias por Hora */}
      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
        <CardHeader className="flex items-center flex-col">
          <div className="flex flex-col items-center pb-4">
            <Users className="text-orange-500" />
            <CardTitle>Asistencias por Hora</CardTitle>
          </div>
          <div className="flex justify-end w-full">
            <div className="w-auto">
              <DatePicker date={selectedDate} setDate={setSelectedDate} />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={asistenciasPorHora}>
              <XAxis dataKey="hora" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="cantidad"
                stroke={COLORS[0]}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 5. Promedio por Rango */}
      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-col">
          <div className="flex items-center flex-col pb-4">
            <CalendarCheck className="text-orange-500" />
            <CardTitle>Promedio por Año ({selectedYear})</CardTitle>
          </div>
          <div className="flex flex-wrap justify-between">
            <div className="flex gap-2">
              <div className="w-[100px]">
                <Select
                  value={selectedYear.toString()}
                  onValueChange={(val) => setSelectedYear(Number(val))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Año" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                    <SelectItem value="2026">2026</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Mes */}
              <div className="w-[100px]">
                <Select
                  value={selectedMonth}
                  onValueChange={(val) => setSelectedMonth(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Mes" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i} value={(i + 1).toString()}>
                        {dayjs().month(i).locale("es").format("MMMM")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Fecha */}
            <div className="flex flex-col w-[160px]">
              <TooltipProvider>
                <div className="flex items-center gap-2">
                  <DatePicker date={selectedFecha ?? undefined} setDate={setSelectedFecha} />
                  <TooltipUI>
                    <TooltipTrigger asChild>
                      <Info className="text-muted-foreground cursor-pointer w-4 h-4" />
                    </TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-sm max-w-[220px] text-center">
                        Se mostrará el promedio de asistencias desde esta fecha hasta 7 días atrás.
                      </p>
                    </TooltipContent>
                  </TooltipUI>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={promedios}>
              <XAxis dataKey="rango" />
              <YAxis />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="promedio" radius={[10, 10, 0, 0]}>
                {promedios.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 6. Facturación Mensual */}
      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-3">
        <CardHeader className="flex items-center gap-2">
          <DollarSign className="text-orange-500" />
          <CardTitle>Facturación Mensual: Gimnasio y Clases</CardTitle>
        </CardHeader>
        <CardContent>
          {facturacion.every(f => f.gimnasio === 0 && f.clase === 0) ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay datos de facturación para este año.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={facturacion}>
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="gimnasio" name="Gimnasio" radius={[10, 10, 0, 0]}>
                  {facturacion.map((_, i) => (
                    <Cell key={i} fill={COLORS[0]} />
                  ))}
                </Bar>
                <Bar dataKey="clase" name="Clases" radius={[10, 10, 0, 0]}>
                  {facturacion.map((_, i) => (
                    <Cell key={i} fill={COLORS[2]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-1">
        <CardHeader className="flex flex-col">
          <div className="flex items-center flex-col pb-4">
            <CalendarCheck className="text-orange-500" />
            <CardTitle>Planes Personalizados por Profesor</CardTitle>
          </div>

          <div className="flex justify-end gap-4 w-full">
            <div className="w-[100px]">
              <Select
                value={selectedYearPersonalizados.toString()}
                onValueChange={(val) => setSelectedYearPersonalizados(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[120px] flex items-center gap-2">
              <Select
                value={selectedMonthPersonalizados}
                onValueChange={(val) => setSelectedMonthPersonalizados(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {dayjs().month(i).locale("es").format("MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <TooltipProvider>
                <TooltipUI>
                  <TooltipTrigger asChild>
                    <Info className="text-muted-foreground cursor-pointer w-4 h-4" />
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-sm max-w-[220px] text-center">
                      Se muestran la cantidad de alumnos de tipo GIMNASIO con plan PERSONALIZADO
                      que pagaron en el mes y año seleccionado con cada profesor.
                    </p>
                  </TooltipContent>
                </TooltipUI>
              </TooltipProvider>
            </div>


          </div>
        </CardHeader>

        <CardContent>
          {!planesPorProfesor ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay planes personalizados para esta fecha.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={planesPorProfesor}>
                <XAxis dataKey="profesor" />
                <YAxis />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cantidad" radius={[10, 10, 0, 0]}>
                  {planesPorProfesor.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-lg hover:shadow-xl transition-all col-span-1 md:col-span-2 xl:col-span-2">
        <CardHeader className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-col">
            <DollarSign className="text-orange-500" />
            <CardTitle>Cajas registradas por año y mes </CardTitle>
          </div>

          <div className="flex justify-end gap-4 w-full">
            <div className="w-[100px]">
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Año" />
                </SelectTrigger>
                <SelectContent>
                  {["2024", "2025", "2026"].map((anio) => (
                    <SelectItem key={anio} value={anio}>
                      {anio}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[120px]">
              <Select
                value={selectedMonthCajas}
                onValueChange={(val) => setSelectedMonthCajas(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Mes" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i} value={(i + 1).toString()}>
                      {dayjs().month(i).locale("es").format("MMMM")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {cajasTransformadas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center mt-8">
              No hay datos disponibles para el mes seleccionado.
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cajasTransformadas}>
                <XAxis dataKey="fecha" />
                <YAxis />
                <Tooltip content={<CustomTooltipCajas  />} />
                <Line
                  type="monotone"
                  dataKey="tarde_monto"
                  name="Tarde"
                  stroke={COLORS[4]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="mañana_monto"
                  name="Mañana"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 4 }} p
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
