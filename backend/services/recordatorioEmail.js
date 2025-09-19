import fetch from 'node-fetch'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import timezone from 'dayjs/plugin/timezone.js'
import customParseFormat from 'dayjs/plugin/customParseFormat.js'
import dotenv from 'dotenv'
import { getAlumnosFromSheet } from './googleSheets.js'

dotenv.config()

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(customParseFormat)

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@gymspace.com.ar'

if (!BREVO_API_KEY) {
  console.error('❌ FALTA BREVO_API_KEY en variables de entorno')
} else {
  console.log('🔑 BREVO_API_KEY =', BREVO_API_KEY.slice(0, 6) + '...')
}

const SKIP_EMAILS = new Set(
  ['123@gmail.com', '7777777@gmail.com'].map(e => e.toLowerCase())
)

async function sendBrevoEmail({ to, subject, text, html }) {
  const toClean = String(to || '').trim().toLowerCase()

  if (SKIP_EMAILS.has(toClean)) {
    console.log(`⏩ Saltando envío a ${toClean} (email de prueba ignorado)`)
    return
  }

  const payload = {
    sender: { email: FROM_EMAIL, name: 'Gymspace' },
    to: [{ email: to }],
    subject,
    htmlContent: html,
    textContent: text,
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API error: ${res.status} - ${errText}`)
    }

    console.log(`📧 Email enviado correctamente a ${to}`)
  } catch (err) {
    console.error(`❌ Error al enviar email a ${to}:`, err.message)
  }
}


const buildHTMLAviso = (nombre, fecha) => `
  <div style="font-family: Arial, sans-serif; background: #ffffff; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; border: 1px solid #f4a300; box-shadow: 0 2px 8px rgba(0,0,0,0.05); text-align: center;">
      
      <img src="https://www.gymspace.com.ar/Gymspace-logo-png.png" alt="Gymspace" style="max-width: 120px;" />
      
      <h2 style="color: #222;">¡Tu plan vence pronto!</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Queremos recordarte que tu plan está por vencer.</p>
      <p><strong>Fecha de vencimiento:</strong> ${fecha}</p>
      <p style="font-size: 0.9rem; color: #555;">¡No pierdas tu progreso! Te esperamos para seguir entrenando. 💪</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.75rem; color: #999;">
        Este es un recordatorio automático de <strong>Gymspace</strong>.
      </p>
    </div>
  </div>
`

const buildHTMLVenceHoy = (nombre, fecha) => `
  <div style="font-family: Arial, sans-serif; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; border: 1px solid #f4a300; text-align: center;">
      
      <img src="https://www.gymspace.com.ar/Gymspace-logo-png.png" 
           alt="Gymspace" 
           style="max-width: 120px;" />
      
      <h2 style="color: #e65100;">📛 ¡Tu plan vence HOY! 📛</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Queremos recordarte que tu plan <strong>vence HOY (${fecha})</strong>.</p>
      <p style="font-size: 0.9rem; color: #555;">¡Renoválo hoy mismo para no perder tu progreso! 💪</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.75rem; color: #999;">
        Este es un recordatorio automático de <strong>Gymspace</strong>.
      </p>
    </div>
  </div>
`

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const enviarRecordatoriosPorLotes = async (
  alumnos,
  loteSize = 10,
  delayEntreLotes = 30000,
  { previewOnly = false } = {}
) => {
  const ZONE = 'America/Argentina/Cordoba'
  const hoy = dayjs.tz(dayjs(), ZONE).startOf('day')

  const alumnosPorVencer = []
  const alumnosVencenHoy = []

  for (const alumno of alumnos) {
    if (!alumno.Email || !alumno.Fecha_vencimiento) continue

    const fechaStr = String(alumno.Fecha_vencimiento).trim()
    const parseFormats = ['D/M/YYYY', 'DD/M/YYYY', 'D/MM/YYYY', 'DD/MM/YYYY']

    const base = dayjs(fechaStr, parseFormats, true)
    if (!base.isValid()) {
      console.log(`⚠️ Fecha inválida para ${alumno.Nombre}: "${alumno.Fecha_vencimiento}"`)
      continue
    }

    const vencimiento = base.tz(ZONE, true).startOf('day')
    const fechaFmt = vencimiento.format('DD/MM/YYYY')
    const diferencia = vencimiento.diff(hoy, 'day')

    if (diferencia === 4) alumnosPorVencer.push({ alumno, vencimiento, fechaFmt, diferencia })
    else if (diferencia === 0) alumnosVencenHoy.push({ alumno, vencimiento, fechaFmt, diferencia })
  }

  console.log(`📦 Alumnos que vencen en 4 días: ${alumnosPorVencer.length}`)
  console.log(`📛 Alumnos que vencen HOY: ${alumnosVencenHoy.length}`)

  // ---- MODO PREVIEW: solo mostrar en consola y salir ----
  if (previewOnly) {
    const rowsAviso = alumnosPorVencer.map(({ alumno, fechaFmt, diferencia }) => ({
      Nombre: alumno.Nombre,
      Email: alumno.Email,
      'Vence': fechaFmt,
      'Días': diferencia,
    }))
    const rowsHoy = alumnosVencenHoy.map(({ alumno, fechaFmt, diferencia }) => ({
      Nombre: alumno.Nombre,
      Email: alumno.Email,
      'Vence': fechaFmt,
      'Días': diferencia,
    }))

    if (rowsAviso.length) {
      console.log('\n=== VENCEN EN 4 DÍAS ===')
      console.table(rowsAviso)
    }
    if (rowsHoy.length) {
      console.log('\n=== VENCEN HOY ===')
      console.table(rowsHoy)
    }
    console.log('\n🔍 Preview only: no se envió ningún email.')
    return
  }

  // Envío real (si previewOnly = false)
  for (let i = 0; i < alumnosPorVencer.length; i += loteSize) {
    const lote = alumnosPorVencer.slice(i, i + loteSize)
    console.log(`🚚 Enviando lote ${i / loteSize + 1} de aviso (${lote.length} alumnos)`)

    for (const item of lote) {
      const { alumno, fechaFmt } = item
      await sendBrevoEmail({
        to: alumno.Email,
        subject: '📢 Vencimiento de tu plan - Gymspace',
        text: `Hola ${alumno.Nombre}, tu plan vence el ${fechaFmt}. ¡Renoválo para seguir entrenando! 💪`,
        html: buildHTMLAviso(alumno.Nombre, fechaFmt),
      })
      await delay(1000)
    }

    if (i + loteSize < alumnosPorVencer.length) {
      console.log(`⏳ Esperando ${delayEntreLotes / 1000}s antes del siguiente lote...`)
      await delay(delayEntreLotes)
    }
  }

  for (const item of alumnosVencenHoy) {
    const { alumno, fechaFmt } = item
    await sendBrevoEmail({
      to: alumno.Email,
      subject: '📛 Tu plan vence HOY - Gymspace',
      text: `Hola ${alumno.Nombre}, tu plan vence HOY (${fechaFmt}). ¡Renoválo para seguir entrenando! 💪`,
      html: buildHTMLVenceHoy(alumno.Nombre, fechaFmt),
    })
    await delay(1000)
  }

  console.log('✅ Todos los correos de recordatorio fueron enviados.')
}

export const probarRecordatoriosEmail = async () => {
  console.log('🧪 Ejecutando prueba manual de recordatorio por email...')
  const alumnos = await getAlumnosFromSheet()
  await enviarRecordatoriosPorLotes(alumnos, 20, 30000, { previewOnly: true })
}

export const enviarPruebaBrevo = async (to, subject, fecha) => {
  const html = `
    <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
      <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="text-align: center; color: #222;">📢 ¡Prueba de envío con Brevo!</h2>
        <p>Hola <strong>Nico</strong>,</p>
        <p>Este es un correo de prueba para confirmar que la integración con Brevo funciona.</p>
        <p><strong>Fecha simulada de vencimiento:</strong> ${fecha}</p>
        <p style="font-size: 0.9rem; color: #555;">Si estás leyendo esto, la API funcionó correctamente. 🎉</p>
        <hr style="margin: 20px 0;">
        <p style="font-size: 0.75rem; color: #999; text-align: center;">
          Este es un test automático de <strong>Gymspace</strong>.
        </p>
      </div>
    </div>
  `

  await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': process.env.BREVO_API_KEY,
    },
    body: JSON.stringify({
      sender: { email: process.env.FROM_EMAIL, name: 'Gymspace' },
      to: [{ email: to }],
      subject,
      htmlContent: html,
      textContent: `Prueba de envío: tu plan vencería el ${fecha}`,
    }),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Brevo respondió ${res.status}`)
      console.log(`✅ Prueba enviada correctamente a ${to}`)
    })
    .catch((err) => {
      console.error('❌ Error al enviar prueba:', err.message)
    })
}

