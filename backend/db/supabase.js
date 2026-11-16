import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

// En Render algunas conexiones salientes a Supabase quedan colgadas ~2 min antes de responder,
// y supabase-js no tiene timeout: el navegador ve la request "pending" y el panel no carga.
// Cortamos a los TIMEOUT_MS y reintentamos solo lo que es seguro repetir (lecturas).
const TIMEOUT_MS = 12000;
const INTENTOS_LECTURA = 3;

// Las RPC rpc_* son de solo lectura (estadísticas). Otras, como registrar_asistencia, escriben.
function esSeguroReintentar(url, method) {
  const m = (method || 'GET').toUpperCase();
  if (m === 'GET' || m === 'HEAD') return true;
  return m === 'POST' && /\/rest\/v1\/rpc\/rpc_/.test(url);
}

export function crearFetchConTimeout(baseFetch, { timeoutMs = TIMEOUT_MS, intentos = INTENTOS_LECTURA } = {}) {
  return async (input, init = {}) => {
    const url = input?.url ?? String(input); // string, URL o Request
    const maxIntentos = esSeguroReintentar(url, init.method) ? intentos : 1;

    for (let intento = 1; ; intento++) {
      const signal = init.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(timeoutMs)])
        : AbortSignal.timeout(timeoutMs);
      try {
        return await baseFetch(input, { ...init, signal });
      } catch (err) {
        const fueTimeout = err?.name === 'TimeoutError' && !init.signal?.aborted;
        const ruta = url.replace(/^https?:\/\/[^/]+/, '').split('?')[0];
        console.error(`⚠️ Supabase ${fueTimeout ? 'timeout' : 'error'} (intento ${intento}/${maxIntentos}) ${init.method || 'GET'} ${ruta}: ${err?.message}`);
        if (!fueTimeout || intento >= maxIntentos) throw err;
      }
    }
  };
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { global: { fetch: crearFetchConTimeout(fetch) } }
);

export default supabase;
