import nodemailer from 'nodemailer'
import express from 'express'
import { getAlumnosFromSheet, getPlanesFromSheet } from '../services/googleSheets.js'

export const emailsRouter = express.Router()

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS_MAILING
    }
  })


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

emailsRouter.post('/broadcast', async (req, res) => {
    try {
        const {
            subject,
            text,
            html,
            filters = {}, // { tipo: 'GIMNASIO' | 'CLASE' }
            onlyEmails,
            dryRun = false,
            batch = { size: 10, perEmailDelayMs: 1000, betweenBatchesMs: 30000 },
        } = req.body || {}

        if (!subject || (!text && !html)) {
            return res.status(400).json({ ok: false, error: 'Faltan "subject" y text/html.' })
        }

        // 1) Traer alumnos y planes
        const [alumnosRaw, planesRaw] = await Promise.all([
            getAlumnosFromSheet(),
            getPlanesFromSheet()
        ])

        const gimnasioPlans = new Set()
        const clasePlans = new Set()

        for (const p of planesRaw || []) {
            const tipo = String(p?.Tipo || '').trim().toUpperCase() // GIMNASIO | CLASE
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

                return {
                    ...a,
                    __PlanTipo: planTipo,
                    __PlanNorm: alumnoPlanNorm
                }
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
            const preview = destinatarios.slice(0, 20).map(a => ({
                Nombre: a.Nombre,
                Email: a.Email,
                Plan: a.Plan,
                PlanTipo: a.__PlanTipo,
                Texto: text ? applyTemplate(text, a) : undefined,
                Html: html ? applyTemplate(html, a) : undefined
            }))
            return res.json({
                ok: true,
                total: destinatarios.length,
                gimnasioPlans: Array.from(gimnasioPlans),
                clasePlans: Array.from(clasePlans),
                preview
            })
        }
        // 7) Envío
        const size = Number(batch.size) || 10
        const perEmailDelayMs = Number(batch.perEmailDelayMs) || 1000
        const betweenBatchesMs = Number(batch.betweenBatchesMs) || 30000

        const results = { sent: 0, failed: 0, errors: [] }

        for (let i = 0; i < destinatarios.length; i += size) {
            const lote = destinatarios.slice(i, i + size)

            for (const alumno of lote) {
                const mailOptions = {
                    from: `"Gymspace" <${process.env.EMAIL_USER}>`,
                    to: alumno.Email,
                    subject,
                    text: text ? applyTemplate(text, alumno) : undefined,
                    html: html ? applyTemplate(html, alumno) : undefined
                }

                try {
                    await transporter.sendMail(mailOptions)
                    results.sent++
                } catch (err) {
                    results.failed++
                    results.errors.push({ email: alumno.Email, message: err?.message || 'Unknown error' })
                }
                if (perEmailDelayMs > 0) await delay(perEmailDelayMs)
            }

            if (i + size < destinatarios.length && betweenBatchesMs > 0) {
                await delay(betweenBatchesMs)
            }
        }

        return res.json({ ok: true, total: destinatarios.length, ...results })
    } catch (error) {
        console.error('Broadcast error:', error)
        return res.status(500).json({ ok: false, error: error?.message || 'Unexpected error' })
    }
})

export default emailsRouter
