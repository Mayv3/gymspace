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

async function sendBrevoEmail({ to, subject, text, html }) {
  if (to === '123@gmail.com') {
    console.log(`⏩ Saltando envío a ${to} (email de prueba ignorado)`)
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
  <div style="font-family: Arial, sans-serif; background: #f7f7f7; padding: 20px;">
    <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="text-align: center; color: #222;">📢 ¡Tu plan vence pronto!</h2>
      <p>Hola <strong>${nombre}</strong>,</p>
      <p>Queremos recordarte que tu plan está por vencer.</p>
      <p><strong>Fecha de vencimiento:</strong> ${fecha}</p>
      <p style="font-size: 0.9rem; color: #555;">¡No pierdas tu progreso! Te esperamos para seguir entrenando. 💪</p>
      <hr style="margin: 20px 0;">
      <p style="font-size: 0.75rem; color: #999; text-align: center;">
        Este es un recordatorio automático de <strong>Gymspace</strong>.
      </p>
    </div>
  </div>
`

const buildHTMLVencido = (nombre, fecha) => `
  <div style="font-family: Arial, sans-serif; background: #fff4f4; padding: 20px;">
  <div style="max-width: 500px; margin: auto; background: #fff; border-radius: 10px; padding: 25px; border: 1px solid #ff3b3b;">
    <h2 style="text-align: center; color: #b71c1c;">📛 ¡Tu plan ha vencido!</h2>
    <p>Hola <strong>${nombre}</strong>,</p>
    <p>Te informamos que tu plan venció el <strong>${fecha}</strong>.</p>
    <p style="font-size: 0.9rem; color: #555;">¡Esperamos que vuelvas pronto para seguir entrenando! 💪</p>
    <hr style="margin: 20px 0;">
    <p style="font-size: 0.75rem; color: #999; text-align: center;">
      Este es un recordatorio automático de <strong>Gymspace</strong>.
    </p>
    <p style="font-size: 0.7rem; color: #aaa; text-align: center; margin-top: 10px;">
      Recibís este correo porque estás suscripto a <strong>Gymspace</strong>.  
      Si creés que lo recibiste por error, podés ignorarlo.
    </p>
  </div>
</div>
`

const enviarEmail = async (alumno) => {
  await sendBrevoEmail({
    to: alumno.Email,
    subject: '📢 Vencimiento de tu plan - Gymspace',
    text: `Hola ${alumno.Nombre}, tu plan vence el ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando! 💪`,
    html: buildHTMLAviso(alumno.Nombre, alumno.Fecha_vencimiento),
  })
}

const enviarEmailVencido = async (alumno) => {
  await sendBrevoEmail({
    to: alumno.Email,
    subject: '📛 Tu plan ha vencido - Gymspace',
    text: `Hola ${alumno.Nombre}, tu plan venció el ${alumno.Fecha_vencimiento}. ¡Esperamos que lo renueves pronto! 💪`,
    html: buildHTMLVencido(alumno.Nombre, alumno.Fecha_vencimiento),
  })
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export const enviarRecordatoriosPorLotes = async (
  alumnos,
  loteSize = 10,
  delayEntreLotes = 30000
) => {
  const hoy = dayjs().tz('America/Argentina/Buenos_Aires').startOf('day')
  const alumnosPorVencer = []
  const alumnosVencenHoy = []

  for (const alumno of alumnos) {
    if (!alumno.Email || !alumno.Fecha_vencimiento) continue

    const fechaStr = String(alumno.Fecha_vencimiento).trim()
    const vencimiento = dayjs(fechaStr, ['D/M/YYYY', 'DD/MM/YYYY'], true)
      .tz('America/Argentina/Buenos_Aires')
      .startOf('day')

    if (!vencimiento.isValid()) {
      console.log(`⚠️ Fecha inválida para ${alumno.Nombre}: "${alumno.Fecha_vencimiento}"`)
      continue
    }

    const diferencia = vencimiento.diff(hoy, 'day')

    console.log(
      `📆 Alumno: ${alumno.Nombre} (${alumno.Email})\n` +
      `   Hoy: ${hoy.format('DD/MM/YYYY')} | Vence: ${vencimiento.format('DD/MM/YYYY')} | Diferencia: ${diferencia} días`
    )

    if (diferencia === 4) alumnosPorVencer.push(alumno)
    else if (diferencia === 0) alumnosVencenHoy.push(alumno)
  }

  console.log(`📦 Alumnos que vencen en 4 días: ${alumnosPorVencer.length}`)
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
