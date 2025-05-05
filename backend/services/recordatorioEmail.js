import cron from 'node-cron'
import nodemailer from 'nodemailer'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import { getAlumnosFromSheet } from './googleSheets.js'

dotenv.config()

// Configurar Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
})

const enviarEmail = async (alumno) => {
  const mailOptions = {
    from: `"Gymspace" <${process.env.EMAIL_USER}>`,
    to: alumno.Email,
    subject: '📢 Vencimiento de tu plan - Gymspace',
    text: `Hola ${alumno.Nombre}, te recordamos que tu plan vence en 4 dias! ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando! 💪`,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`✅ Email de aviso enviado a ${alumno.Nombre}`)
  } catch (error) {
    console.log(`❌ Error al enviar aviso a ${alumno.Nombre}:`, error.message)
  }
}

const enviarEmailVencido = async (alumno) => {
  const mailOptions = {
    from: `"Gymspace" <${process.env.EMAIL_USER}>`,
    to: alumno.Email,
    subject: '📛 Tu plan ha vencido - Gymspace',
    text: `Hola ${alumno.Nombre}, te informamos que tu plan venció hoy (${alumno.Fecha_vencimiento}). ¡Esperamos que vuelvas pronto para seguir entrenando! 💪`,
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log(`📛 Email de vencimiento enviado a ${alumno.Nombre}`)
  } catch (error) {
    console.log(`❌ Error al enviar vencimiento a ${alumno.Nombre}:`, error.message)
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const enviarRecordatoriosPorLotes = async (alumnos, loteSize = 10, delayEntreLotes = 30000) => {
  const hoy = dayjs().startOf('day')
  const alumnosPorVencer = []
  const alumnosVencenHoy = []

  for (const alumno of alumnos) {
    if (!alumno.Email || !alumno.Fecha_vencimiento) continue

    const vencimiento = dayjs(alumno.Fecha_vencimiento, 'D/M/YYYY').startOf('day')
    const diferencia = vencimiento.diff(hoy, 'day')

    if (diferencia === 4) {
      alumnosPorVencer.push(alumno)
    } else if (diferencia === 0) {
      alumnosVencenHoy.push(alumno)
    }
  }

  console.log(`📦 Alumnos que vencen en 2 días: ${alumnosPorVencer.length}`)
  console.log(`📛 Alumnos que vencen hoy: ${alumnosVencenHoy.length}`)

  for (let i = 0; i < alumnosPorVencer.length; i += loteSize) {
    const lote = alumnosPorVencer.slice(i, i + loteSize)
    console.log(`🚚 Enviando lote ${i / loteSize + 1} de aviso (${lote.length} alumnos)`)

    for (const alumno of lote) {
      await enviarEmail(alumno)
      await delay(1000)
    }

    if (i + loteSize < alumnosPorVencer.length) {
      console.log(`⏳ Esperando ${delayEntreLotes / 1000}s antes del siguiente lote...`)
      await delay(delayEntreLotes)
    }
  }

  for (const alumno of alumnosVencenHoy) {
    await enviarEmailVencido(alumno)
    await delay(1000)
  }

  console.log('✅ Todos los correos de recordatorio fueron enviados.')
}

export const probarRecordatoriosEmail = async () => {
  console.log('🧪 Ejecutando prueba manual de recordatorio por email...')
  const alumnos = await getAlumnosFromSheet()
  await enviarRecordatoriosPorLotes(alumnos)
}

probarRecordatoriosEmail()

// Cron: todos los días a las 11:00 UTC → 8:00 AM Argentina
cron.schedule('0 11 * * *', async () => {
  console.log(`📬 [${new Date().toLocaleString()}] Cron de EMAIL iniciado`)
  const alumnos = await getAlumnosFromSheet()
  await enviarRecordatoriosPorLotes(alumnos)
})
