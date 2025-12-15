"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";

import { MembersStatus } from "./stats/MembersStatus";
import { TipoPlan, planesPorProfesor } from "@/models/stats/plan";
import { Factura } from "@/models/stats/factura";
import { PromedioAsistencias as Promedio, PromedioAsistencias } from "@/models/stats/AverageAssists";
import { DashboardData } from "@/models/stats/dashboardData";

import dayjs from "dayjs";
import 'dayjs/locale/es';
import { MonthlyBilling } from "./stats/MonthlyBilling";
import { MembersYearsOld } from "./stats/MembersYearsOld";
import { MembersPlan } from "./stats/MembersPlan";
import { Assits } from "./stats/Assits";
import { AverageAssits } from "./stats/AverageAssits";
import { PlansByTeacher } from "./stats/PlansByTeacher";
import { BillingBoxes } from "@/components/dashboard/administrator/stats/BillingBoxes";
import { DashboardSkeleton } from "./stats/DashboardSkeleton";

dayjs.locale('es');

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

  const [edadesPorTipo, setEdadesPorTipo] = useState<{
    gimnasio?: Record<string, number>
    clase?: Record<string, number>
  } | null>(null);

  const [selectedMonthPersonalizados, setSelectedMonthPersonalizados] = useState(() => (dayjs().month() + 1).toString());
  const [selectedYearFacturacion, setSelectedYearFacturacion] = useState<number>(
    new Date().getFullYear()
  );
  const [selectedMonthCajas, setSelectedMonthCajas] = useState(() => (dayjs().month() + 1).toString());
  const [selectedYearPersonalizados, setSelectedYearPersonalizados] = useState<number>(new Date().getFullYear());
  const [asistenciasPorHora, setAsistenciasPorHora] = useState<{ hora: string; cantidad: number }[]>([]);

  const [cajasDelMes, setCajasDelMes] = useState([]);
  const [planesPorProfesor, setPlanesPorProfesor] = useState<planesPorProfesor[]>([]);
  const [facturacionData, setFacturacionData] = useState<Factura[]>([]);

  const [promedios, setPromedios] = useState<PromedioAsistencias[]>([
    { rango: "Mañana (7-12hs)", promedio: 0 },
    { rango: "Tarde (15-18hs)", promedio: 0 },
    { rango: "Noche (18-22hs)", promedio: 0 },
  ]);

  const cajasTransformadas = Array.isArray(cajasDelMes) && cajasDelMes.length
    && ('tarde_monto' in cajasDelMes[0] || 'mañana_monto' in cajasDelMes[0])
    ? cajasDelMes
    : [];

  const fetchFacturacion = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/facturacion`,
        { params: { anio: selectedYearFacturacion } }
      );
      setFacturacionData(res.data.facturacion ?? []);
    } catch (error) {
      console.error("Error al cargar facturación:", error);
    }
  };

  const fetchDashboard = async () => {
    try {
      const params: any = {
        fecha: dayjs(selectedDate).format("YYYY-MM-DD"),
        mesCajas: Number(selectedMonthCajas),
        anioCajas: selectedYear,
        mesPersonalizados: Number(selectedMonthPersonalizados),
        anioPersonalizados: selectedYearPersonalizados,
        anioFacturacion: selectedYearFacturacion,
      };

      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/rpc`,
        { params }
      );

      setDashboardData(res.data);

      console.log("Datos del dashboard:", res.data.estado);
      const apH = Object.entries(res.data.asistenciasPorHora ?? {}).map(
        ([hora, cantidad]) => ({ hora, cantidad: Number(cantidad) })
      );
      setAsistenciasPorHora(apH);

      setPromedios([
        { rango: "Mañana (7-12hs)", promedio: Number(res.data.promedios?.manana?.promedio ?? 0) },
        { rango: "Tarde (15-18hs)", promedio: Number(res.data.promedios?.tarde?.promedio ?? 0) },
        { rango: "Noche (18-22hs)", promedio: Number(res.data.promedios?.noche?.promedio ?? 0) },
      ]);

      setPlanesPorProfesor(res.data.personalizadosPorProfesor ?? []);
      setCajasDelMes(res.data.cajasDelMes ?? []);
    } catch (error) {
      console.error("Error al cargar dashboard:", error);
    } finally {
    }
  };

  const fetchEdadesDistribucion = async () => {
    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/dashboard/edades/distribucion`,
        {
          params: {
            fecha: dayjs(selectedDate).format("YYYY-MM-DD"),
          },
        }
      );

      setEdadesPorTipo(res.data);
    } catch (error) {
      console.error("Error al cargar distribución de edades:", error);
    }
  };

  useEffect(() => {
    fetchDashboard();
    fetchEdadesDistribucion();
  }, [selectedDate, selectedMonthPersonalizados, selectedYearPersonalizados, selectedMonthCajas, selectedYear]);

  useEffect(() => {
    fetchFacturacion();
  }, [selectedYearFacturacion]);

  if (!isVisible) return null;

  if (!dashboardData) {
    return <DashboardSkeleton />;
  }

  const { planes } = dashboardData;

  const planesFiltrados = planes.filter((p) =>
    tipoPlan === "TODOS" ? true : p.tipo === tipoPlan
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      <MembersStatus />

      <MembersYearsOld edades={edadesPorTipo ?? undefined} />

      <MembersPlan tipoPlan={tipoPlan} planesFiltrados={planesFiltrados} setTipoPlan={setTipoPlan} />

      <Assits

      />

      <AverageAssits/>

      <MonthlyBilling
        facturacionData={facturacionData}
        selectedYearFacturacion={selectedYearFacturacion}
        setSelectedYearFacturacion={setSelectedYearFacturacion}
      />

      <PlansByTeacher
        selectedYearPersonalizados={selectedYearPersonalizados}
        setSelectedYearPersonalizados={setSelectedYearPersonalizados}
        selectedMonthPersonalizados={selectedMonthPersonalizados}
        setSelectedMonthPersonalizados={setSelectedMonthPersonalizados}
        planesPorProfesor={planesPorProfesor}
      />

      <BillingBoxes/>
    </div>
  );
}
