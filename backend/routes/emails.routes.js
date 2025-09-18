import express from 'express'
import fetch from 'node-fetch'
import { getAlumnosFromSheet, getPlanesFromSheet } from '../services/googleSheets.js'

export const emailsRouter = express.Router()

const BREVO_API_KEY = process.env.BREVO_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || 'notificaciones@gymspace.com.ar'

if (!BREVO_API_KEY) {
  console.error('❌ FALTA BREVO_API_KEY en variables de entorno')
}

const delay = (ms) => new Promise(r => setTimeout(r, ms))
const isValidEmail = (e) => typeof e === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
const applyTemplate = (tpl = '', alumno = {}) =>
  tpl.replace(/\{\{\s*([A-Za-z0-9_]+)\s*\}\}/g, (_, k) => alumno[k] ?? '')

const norm = (s = '') =>
  s.toString()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()

async function sendBrevoEmail({ to, subject, text, html }) {
  const ignoredEmails = ['123@gmail.com', '7777777@gmail.com']

  if (ignoredEmails.includes(to)) {
    console.log(`⏩ Saltando envío a ${to} (email ignorado)`)
    return
  }

  try {
    const res = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        accept: 'application/json',
        'content-type': 'application/json',
        'api-key': BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: 'Gymspace' },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        textContent: text,
      }),
    })

    if (!res.ok) {
      const errText = await res.text()
      throw new Error(`Brevo API error: ${res.status} - ${errText}`)
    }

    console.log(`✅ OK → ${to}`)
  } catch (err) {
    console.error(`❌ FAIL → ${to} → ${err.message}`)
  }
}

emailsRouter.post('/broadcast', async (req, res) => {
  try {
    const {
      subject,
      text,
      html,
      filters = {},
      dryRun = false,
      onlyEmails,
      batch = { size: 10, perEmailDelayMs: 1000, betweenBatchesMs: 30000 },
    } = req.body || {}

    if (!subject || (!text && !html)) {
      return res.status(400).json({ ok: false, error: 'Faltan "subject" y text/html.' })
    }

    const [alumnosRaw, planesRaw] = await Promise.all([
      getAlumnosFromSheet(),
      getPlanesFromSheet()
    ])

    const gimnasioPlans = new Set()
    const clasePlans = new Set()

    for (const p of planesRaw || []) {
      const tipo = String(p?.Tipo || '').trim().toUpperCase()
      const planName = norm(p?.['Plan o Producto'] || '')
      if (!planName) continue

      if (tipo === 'GIMNASIO') gimnasioPlans.add(planName)
      if (tipo === 'CLASE') clasePlans.add(planName)
    }

    let alumnos = (alumnosRaw || [])
      .filter(a => isValidEmail(a?.Email))
      .map(a => {
        const alumnoPlanNorm = norm(a?.Plan || '')
        let planTipo = null
        if (gimnasioPlans.has(alumnoPlanNorm)) planTipo = 'GIMNASIO'
        if (clasePlans.has(alumnoPlanNorm)) planTipo = 'CLASE'
        return { ...a, __PlanTipo: planTipo, __PlanNorm: alumnoPlanNorm }
      })

    if (filters?.tipo) {
      const t = String(filters.tipo).trim().toUpperCase()
      alumnos = alumnos.filter(a => a.__PlanTipo === t)
    }

    if (Array.isArray(onlyEmails) && onlyEmails.length) {
      const allow = new Set(onlyEmails.map(e => e.toLowerCase().trim()))
      alumnos = alumnos.filter(a => allow.has(String(a.Email).toLowerCase().trim()))
      if (alumnos.length === 0) {
        return res.status(400).json({ ok: false, error: 'El email no corresponde a ningún alumno registrado' })
      }
    }

    const dedup = new Map()
    for (const a of alumnos) {
      const key = a.Email.toLowerCase().trim()
      if (!dedup.has(key)) dedup.set(key, a)
    }
    const destinatarios = Array.from(dedup.values())

    if (dryRun) {
      if (destinatarios.length === 0) {
        return res.status(400).json({ ok: false, error: 'No hay alumnos para previsualizar' })
      }

      const preview = destinatarios.slice(0, 2).map(a => ({
        Nombre: a.Nombre,
        Email: a.Email,
        Plan: a.Plan,
        PlanTipo: a.__PlanTipo,
        Texto: text ? applyTemplate(text, a) : undefined,
        Html: html ? applyTemplate(html, a) : undefined,
      }))

      return res.json({
        ok: true,
        total: destinatarios.length,
        sent: 0,
        failed: 0,
        preview
      })
    }

    res.json({
      ok: true,
      message: "Envío iniciado en background",
      total: destinatarios.length,
      sent: 0,
      failed: 0
    })

    setImmediate(() => enviarEnLotes(destinatarios, { subject, text, html, batch }))

  } catch (error) {
    console.error('Broadcast error:', error)
    return res.status(500).json({ ok: false, error: error?.message || 'Unexpected error' })
  }
})

async function enviarEnLotes(destinatarios, { subject, text, html, batch }) {
  const size = Number(batch.size) || 10
  const perEmailDelayMs = Number(batch.perEmailDelayMs) || 1000
  const betweenBatchesMs = Number(batch.betweenBatchesMs) || 30000

  for (let i = 0; i < destinatarios.length; i += size) {
    const lote = destinatarios.slice(i, i + size)
    console.log(`📦 Procesando lote ${Math.floor(i / size) + 1} con ${lote.length} alumnos`)

    for (const alumno of lote) {
      await sendBrevoEmail({
        to: alumno.Email,
        subject,
        text: text ? applyTemplate(text, alumno) : undefined,
        html: html ? applyTemplate(html, alumno) : undefined,
      })

      if (perEmailDelayMs > 0) await delay(perEmailDelayMs)
    }

    if (i + size < destinatarios.length && betweenBatchesMs > 0) {
      console.log(`⏸ Pausa de ${betweenBatchesMs / 1000}s antes del próximo lote...`)
      await delay(betweenBatchesMs)
    }
  }

  console.log("📩 Envío finalizado")
}

export default emailsRouter
