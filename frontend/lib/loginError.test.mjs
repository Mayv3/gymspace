// Login: qué mensaje ve el usuario según el error (lib/loginError.ts).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mensajeErrorLogin, MENSAJE_DNI_INEXISTENTE, MENSAJE_SIN_CONEXION } from './loginError.ts'

test('404 del backend: el DNI no existe', () => {
  assert.equal(mensajeErrorLogin({ isAxiosError: true, response: { status: 404 } }), MENSAJE_DNI_INEXISTENTE)
})

test('timeout de axios (sin respuesta): problema de conexión, no "DNI inexistente"', () => {
  assert.equal(mensajeErrorLogin({ isAxiosError: true, code: 'ECONNABORTED' }), MENSAJE_SIN_CONEXION)
})

test('error 500 del backend: problema de conexión', () => {
  assert.equal(mensajeErrorLogin({ isAxiosError: true, response: { status: 500 } }), MENSAJE_SIN_CONEXION)
})

test('error que no viene de axios: problema de conexión', () => {
  assert.equal(mensajeErrorLogin(new Error('algo raro')), MENSAJE_SIN_CONEXION)
  assert.equal(mensajeErrorLogin(undefined), MENSAJE_SIN_CONEXION)
})
