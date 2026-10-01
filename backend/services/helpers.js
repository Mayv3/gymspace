// Utilidades compartidas por los servicios.

export function toInt(n, def = 0) {
  const v = Number(n);
  return Number.isFinite(v) ? v : def;
}

export function toISODate(dateStr) {
  if (!dateStr) return null;
  if (dateStr.includes("/")) {
    const [day, month, year] = dateStr.split("/");
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

export function formatDate(dateStr) {
  if (!dateStr) return "";
  if (dateStr.includes("-")) {
    const [year, month, day] = dateStr.split("-");
    return `${parseInt(day)}/${parseInt(month)}/${year}`;
  }
  return dateStr;
}

// Supabase devuelve como máximo 1000 filas por consulta y corta sin avisar.
// buildQuery debe devolver una consulta NUEVA con un orden determinístico (desempatar por id).
export async function fetchAllRows(buildQuery, pageSize = 1000) {
  const rows = [];
  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildQuery().range(from, from + pageSize - 1);
    if (error) throw error;
    rows.push(...data);
    if (data.length < pageSize) return rows;
  }
}

