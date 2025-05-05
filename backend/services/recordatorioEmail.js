import cron from 'node-cron'
import nodemailer from 'nodemailer'
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import { getAlumnosFromSheet } from './googleSheets.js'

dotenv.config()

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
        text: `Hola ${alumno.Nombre}, te recordamos que tu plan vence el ${alumno.Fecha_vencimiento}. ¡Renoválo para seguir entrenando! 💪`,
    }

    try {
        await transporter.sendMail(mailOptions)
        console.log(`✅ Email enviado a ${alumno.Nombre}`)
    } catch (error) {
        console.log(`❌ Error al enviar a ${alumno.Nombre}:`, error.message)
    }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

const enviarRecordatoriosPorLotes = async (alumnos, loteSize = 10, delayEntreLotes = 30000) => {
    const hoy = dayjs().startOf('day')
    const alumnosPorVencer = alumnos.filter(alumno => {
        if (!alumno.Email || !alumno.Fecha_vencimiento) return false
        const vencimiento = dayjs(alumno.Fecha_vencimiento, 'D/M/YYYY').startOf('day')
        return vencimiento.diff(hoy, 'day') === 2
    })

    console.log(`📦 Total de alumnos para enviar email: ${alumnosPorVencer.length}`)

    for (let i = 0; i < alumnosPorVencer.length; i += loteSize) {
        const lote = alumnosPorVencer.slice(i, i + loteSize)
        console.log(`🚚 Enviando lote ${i / loteSize + 1} de ${Math.ceil(alumnosPorVencer.length / loteSize)}`)

        for (const alumno of lote) {
            await enviarEmail(alumno)
            await delay(1000)
        }

        if (i + loteSize < alumnosPorVencer.length) {
            console.log(`⏳ Esperando ${delayEntreLotes / 1000}s antes del siguiente lote...`)
            await delay(delayEntreLotes)
        }
    }

    console.log('✅ Todos los emails de recordatorio fueron enviados.')
}

export const probarRecordatoriosEmail = async () => {
    console.log('🧪 Ejecutando prueba manual de recordatorio por email...')
    const alumnos = await getAlumnosFromSheet()
    await enviarRecordatoriosPorLotes(alumnos)
}

cron.schedule('0 11 * * *', async () => {
    console.log(`📬 [${new Date().toLocaleString()}] Cron de EMAIL iniciado`)
    console.log('📅 Ejecutando tarea de recordatorio por email...')
    const alumnos = await getAlumnosFromSheet()
    await enviarRecordatoriosPorLotes(alumnos)
})
