// Timeout y reintentos de las consultas a Supabase (db/supabase.js).
// El registro de asistencia escribe, así que no se tiene que reintentar.
import { test } from 'node:test';
import assert from 'node:assert/strict';

process.env.SUPABASE_URL ??= 'https://ejemplo.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ??= 'clave-de-prueba';
const { crearFetchConTimeout } = await import('../db/supabase.js');

// fetch que nunca responde, salvo que lo aborten (como una conexión colgada)
function crearFetchColgado() {
  const llamado = { veces: 0 };
  const fetchColgado = (_url, init) => {
    llamado.veces++;
    return new Promise((_, reject) => {
      init.signal.addEventListener('abort', () => reject(init.signal.reason));
    });
  };
  return { fetchColgado, llamado };
}

const silenciar = async (fn) => {
  const original = console.error;
  console.error = () => {};
  try { return await fn(); } finally { console.error = original; }
};

test('registrar_asistencia colgado: corta por timeout sin reintentar', async () => {
  const { fetchColgado, llamado } = crearFetchColgado();
  const f = crearFetchConTimeout(fetchColgado, { timeoutMs: 30, intentos: 3 });
  await silenciar(() => assert.rejects(
    f('https://x.supabase.co/rest/v1/rpc/registrar_asistencia', { method: 'POST' }),
    { name: 'TimeoutError' },
  ));
  assert.equal(llamado.veces, 1);
});

test('lectura colgada: reintenta hasta 3 veces', async () => {
  const { fetchColgado, llamado } = crearFetchColgado();
  const f = crearFetchConTimeout(fetchColgado, { timeoutMs: 30, intentos: 3 });
  await silenciar(() => assert.rejects(f('https://x.supabase.co/rest/v1/alumnos?dni=eq.1', { method: 'GET' })));
  assert.equal(llamado.veces, 3);
});

test('lectura que se recupera al reintentar: devuelve la respuesta', async () => {
  let veces = 0;
  const fetchFlaky = (_url, init) => {
    veces++;
    if (veces === 1) return new Promise((_, reject) => init.signal.addEventListener('abort', () => reject(init.signal.reason)));
    return Promise.resolve(new Response('[]', { status: 200 }));
  };
  const f = crearFetchConTimeout(fetchFlaky, { timeoutMs: 30, intentos: 3 });
  const res = await silenciar(() => f('https://x.supabase.co/rest/v1/roles', { method: 'GET' }));
  assert.equal(res.status, 200);
  assert.equal(veces, 2);
});
