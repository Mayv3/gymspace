// Acceso a datos de planes y aumentos de planes (Supabase).

import dayjs from 'dayjs';
import timezone from "dayjs/plugin/timezone.js";
import utc from "dayjs/plugin/utc.js";
import supabase from '../db/supabase.js';

dayjs.extend(utc);
dayjs.extend(timezone);

export async function listPlanes() {
  const { data, error } = await supabase
    .from("planes")
    .select("*")
    .order("id", { ascending: true });

  if (error) throw error;

  return data.map((p) => ({
    ID: String(p.id),
    Tipo: p.tipo || "",
    "Plan o Producto": p.plan_o_producto || "",
    Precio: String(p.precio ?? 0),
    numero_Clases: String(p.numero_clases || ""),
    Coins: String(p.coins || ""),
  }));
}

export async function insertPlan(data) {
  const { data: inserted, error } = await supabase
    .from("planes")
    .insert([
      {
        tipo: data.Tipo,
        plan_o_producto: data["Plan o Producto"],
        precio: Number(data.Precio) || 0,
        numero_clases: Number(data.numero_Clases) || 0,
        coins: Number(data.Coins) || 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;

  return {
    ID: String(inserted.id),
    Tipo: inserted.tipo,
    "Plan o Producto": inserted.plan_o_producto,
    Precio: String(inserted.precio),
    numero_Clases: String(inserted.numero_clases),
    Coins: String(inserted.coins),
  };
}

export async function updatePlan(id, nuevosDatos) {
  const { data: planActual, error: getError } = await supabase
    .from("planes")
    .select("*")
    .eq("id", id)
    .single();

  if (getError) throw getError;
  if (!planActual) throw new Error("Plan no encontrado");

  const patch = {};
  if (nuevosDatos.Tipo !== undefined) patch.tipo = nuevosDatos.Tipo;
  if (nuevosDatos["Plan o Producto"] !== undefined)
    patch.plan_o_producto = nuevosDatos["Plan o Producto"];
  if (nuevosDatos.Precio !== undefined)
    patch.precio = Number(nuevosDatos.Precio) || 0;
  if (nuevosDatos.numero_Clases !== undefined)
    patch.numero_clases = Number(nuevosDatos.numero_Clases) || 0;
  if (nuevosDatos.Coins !== undefined)
    patch.coins = Number(nuevosDatos.Coins) || 0;

  const { data: planNuevo, error } = await supabase
    .from("planes")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;

  // 👇 Solo registrar aumento si cambió el precio
  if (patch.precio !== undefined && planActual.precio !== patch.precio) {
    const precioAnterior = Number(planActual.precio) || 0;
    const precioNuevo = Number(patch.precio) || 0;

    let porcentaje = 0;
    if (precioAnterior > 0) {
      porcentaje = ((precioNuevo - precioAnterior) / precioAnterior) * 100;
    }

    const { error: aumentoErr } = await supabase
      .from("aumentos_planes")
      .insert([
        {
          fecha: new Date().toISOString().split("T")[0],
          precio_anterior: precioAnterior,
          precio_actualizado: precioNuevo,
          porcentaje_aumento: parseFloat(porcentaje.toFixed(2)),
          plan: planNuevo.plan_o_producto,
        },
      ]);

    if (aumentoErr) throw aumentoErr;

    console.log(`Precio anterior vs nuevo: ${precioAnterior} → ${precioNuevo}`);
  }

  return true;
}

export async function removePlan(id) {
  const { error } = await supabase.from("planes").delete().eq("id", id);
  if (error) throw error;
  return true;
}

export async function listAumentosPlanes() {
  const { data, error } = await supabase
    .from("aumentos_planes")
    .select("*")
    .order("fecha", { ascending: false });

  if (error) throw error;

  return data.map((a) => ({
    Fecha: a.fecha ? dayjs(a.fecha).format("DD/MM/YYYY") : "",
    Precio_anterior: String(a.precio_anterior || ""),
    Precio_actualizado: String(a.precio_actualizado || ""),
    Porcentaje_aumento: `${a.porcentaje_aumento}%`,
    Plan: a.plan || "",
  }));
}

// Turnos
