import { getAlumnosFromSheet, getPlanesFromSheet } from './googleSheets.js'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import dotenv from 'dotenv'
import fetch from 'node-fetch'
import { makeWASocket, DisconnectReason, makeCacheableSignalKeyStore, fetchLatestBaileysVersion, Browsers } from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import P from 'pino'
import qrcode from 'qrcode-terminal'
import { useSupabaseAuthState } from './whatsappSupabaseAuth.js'
import supabase from '../db/supabase.js'

/* =========================================================
    CONFIGURACIÓN GLOBAL
   ========================================================= */


/* ========================================================= */

dayjs.extend(customParseFormat)
dotenv.config()

const MI_NUMERO = '5493513274314@s.whatsapp.net'
const logger = P({ level: 'silent' })

// Números a los que NO se les envía recordatorio por WhatsApp.
// Acepta cualquier formato (con/sin 0, 549, espacios o guiones): se compara solo por dígitos.
const NUMEROS_EXCLUIDOS = [
  '3516818073',
]

// Deja solo los dígitos y quita prefijos 0 / 54 / 9 para comparar de forma uniforme
const normalizarNumero = (tel) =>
  String(tel || '')
    .replace(/[^0-9]/g, '')
    .replace(/^0/, '')
    .replace(/^54/, '')
    .replace(/^9/, '')

const EXCLUIDOS_SET = new Set(NUMEROS_EXCLUIDOS.map(normalizarNumero))

const estaExcluido = (tel) => EXCLUIDOS_SET.has(normalizarNumero(tel))

const _origLog = console.log
console.log = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('Closing session')) return
  _origLog(...args)
}

let sock = null
let mensajeInicioEnviado = false
let connectedAt = null

/* ================= INICIAR ================= */

export async function iniciarWhatsapp() {
  const { state, saveCreds } = await useSupabaseAuthState()
  const { version } = await fetchLatestBaileysVersion()

  sock = makeWASocket({
    version,
    browser: Browsers.ubuntu('Chrome'),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    logger,
    connectTimeoutMs: 60000,
    retryRequestDelayMs: 2000
  })

  sock.ev.on('creds.update', saveCreds)

  sock.ev.on('connection.update', async ({ connection, lastDisconnect, qr }) => {
    if (qr) {
      console.log('📲 Escaneá el QR con tu celular:')
      qrcode.generate(qr, { small: true })
    }

    if (connection === 'open') {
      connectedAt = Date.now()
      console.log('✅ WhatsApp conectado')
      if (!mensajeInicioEnviado) {
        mensajeInicioEnviado = true
        await new Promise(r => setTimeout(r, 3000))
        await enviarMensajeDeInicio()
      }
    }

    if (connection === 'close') {
      const statusCode = (lastDisconnect?.error instanceof Boom)
        ? lastDisconnect.error.output.statusCode
        : null

      const shouldReconnect = statusCode !== DisconnectReason.loggedOut
      const tiempoConectado = connectedAt ? Date.now() - connectedAt : 0

      if (shouldReconnect) {
        if (tiempoConectado > 10000) console.log('🔄 WhatsApp reconectando...')
        setTimeout(iniciarWhatsapp, 3000)
      } else {
        console.log('🚪 Sesión cerrada — escaneá el QR de nuevo')
        await alertarDesconexion('Sesión cerrada (logged out). Necesitás escanear el QR de nuevo.')
      }
    }
  })
}

/* ================= MENSAJES ================= */

async function enviarMensajeDeInicio() {
  try {
    await sock.sendMessage(MI_NUMERO, { text: `✅ Sesión de WhatsApp abierta correctamente` })
    console.log('📡 Mensaje de inicio enviado')
  } catch (err) {
    console.log('⚠️ No se pudo enviar mensaje de inicio:', err.message)
  }
}

async function enviarMensaje(alumno) {
  const numero = alumno.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
  const jid = `549${numero}@s.whatsapp.net`
  const mensaje = `Hola ${alumno.Nombre}, desde Gymspace te informamos que tu plan de ${alumno.Plan} vence el ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando duro! 💪❤️`

  try {
    await sock.sendMessage(jid, { text: mensaje })

    await supabase.from('whatsapp_mensajes').insert({
      nombre: alumno.Nombre,
      telefono: `549${numero}`,
      plan: alumno.Plan,
      vencimiento: alumno.Fecha_vencimiento,
      mensaje
    })

    console.log(`📤 Enviado a ${alumno.Nombre}`)
  } catch (err) {
    console.error(`❌ Error al enviar a ${alumno.Nombre}:`, err.message)
    await alertarError(`No se pudo enviar mensaje a ${alumno.Nombre} (${alumno.Telefono}): ${err.message}`)
  }
}

/* ================= RECORDATORIOS ================= */

async function procesarRecordatorios(enviar) {
  if (!sock) throw new Error('WhatsApp no está conectado')

  console.log(`\n📅 Buscando alumnos por vencer en 4 días... [${enviar ? 'ENVÍO REAL' : 'SIMULACIÓN'}]\n`)

  const alumnos = await getAlumnosFromSheet()

  const porVencer = alumnos.filter(a => {
    const fecha = String(a.Fecha_vencimiento).trim()
    const vencimiento = dayjs(fecha, 'D/M/YYYY').startOf('day')
    const hoyNormalizado = dayjs().startOf('day')
    const venceEn4Dias = vencimiento.diff(hoyNormalizado, 'day') === 4

    if (venceEn4Dias && estaExcluido(a.Telefono)) {
      console.log(`⛔ Excluido (lista negra): ${a.Nombre} | 📞 ${a.Telefono}`)
      return false
    }

    return venceEn4Dias
  })

  console.log('📋 MENSAJES A PROCESAR')
  console.log('--------------------------------------------')
  if (porVencer.length === 0) {
    console.log('🚫 Nadie cumple la condición hoy')
  } else {
    porVencer.forEach((a, i) => {
      const numero = a.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
      console.log(`${i + 1}. ${a.Nombre} | 📞 549${numero} | 📅 ${a.Fecha_vencimiento} | 🧾 ${a.Plan}`)
    })
  }
  console.log('--------------------------------------------')
  console.log(`📊 Total: ${porVencer.length}\n`)

  const lista = porVencer.map(a => ({
    nombre: a.Nombre,
    telefono: `549${a.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')}`,
    vencimiento: a.Fecha_vencimiento,
    plan: a.Plan
  }))

  if (enviar) {
    for (const alumno of porVencer) {
      await enviarMensaje(alumno)
    }
    await supabase
      .from('whatsapp_session')
      .upsert({ id: 'ultima-ejecucion', data: { fecha: dayjs().format('DD-MM-YYYY') }, updated_at: new Date().toISOString() })
    console.log('🚀 Mensajes enviados')
  } else {
    if (porVencer.length > 0) {
      const resumen = lista.map((a, i) => `${i + 1}. ${a.nombre} — ${a.plan} — vence ${a.vencimiento}`).join('\n')
      await sock.sendMessage(MI_NUMERO, { text: `🧪 Simulación — se enviaría a ${lista.length} alumno(s):\n\n${resumen}` })
    }
    console.log('🧪 Simulación terminada')
  }

  console.log('✅ Proceso finalizado')
  return { status: 'ok', total: porVencer.length, modo: enviar ? 'real' : 'simulacion', lista }
}

export async function simularRecordatorios() {
  return procesarRecordatorios(false)
}

export async function triggerRecordatorios() {
  const hoy = dayjs().format('DD-MM-YYYY')
  const { data: ultimaRow } = await supabase
    .from('whatsapp_session')
    .select('data')
    .eq('id', 'ultima-ejecucion')
    .maybeSingle()

  if (ultimaRow?.data?.fecha === hoy) {
    return { status: 'already_run', message: 'Ya se ejecutó hoy' }
  }

  return procesarRecordatorios(true)
}

/* ================= DIFUSIÓN POR PLAN ================= */

const normPlan = (s = '') =>
  String(s)
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

const aplicarPlantilla = (tpl = '', alumno = {}) =>
  tpl.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, k) => String(alumno[k] ?? '').trim())

const esperar = (ms) => new Promise(r => setTimeout(r, ms))

// Alumnos activos (vencimiento desde el 1° del mes pasado) de los planes elegidos,
// sin excluidos, sin teléfonos inválidos y sin teléfonos repetidos.
export function calcularDestinatariosDifusion(alumnos, planes, { deduplicar = true } = {}) {
  const planesSet = new Set(planes.map(normPlan))
  const corte = dayjs().startOf('month').subtract(1, 'month')
  const vistos = new Set()
  const destinatarios = []

  for (const a of alumnos || []) {
    if (!planesSet.has(normPlan(a.Plan))) continue

    const venc = dayjs(String(a.Fecha_vencimiento).trim(), 'D/M/YYYY')
    if (!venc.isValid() || venc.isBefore(corte, 'day')) continue

    const numero = normalizarNumero(a.Telefono)
    if (numero.length !== 10 || estaExcluido(a.Telefono) || (deduplicar && vistos.has(numero))) continue

    vistos.add(numero)
    destinatarios.push({ alumno: a, jid: `549${numero}@s.whatsapp.net`, telefono: `549${numero}` })
  }

  return destinatarios
}

let difusionEnCurso = false

// sinDeduplicar es solo para pruebas de carga (varios alumnos con el mismo teléfono); la pantalla no lo usa.
export async function difusionWhatsapp({ planes, mensaje, dryRun = false, sinDeduplicar = false }) {
  const [alumnos, planesSheet] = await Promise.all([getAlumnosFromSheet(), getPlanesFromSheet()])
  const destinatarios = calcularDestinatariosDifusion(alumnos, planes, { deduplicar: !sinDeduplicar })

  // {{Precio}}: valor actual del plan en la hoja de planes (solo Gimnasio/Clase, no productos homónimos)
  const precios = new Map()
  for (const p of planesSheet) {
    const precio = Number(p.Precio)
    if ((p.Tipo === 'GIMNASIO' || p.Tipo === 'CLASE') && precio > 0 && !precios.has(normPlan(p['Plan o Producto']))) {
      precios.set(normPlan(p['Plan o Producto']), `$${precio.toLocaleString('es-AR')}`)
    }
  }
  for (const d of destinatarios) {
    d.alumno = { ...d.alumno, Precio: precios.get(normPlan(d.alumno.Plan)) ?? '' }
  }

  if (/\{\{\s*Precio\s*\}\}/.test(mensaje)) {
    const sinPrecio = [...new Set(destinatarios.filter(d => !d.alumno.Precio).map(d => d.alumno.Plan.trim()))]
    if (sinPrecio.length > 0) {
      throw new Error(`Estos planes no tienen precio cargado: ${sinPrecio.join(', ')}`)
    }
  }

  const lista = destinatarios.map(d => ({ nombre: d.alumno.Nombre, plan: d.alumno.Plan }))
  const ejemplo = destinatarios[0] ? aplicarPlantilla(mensaje, destinatarios[0].alumno) : null

  if (dryRun) return { status: 'ok', modo: 'simulacion', total: lista.length, lista, ejemplo }

  if (!sock) throw new Error('WhatsApp no está conectado')
  if (difusionEnCurso) throw new Error('Ya hay una difusión en curso')
  if (destinatarios.length === 0) throw new Error('No hay alumnos activos para esos planes')

  difusionEnCurso = true
  enviarDifusion(destinatarios, mensaje).finally(() => { difusionEnCurso = false })

  return { status: 'ok', modo: 'real', total: lista.length, lista, ejemplo }
}

async function enviarDifusion(destinatarios, mensaje) {
  console.log(`📢 Difusión iniciada: ${destinatarios.length} destinatarios`)
  const fallidos = []

  for (const { alumno, jid, telefono } of destinatarios) {
    const texto = aplicarPlantilla(mensaje, alumno)
    try {
      await sock.sendMessage(jid, { text: texto })
      await supabase.from('whatsapp_mensajes').insert({
        nombre: alumno.Nombre,
        telefono,
        plan: alumno.Plan,
        vencimiento: alumno.Fecha_vencimiento,
        mensaje: texto
      })
      console.log(`📤 Difusión → ${alumno.Nombre}`)
    } catch (err) {
      console.error(`❌ Difusión falló para ${alumno.Nombre}:`, err.message)
      fallidos.push(`${alumno.Nombre} (${alumno.Telefono}): ${err.message}`)
    }
    // Pausa aleatoria de 5 a 10 s entre mensajes para no parecer spam
    await esperar(5000 + Math.random() * 5000)
  }

  console.log(`📢 Difusión finalizada: ${destinatarios.length - fallidos.length} ok, ${fallidos.length} con error`)
  if (fallidos.length > 0) {
    await alertarError(`Difusión: fallaron ${fallidos.length} envío(s):<br>${fallidos.join('<br>')}`)
  }
}

/* ================= ALERTA EMAIL ================= */

export async function simularError() {
  await alertarError('Error de prueba — mensaje simulado para testear las alertas')
}

async function enviarMailAlerta(subject, htmlContent) {
  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY
    },
    body: JSON.stringify({
      sender: { email: process.env.FROM_EMAIL, name: 'Gymspace' },
      to: [{ email: 'nicopereyra855@gmail.com' }],
      subject,
      htmlContent
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Brevo ${res.status}: ${errText}`)
  }
}

async function alertarError(motivo) {
  try {
    await enviarMailAlerta(
      '❌ Error al enviar mensaje de WhatsApp — Gymspace',
      `<p>Hubo un error al enviar un mensaje de WhatsApp.</p><p><strong>Detalle:</strong> ${motivo}</p>`
    )
    console.log('📧 Alerta de error enviada por email')
  } catch (err) {
    console.log('⚠️ No se pudo enviar alerta de error:', err.message)
  }
}

async function alertarDesconexion(motivo) {
  try {
    await enviarMailAlerta(
      '⚠️ WhatsApp Gymspace desconectado',
      `<p>El servicio de WhatsApp de Gymspace se desconectó.</p><p><strong>Motivo:</strong> ${motivo}</p><p>Revisá el servidor y volvé a escanear el QR si es necesario.</p>`
    )
    console.log('📧 Alerta de desconexión enviada por email')
  } catch (err) {
    console.log('⚠️ No se pudo enviar alerta por email:', err.message)
  }
}
