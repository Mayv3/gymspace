// Clases del Club
import dayjs from 'dayjs';
import supabase from '../db/supabase.js';
import { findNombresByDNIs } from './alumnos.service.js';

const DIA_NUM_A_TEXTO = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miercoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sabado",
};

function calcularProximaFecha(diaTexto) {
    const map = {
        Domingo: 0,
        Lunes: 1,
        Martes: 2,
        Miercoles: 3,
        Jueves: 4,
        Viernes: 5,
        Sabado: 6,
    };

    const hoy = dayjs();
    const objetivo = map[diaTexto];

    let proxima = hoy.day(objetivo);
    if (proxima.isBefore(hoy, "day")) {
        proxima = proxima.add(1, "week");
    }

    return proxima.format("D/M/YYYY");
}

export async function getClasesElClubFromDB() {
    const hoy = dayjs().format("YYYY-MM-DD");
    const maxFecha = dayjs().add(7, "day").format("YYYY-MM-DD");

    const [{ data: clases, error }, { data: inscripciones }] = await Promise.all([
        supabase
            .from("clases")
            .select("id, nombre_clase, dia, hora, cupo_maximo")
            .order("dia", { ascending: true })
            .order("hora", { ascending: true }),
        supabase
            .from("clases_inscripciones")
            .select("clase_id, alumno_dni, fecha_clase")
            .gte("fecha_clase", hoy)
            .lte("fecha_clase", maxFecha),
    ]);

    if (error) {
        console.error(error);
        throw error;
    }

    const dnisInscriptos = [...new Set((inscripciones || []).map(i => i.alumno_dni))];
    const alumnosMap = await findNombresByDNIs(dnisInscriptos);

    const inscPorClase = {};
    for (const i of inscripciones || []) {
        const key = `${i.clase_id}|${i.fecha_clase}`;

        if (!inscPorClase[key]) inscPorClase[key] = [];
        inscPorClase[key].push(i.alumno_dni);
    }

    return clases.map(c => {
        const diaTexto = isNaN(Number(c.dia))
            ? c.dia
            : DIA_NUM_A_TEXTO[Number(c.dia)];

        const proximaFecha = calcularProximaFecha(diaTexto);
        const proximaFechaISO = dayjs(proximaFecha, "D/M/YYYY").format("YYYY-MM-DD");
        const key = `${c.id}|${proximaFechaISO}`;

        const dniList = inscPorClase[key] || [];

        const nombreList = dniList.map(
            dni => alumnosMap[dni] || `(DNI ${dni} no encontrado)`
        );

        return {
            ID: String(c.id),
            "Nombre de clase": c.nombre_clase,
            Dia: diaTexto,
            Hora: c.hora.slice(0, 5),
            "Cupo maximo": String(c.cupo_maximo),
            Inscriptos: dniList.join(", "),
            InscriptosNombres: nombreList.join(", "),
            ProximaFecha: proximaFecha,
        };
    });
}

