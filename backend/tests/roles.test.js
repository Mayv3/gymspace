// Login por DNI: GET /api/roles/:dni (controllers/roles.controller.js).
// La capa de datos va simulada: no toca Supabase.
import { test, mock, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { crearRes } from './helpers.js';

const roles = [
  { DNI: '111', Nombre: 'Ana Admin', Rol: 'Administrador' },
  { DNI: ' 222 ', Nombre: 'Rita Recepción', Rol: ' Recepcionista ' },
];
const alumnos = { '333': { DNI: '333', Nombre: 'Alan Alumno' } };

const getRolesFromSheet = mock.fn(async () => roles);
const getAlumnoByDNI = mock.fn(async (dni) => alumnos[dni] ?? null);

mock.module(new URL('../services/googleSheets.js', import.meta.url).href, {
  exports: { getRolesFromSheet, getAlumnoByDNI },
});
const { getRolPorDNI } = await import('../controllers/roles.controller.js');

const login = async (dni) => {
  const res = crearRes();
  await getRolPorDNI({ params: { dni } }, res);
  return res;
};

beforeEach(() => {
  getRolesFromSheet.mock.resetCalls();
  getAlumnoByDNI.mock.resetCalls();
});

test('staff: devuelve su rol y no busca en alumnos', async () => {
  const res = await login('111');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { dni: '111', nombre: 'Ana Admin', rol: 'Administrador' });
  assert.equal(getAlumnoByDNI.mock.callCount(), 0);
});

test('staff: ignora espacios en el DNI y en el rol', async () => {
  const res = await login(' 222 ');
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.rol, 'Recepcionista');
});

test('alumno: entra como Miembro buscando solo su DNI', async () => {
  const res = await login('333');
  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { dni: '333', nombre: 'Alan Alumno', rol: 'Miembro' });
  assert.deepEqual(getAlumnoByDNI.mock.calls[0].arguments, ['333']);
});

test('DNI inexistente: 404', async () => {
  const res = await login('999');
  assert.equal(res.statusCode, 404);
});

test('DNI vacío: 400 sin consultar la base', async () => {
  const res = await login('   ');
  assert.equal(res.statusCode, 400);
  assert.equal(getRolesFromSheet.mock.callCount(), 0);
});

test('si falla la base: 500', async () => {
  getRolesFromSheet.mock.mockImplementationOnce(async () => { throw new Error('caída'); });
  const errorOriginal = console.error;
  console.error = () => {};
  try {
    const res = await login('111');
    assert.equal(res.statusCode, 500);
  } finally {
    console.error = errorOriginal;
  }
});
