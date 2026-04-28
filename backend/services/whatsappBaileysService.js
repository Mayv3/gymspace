import { getAlumnosFromSheet } from './googleSheets.js'
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
  const modo = SEND_MESSAGES ? 'ENVÍO ACTIVO' : 'MODO SIMULACIÓN'
  try {
    await sock.sendMessage(MI_NUMERO, { text: `✅ Sesión de WhatsApp abierta correctamente — ${modo}` })
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
    return vencimiento.diff(hoyNormalizado, 'day') === 4
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
