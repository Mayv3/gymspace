export interface AlumnoRanking {
    DNI: string;
    Nombre: string;
    GymCoins: number;
    posicion?: number;
}

export interface TopAlumnosCoins {
    top10Clases: AlumnoRanking[];
    top10Gimnasio: AlumnoRanking[];
}