export interface Pago {
  ID: string;
  "Socio DNI": string;
  Nombre: string;
  Monto: string;
  Metodo_de_Pago: string;
  Fecha_de_Pago: string;
  Fecha_de_Vencimiento: string;
  Responsable: string;
  Turno: string;
  Hora: string;
  Tipo: string;
}

export interface Member {
  Nombre: string;
  Plan: string;
  Fecha_vencimiento: string;
  Clases_restantes: number;
  Clases_pagadas: number;
  Precio: number;
  Tipo_de_plan: string;
  Pagos: Pago[];
  GymCoins: string | number;
}

export interface Clase {
  ID: string
  'Nombre de clase': string
  Dia: string
  Hora: string
  'Cupo maximo': string
  Inscriptos: string
  ProximaFecha?: string
}