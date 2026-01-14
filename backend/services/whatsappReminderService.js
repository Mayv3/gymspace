import { getAlumnosFromSheet } from './googleSheets.js'
import fs from 'fs/promises'
import dayjs from 'dayjs'
import qrcode from 'qrcode-terminal'
import pkg from 'whatsapp-web.js'
import path from 'path'
import dotenv from 'dotenv'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import puppeteer from 'puppeteer'

/* =========================================================
    CONFIGURACIÓN GLOBAL
   ========================================================= */

const SEND_MESSAGES = false 

/* ========================================================= */

const { Client, LocalAuth } = pkg

dayjs.extend(customParseFormat)
dotenv.config()

const rutaUltimaEjecucion = path.resolve('./session/ultima-ejecucion.txt')

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: path.resolve('./session') }),
  puppeteer: {
    executablePath: puppeteer.executablePath(),
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ]
  }
})

/* ================= EVENTOS ================= */

client.on('auth_failure', msg => console.error('❌ Error de autenticación:', msg))
client.on('disconnected', reason => console.log('⚠️ Cliente desconectado:', reason))
client.on('loading_screen', (percent, message) => console.log(`⏳ ${percent}% - ${message}`))

client.on('qr', qr => {
  console.log('📲 Escaneá el QR:')
  qrcode.generate(qr, { small: true })
})

client.on('ready', async () => {
  console.log('✅ Cliente listo')

  try {
    await enviarMensajeDeInicio()
    await iniciarRecordatorios()
  } catch (err) {
    console.error('❌ Error en proceso:', err)
  }
})

client.initialize()

/* ================= MENSAJES ================= */

async function enviarMensajeDeInicio() {
  const numero = '5493513274314@c.us'
  const mensaje = SEND_MESSAGES
    ? '🚀 Gymspace: sistema de WhatsApp iniciado (ENVÍO ACTIVO)'
    : '🧪 Gymspace iniciado en MODO SIMULACIÓN (no se envían mensajes)'

  try {
    await client.sendMessage(numero, mensaje)
    console.log('📡 Mensaje de estado enviado')
  } catch (err) {
    console.log('⚠️ No se pudo enviar mensaje de estado:', err.message)
  }
}

async function enviarMensaje(alumno) {
  const numero = alumno.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
  const numeroWhatsApp = `549${numero}@c.us`

  const mensaje = `Hola ${alumno.Nombre}, desde Gymspace te informamos que tu plan de ${alumno.Plan} vence el ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando duro! 💪❤️`

  await client.sendMessage(numeroWhatsApp, mensaje)
  console.log(`📤 Enviado a ${alumno.Nombre}`)
}

/* ================= RECORDATORIOS ================= */

async function iniciarRecordatorios() {
  const hoy = dayjs().format('DD-MM-YYYY')

  try {
    const ultima = await fs.readFile(rutaUltimaEjecucion, 'utf-8')
    if (ultima === hoy) {
      console.log('⚠️ Ya se ejecutó hoy')
      return
    }
  } catch (_) {}

  console.log('\n📅 Buscando alumnos por vencer en 4 días...\n')

  const alumnos = await getAlumnosFromSheet()

  const porVencer = alumnos.filter(a => {
    const fecha = String(a.Fecha_vencimiento).trim()
    const vencimiento = dayjs(fecha, 'D/M/YYYY').startOf('day')
    const hoyNormalizado = dayjs().startOf('day')
    return vencimiento.diff(hoyNormalizado, 'day') === 4
  })

  /* ================= LOG DE CONTROL ================= */

  console.log('📋 MENSAJES A PROCESAR')
  console.log('--------------------------------------------')

  if (porVencer.length === 0) {
    console.log('🚫 Nadie cumple la condición hoy')
  } else {
    porVencer.forEach((a, i) => {
      const numero = a.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
      console.log(
        `${i + 1}. ${a.Nombre} | 📞 549${numero} | 📅 ${a.Fecha_vencimiento} | 🧾 ${a.Plan}`
      )
    })
  }

  console.log('--------------------------------------------')
  console.log(`📊 Total: ${porVencer.length}`)
  console.log(`⚙️ Modo: ${SEND_MESSAGES ? 'ENVÍO REAL' : 'SIMULACIÓN'}\n`)

  /* ================= ACCIÓN ================= */

  if (SEND_MESSAGES) {
    for (const alumno of porVencer) {
      await enviarMensaje(alumno)
    }
    console.log('🚀 Mensajes enviados')
  } else {
    console.log('🧪 Simulación terminada — no se envió ningún mensaje')
  }

  await fs.writeFile(rutaUltimaEjecucion, hoy)
  console.log('✅ Proceso finalizado')
}
