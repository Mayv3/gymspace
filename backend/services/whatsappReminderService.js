/* import axios from 'axios'
import dayjs from 'dayjs'
import cron from 'node-cron'
import fs from 'fs/promises'
import path from 'path'
import { getAlumnosFromSheet } from './googleSheets.js'
import dotenv from 'dotenv'
dotenv.config()

const rutaUltimaEjecucion = path.resolve('./tokens/ultima-ejecucion.txt')

const token = process.env.WHATSAPP_TOKEN
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
const templateName = process.env.WHATSAPP_TEMPLATE_NAME
const templateLang = process.env.WHATSAPP_TEMPLATE_LANG

async function enviarRecordatorio(alumno) {
  const numero = alumno.Telefono.replace(/^0/, '').replace(/[^0-9]/g, '')
  const numeroWhatsApp = `549${numero}`

  try {
    await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: numeroWhatsApp,
        type: 'template',
        template: {
          name: templateName,
          language: { code: templateLang },
          components: [
            {
              type: 'body',
              parameters: [
                { type: 'text', text: alumno.Nombre },
                { type: 'text', text: alumno.Fecha_vencimiento }
              ]
            }
          ]
        }
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )
    console.log(`✅ Mensaje enviado a ${alumno.Nombre}`)
  } catch (err) {
    console.log(`❌ Error al enviar mensaje a ${alumno.Nombre}:`, err.response?.data || err.message)
  }
}

export async function iniciarRecordatorios() {
  cron.schedule('0 8 * * *', async () => {
    const hoy = dayjs().format('YYYY-MM-DD')

    try {
      const ultima = await fs.readFile(rutaUltimaEjecucion, 'utf-8')
      if (ultima === hoy) {
        console.log('⚠️ La tarea ya se ejecutó hoy. Saltando...')
        return
      }
    } catch (_) {
      // No pasa nada si el archivo no existe aún
    }

    console.log('📅 Ejecutando tarea de recordatorio de planes...')

    const alumnos = await getAlumnosFromSheet()
    const porVencer = alumnos.filter(a => {
      const vencimiento = dayjs(a.Fecha_vencimiento, 'DD/MM/YYYY')
      return vencimiento.diff(dayjs(), 'day') === 2
    })

    for (const alumno of porVencer) {
      await enviarRecordatorio(alumno)
    }

    await fs.writeFile(rutaUltimaEjecucion, hoy)
    console.log('✅ Tarea completada y registrada.')
  })

  console.log('✅ Recordatorio programado con WhatsApp Cloud API')
}
*/