import {
  getClasesElClubFromDB,
  inscribirAlumno,
  desuscribirAlumno,
  obtenerClasesConEstado
} from "../services/clases.service.js";

import dayjs from "dayjs"
import timezone from "dayjs/plugin/timezone.js"
import supabase from "../db/supabase.js";
dayjs.extend(timezone)

export const createClase = async (req, res) => {
  try {
    const { nombre_clase, dia, hora, cupo_maximo } = req.body;
    if (!nombre_clase || !dia || !hora || !cupo_maximo) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }
    const { data, error } = await supabase
      .from("clases")
      .insert({ nombre_clase, dia, hora, cupo_maximo: Number(cupo_maximo) })
      .select()
      .single();
    if (error) throw error;
    return res.status(201).json(data);
  } catch (error) {
    console.error("createClase:", error);
    return res.status(500).json({ message: "Error al crear la clase" });
  }
};

export const updateClaseProperties = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre_clase, dia, hora, cupo_maximo } = req.body;
    if (!nombre_clase || !dia || !hora || !cupo_maximo) {
      return res.status(400).json({ message: "Todos los campos son requeridos" });
    }
    const { data, error } = await supabase
      .from("clases")
      .update({ nombre_clase, dia, hora, cupo_maximo: Number(cupo_maximo) })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return res.status(200).json(data);
  } catch (error) {
    console.error("updateClaseProperties:", error);
    return res.status(500).json({ message: "Error al actualizar la clase" });
  }
};

export const deleteClase = async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from("clases")
      .delete()
      .eq("id", id);
    if (error) throw error;
    return res.status(200).json({ message: "Clase eliminada con éxito" });
  } catch (error) {
    console.error("deleteClase:", error);
    return res.status(500).json({ message: "Error al eliminar la clase" });
  }
};


const ARG_TZ = "America/Argentina/Buenos_Aires"

const RESPONSES = {
  dniRequired: { status: 400, message: "DNI requerido" },
  classIdRequired: { status: 400, message: "ID de clase requerido" },
  successSubscribe: "Inscripción realizada con éxito",
  successUnsubscribe: "Desuscripción realizada con éxito"
};

const sendError = (res, status, message) =>
  res.status(status).json({ message });

const sendSuccess = (res, payload) =>
  res.status(200).json(payload);


export const getClases = async (req, res) => {
  try {
    const clases = await getClasesElClubFromDB();
    return sendSuccess(res, clases);
  } catch (error) {
    console.error("getClases:", error);
    return sendError(res, 500, "Error al obtener clases");
  }
};

export const getClasesConEstado = async (req, res) => {
  try {
    const { dni } = req.params;
    if (!dni) return sendError(res, 400, RESPONSES.dniRequired.message);

    const clases = await obtenerClasesConEstado(dni);
    return sendSuccess(res, clases);
  } catch (error) {
    console.error("getClasesConEstado:", error);
    return sendError(res, 500, "Error al obtener clases");
  }
};

export const updateClaseElClubByID = async (req, res) => {
  try {
    const { id } = req.params;
    const { dni, desuscribir } = req.body;

    if (!dni) {
      return res.status(400).json({ message: "DNI requerido" });
    }

    const { data: clase } = await supabase
      .from("clases")
      .select("*")
      .eq("id", id)
      .single();

    if (!clase) {
      return res.status(404).json({ message: "Clase no encontrada" });
    }

    // 2️⃣ Día texto
    const DIA_NUM_A_TEXTO = {
      0: "Domingo",
      1: "Lunes",
      2: "Martes",
      3: "Miercoles",
      4: "Jueves",
      5: "Viernes",
      6: "Sabado",
    };

    const diaTexto = isNaN(Number(clase.dia))
      ? clase.dia
      : DIA_NUM_A_TEXTO[Number(clase.dia)];

    // 3️⃣ Próxima fecha
    const hoy = dayjs().tz(ARG_TZ);
    let proxima = hoy.day({
      Domingo: 0,
      Lunes: 1,
      Martes: 2,
      Miercoles: 3,
      Jueves: 4,
      Viernes: 5,
      Sabado: 6,
    }[diaTexto]);

    if (proxima.isBefore(hoy, "day")) {
      proxima = proxima.add(1, "week");
    }

    const proximaFechaDB = proxima.format("YYYY-MM-DD");
    const proximaFechaUI = proxima.format("D/M/YYYY");

    // 4️⃣ Fecha + hora real
    const classTime = dayjs.tz(
      `${proximaFechaDB} ${clase.hora}`,
      "YYYY-MM-DD HH:mm",
      ARG_TZ
    );

    const now = dayjs().tz(ARG_TZ);

    // 5️⃣ Buscar inscripción
    const { data: inscripcion } = await supabase
      .from("clases_inscripciones")
      .select("*")
      .eq("clase_id", id)
      .eq("alumno_dni", dni)
      .eq("fecha_clase", proximaFechaDB)
      .maybeSingle();

    // ======================
    // 🔴 DESUSCRIPCIÓN
    // ======================
    if (desuscribir) {
      if (!inscripcion) {
        return res.status(400).json({
          message: "No estás inscripto en esta clase",
        });
      }

      const minutosDesdeClase = now.diff(classTime, "minute");
      if (minutosDesdeClase > 60) {
        return res.status(400).json({
          message:
            "Solo podés desuscribirte hasta una hora después del inicio",
        });
      }

      await supabase
        .from("clases_inscripciones")
        .delete()
        .eq("id", inscripcion.id);

      return res.json({
        message: "Te desuscribiste correctamente de la clase",
      });
    }

    // ======================
    // 🟢 INSCRIPCIÓN
    // ======================
    if (inscripcion) {
      return res.status(409).json({
        message: "Ya estás inscripto en esta clase",
      });
    }

    const minutosParaClase = classTime.diff(now, "minute");
    if (minutosParaClase < 30) {
      return res.status(400).json({
        message: "La inscripción cierra 30 minutos antes de la clase",
      });
    }

    // Cupo
    const { count } = await supabase
      .from("clases_inscripciones")
      .select("*", { count: "exact", head: true })
      .eq("clase_id", id)
      .eq("fecha_clase", proximaFechaDB);

    if (count >= clase.cupo_maximo) {
      return res.status(400).json({
        message: "La clase ya alcanzó el cupo máximo",
      });
    }

    await supabase.from("clases_inscripciones").insert({
      clase_id: id,
      alumno_dni: dni,
      fecha_clase: proximaFechaDB,
    });

    return res.json({
      message: "Inscripción realizada con éxito",
    });
  } catch (error) {
    console.error("updateClaseElClubByID:", error);
    return res.status(500).json({
      message: "Error al procesar la solicitud",
    });
  }
};
