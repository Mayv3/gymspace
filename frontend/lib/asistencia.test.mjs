// Kiosco /asistencia: cómo se registra y qué ve el alumno si algo falla (lib/asistencia.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { registrarAsistencia, tipoResultado, MENSAJE_SIN_CONEXION } from './asistencia.ts'

const URL_BACKEND = 'https://backend.test'
const responder = (status, body) => async () =>
  new Response(typeof body === 'string' ? body : JSON.stringify(body), { status })

test('envía el DNI por POST a /api/asistencias', async () => {
  let pedido
  const fetchImpl = async (url, init) => { pedido = { url, init }; return new Response('{}', { status: 200 }) }
  await registrarAsistencia('333', { backendUrl: URL_BACKEND, fetchImpl })
  assert.equal(pedido.url, 'https://backend.test/api/asistencias')
  assert.equal(pedido.init.method, 'POST')
  assert.deepEqual(JSON.parse(pedido.init.body), { dni: '333' })
})

test('registro exitoso: devuelve los datos con success true', async () => {
  const r = await registrarAsistencia('333', {
    backendUrl: URL_BACKEND,
    fetchImpl: responder(200, { nombre: 'Alan', clasesRealizadas: 4 }),
  })
  assert.equal(r.conectado, true)
  assert.deepEqual(r.data, { nombre: 'Alan', clasesRealizadas: 4, success: true })
})

test('rechazo del backend (plan vencido): success false con su mensaje', async () => {
  const r = await registrarAsistencia('333', {
    backendUrl: URL_BACKEND,
    fetchImpl: responder(403, { message: 'El plan de Alan venció el 1/11/2026' }),
  })
  assert.equal(r.conectado, true)
  assert.equal(r.data.success, false)
  assert.equal(r.data.message, 'El plan de Alan venció el 1/11/2026')
})

test('request colgada: corta al llegar al timeout y avisa que no hay conexión', async () => {
  const colgado = (_url, init) => new Promise((_, reject) => {
    init.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
  })
  const inicio = Date.now()
  const r = await registrarAsistencia('333', { backendUrl: URL_BACKEND, fetchImpl: colgado, timeoutMs: 50 })
  assert.ok(Date.now() - inicio < 1000, 'no tiene que quedar esperando')
  assert.equal(r.conectado, false)
  assert.deepEqual(r.data, { success: false, message: MENSAJE_SIN_CONEXION })
})

test('sin red: avisa que no hay conexión', async () => {
  const r = await registrarAsistencia('333', {
    backendUrl: URL_BACKEND,
    fetchImpl: async () => { throw new TypeError('Failed to fetch') },
  })
  assert.equal(r.conectado, false)
  assert.equal(r.data.message, MENSAJE_SIN_CONEXION)
})

test('respuesta que no es JSON (página de error de Render): avisa que no hay conexión', async () => {
  const r = await registrarAsistencia('333', {
    backendUrl: URL_BACKEND,
    fetchImpl: responder(502, '<html>Bad Gateway</html>'),
  })
  assert.equal(r.conectado, false)
  assert.equal(r.data.message, MENSAJE_SIN_CONEXION)
})

test('tipoResultado: éxito, ya registró hoy o error', () => {
  assert.equal(tipoResultado({ success: true, nombre: 'Alan' }), 'exito')
  assert.equal(tipoResultado({ success: false, message: 'Alan ya registró asistencia hoy' }), 'yaRegistro')
  assert.equal(tipoResultado({ success: false, message: 'El plan venció' }), 'error')
  assert.equal(tipoResultado({ success: false, message: MENSAJE_SIN_CONEXION }), 'error')
  assert.equal(tipoResultado({ success: false }), 'error')
})
