// Kiosco: POST /api/asistencias (registrarAsistencia en controllers/asistencias.controller.js).
// Supabase va simulado: no se registra ninguna asistencia real.
import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearRes } from './helpers.js';

const rpc = mock.fn();
mock.module(new URL('../db/supabase.js', import.meta.url).href, { exports: { default: { rpc } } });
mock.module(new URL('../services/googleSheets.js', import.meta.url).href, {
  exports: {
    getAlumnosFromSheet: async () => [],
    getAsistenciasFromSheet: async () => [],
    appendAsistenciaToSheet: async () => {},
    updateAlumnoByDNI: async () => {},
    getPlanesFromSheet: async () => [],
  },
});
const { registrarAsistencia } = await import('../controllers/asistencias.controller.js');

const registrar = async (body) => {
  const res = crearRes();
  await registrarAsistencia({ body }, res);
  return res;
};

beforeEach(() => rpc.mock.resetCalls());

test('registra llamando a la RPC con el DNI y devuelve su respuesta', async () => {
  rpc.mock.mockImplementationOnce(async () => ({ data: { status: 200, nombre: 'Alan', clasesRealizadas: 3 }, error: null }));
  const res = await registrar({ dni: '333' });
  assert.deepEqual(rpc.mock.calls[0].arguments, ['registrar_asistencia', { p_dni: '333' }]);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.nombre, 'Alan');
});

test('usa el status que decide la RPC (plan vencido, ya registró, etc.)', async () => {
  rpc.mock.mockImplementationOnce(async () => ({ data: { status: 403, message: 'El plan venció' }, error: null }));
  const res = await registrar({ dni: '333' });
  assert.equal(res.statusCode, 403);
  assert.equal(res.body.message, 'El plan venció');
});

test('sin DNI: 400 sin llamar a la base', async () => {
  const res = await registrar({});
  assert.equal(res.statusCode, 400);
  assert.equal(rpc.mock.callCount(), 0);
});

test('si la RPC falla o se corta por timeout: 500', async () => {
  rpc.mock.mockImplementationOnce(async () => ({ data: null, error: new Error('TimeoutError') }));
  const errorOriginal = console.error;
  console.error = () => {};
  try {
    const res = await registrar({ dni: '333' });
    assert.equal(res.statusCode, 500);
  } finally {
    console.error = errorOriginal;
  }
});
