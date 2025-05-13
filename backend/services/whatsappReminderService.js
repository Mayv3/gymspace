import { getAlumnosFromSheet } from './googleSheets.js'
import fs from 'fs/promises'
import dayjs from 'dayjs'
import qrcode from 'qrcode-terminal'
import pkg from 'whatsapp-web.js'
import path from 'path'
const { Client, LocalAuth } = pkg
import dotenv from 'dotenv'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
dayjs.extend(customParseFormat)

dotenv.config()

const rutaUltimaEjecucion = path.resolve('./session/ultima-ejecucion.txt')

const client = new Client({
  authStrategy: new LocalAuth({ dataPath: './session' })
})

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
    console.error('❌ Ocurrió un error en el proceso:', err)
  }
})

client.initialize()

async function enviarMensajeDeInicio() {
  const numeroWhatsApp = '5493513274314@c.us';
  const mensaje = '✅ Gymspace: el servicio de WhatsApp se inició correctamente.'
  try {
    await client.sendMessage(numeroWhatsApp, mensaje)
    console.log(`✅ Mensaje de inicio enviado a ${numeroWhatsApp}`)
  } catch (err) {
    console.log(`❌ Error al enviar mensaje de inicio:`, err.message)
  }
}

async function enviarMensaje(alumno) {
  const numero = alumno.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
  const numeroWhatsApp = `549${numero}@c.us`
  const mensaje = `Hola ${alumno.Nombre}, desde Gymspace te informamos que tu plan de ${alumno.Plan} vence el ${alumno.Fecha_vencimiento} . ¡Renoválo para seguir entrenando duro! 💪❤️`

  try {
    await client.sendMessage(numeroWhatsApp, mensaje)
    console.log(`✅ Mensaje enviado a ${alumno.Nombre}`)
  } catch (err) {
    console.log(`❌ Error al enviar a ${alumno.Nombre}:`, err.message)
  }
}

async function iniciarRecordatorios() {
  const hoy = dayjs().format('DD-MM-YYYY')

  try {
    const ultima = await fs.readFile(rutaUltimaEjecucion, 'utf-8')
    if (ultima === hoy) {
      console.log('⚠️ La tarea ya se ejecutó hoy. Puedes cerrar esta ventana...')
      return
    }
  } catch (_) { }

  console.log('📅 Ejecutando recordatorios de vencimiento...')

  const alumnos = await getAlumnosFromSheet()
  const porVencer = alumnos.filter(a => {
    const fecha = String(a.Fecha_vencimiento).trim()
    const vencimiento = dayjs(fecha, 'D/M/YYYY').startOf('day')
    const hoyNormalizado = dayjs().startOf('day')
    const diferencia = vencimiento.diff(hoyNormalizado, 'day')

    console.log(`🧪 Comparando: ${fecha} → faltan ${diferencia} días`)
    return diferencia === 4
  })

  if (porVencer.length === 0) {
    console.log('ℹ️ No hay alumnos por vencer en 4 días.')
  } else {
    for (const alumno of porVencer) {
      await enviarMensaje(alumno)
    }
  }

  console.log('🗓️ Hoy es:', dayjs().format('DD/MM/YYYY'))
  console.log('🧪 Primer alumno vence el:', alumnos[0]?.Fecha_vencimiento)

  await fs.writeFile(rutaUltimaEjecucion, hoy)
  console.log('✅ Tarea completada.')
}