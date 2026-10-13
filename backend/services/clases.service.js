// Clases del Club
import dayjs from 'dayjs';
import supabase from '../db/supabase.js';

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
    const { data: clases, error } = await supabase
        .from("clases")
        .select("id, nombre_clase, dia, hora, cupo_maximo")
        .order("dia", { ascending: true })
        .order("hora", { ascending: true });

    if (error) {
        console.error(error);
        throw error;
    }

    const hoy = dayjs().format("YYYY-MM-DD");
    const maxFecha = dayjs().add(7, "day").format("YYYY-MM-DD");

    const { data: inscripciones } = await supabase
        .from("clases_inscripciones")
        .select("clase_id, alumno_dni, fecha_clase")
        .gte("fecha_clase", hoy)
        .lte("fecha_clase", maxFecha);

    const { data: alumnos } = await supabase
        .from("alumnos")
        .select("dni, nombre");

    const alumnosMap = Object.fromEntries(
        alumnos.map(a => [a.dni, a.nombre])
    );

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


export async function inscribirAlumno({ claseId, dni }) {
    const clase = await getClaseById(claseId);
    if (!clase) throw new Error("Clase no existe");

    const fecha = calcularProximaFecha(clase.dia_semana);

    const { count } = await supabase
        .from("clases_inscripciones")
        .select("*", { count: "exact", head: true })
        .eq("clase_id", claseId)
        .eq("fecha_clase", fecha);

    if (count >= clase.cupo_maximo) {
        throw new Error("Cupo completo");
    }

    const { data: existe } = await supabase
        .from("clases_inscripciones")
        .select("id")
        .eq("clase_id", claseId)
        .eq("alumno_dni", dni)
        .eq("fecha_clase", fecha)
        .maybeSingle();

    if (existe) {
        throw new Error("Ya inscripto");
    }

    return supabase.from("clases_inscripciones").insert({
        clase_id: claseId,
        alumno_dni: dni,
        fecha_clase: fecha
    });
}

export async function desuscribirAlumno({ claseId, dni }) {
    const clase = await getClaseById(claseId);
    const fecha = calcularProximaFecha(clase.dia_semana);

    return supabase
        .from("clases_inscripciones")
        .delete()
        .eq("clase_id", claseId)
        .eq("alumno_dni", dni)
        .eq("fecha_clase", fecha);
}

export async function obtenerClasesConEstado(dni) {
    const { data: clases } = await supabase
        .from("clases")
        .select("*")
        .eq("activa", true);

    return Promise.all(
        clases.map(async (clase) => {
            const fecha = calcularProximaFechaClase(clase.dia_semana);

            const { count } = await supabase
                .from("clases_inscripciones")
                .select("*", { count: "exact", head: true })
                .eq("clase_id", clase.id)
                .eq("fecha_clase", fecha);

            const { data: inscripto } = await supabase
                .from("clases_inscripciones")
                .select("id")
                .eq("clase_id", clase.id)
                .eq("alumno_dni", dni)
                .eq("fecha_clase", fecha)
                .maybeSingle();

            return {
                ...clase,
                fecha_clase: fecha,
                inscriptos: count,
                cupos_disponibles: clase.cupo_maximo - count,
                esta_inscripto: Boolean(inscripto)
            };
        })
    );
}
