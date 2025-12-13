export type TipoPlan = "TODOS" | "GIMNASIO" | "CLASE";

export interface Plan {
    plan: string;
    cantidad: number;
    tipo: TipoPlan;
}

export interface planesPorProfesor {
    profesor: string;
    cantidad: number;
    alumnos?: string[];
}