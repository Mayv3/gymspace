export interface Asistencia {
    hora: string;
    cantidad: number;
}

export interface AssitsProps {
    selectedDate: Date;
    setSelectedDate: (date: Date) => void;
    asistencias?: Asistencia[];
}