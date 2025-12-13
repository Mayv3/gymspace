import { Factura } from "./factura";
import { EstadoData } from "./memberState";
import { Plan, planesPorProfesor } from "./plan";

export interface DashboardData {
  estado: EstadoData;
  edades: Record<string, number>;
  planes: Plan[];
  asistenciasPorHora: Record<string, number>;
  facturacion: Factura[];
  planesPorProfesor: planesPorProfesor[];
  cajasDelMes: { turno: string; monto: number }[];
}