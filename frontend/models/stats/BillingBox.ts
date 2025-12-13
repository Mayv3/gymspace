export interface CajaData {
    fecha: string;
    tarde_monto?: number;
    mañana_monto?: number;
    [key: string]: any;
}

export interface BillingBoxesProps {
    selectedYear: number;
    setSelectedYear: (year: number) => void;
    selectedMonthCajas: string;
    setSelectedMonthCajas: (month: string) => void;
    cajasTransformadas?: CajaData[];
}