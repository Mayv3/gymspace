// Datos de prueba para la difusión por WhatsApp: plan "test" + 10 alumnos con el mismo teléfono.
//   node scripts/seed-test-difusion.js crear
//   node scripts/seed-test-difusion.js borrar
// OJO: escribe en la base del SUPABASE_URL del .env (la misma que usa producción).
import dayjs from 'dayjs'
import dotenv from 'dotenv'
import supabase from '../db/supabase.js'
import { appendAlumnoToSheet, appendPlanToSheet } from '../services/googleSheets.js'

dotenv.config()

const TELEFONO = '3513274314'
const PLAN = 'test'
const CANTIDAD = 10
const dni = (i) => `9990000${String(i).padStart(2, '0')}`

const accion = process.argv[2]

if (accion === 'crear') {
  const { data: existente } = await supabase.from('planes').select('id').eq('plan_o_producto', PLAN).maybeSingle()
  if (existente) throw new Error(`Ya existe el plan "${PLAN}": corré "borrar" antes de volver a crear`)

  await appendPlanToSheet({ Tipo: 'GIMNASIO', 'Plan o Producto': PLAN, Precio: 1000, numero_Clases: 0, Coins: 0 })
  console.log(`✅ Plan "${PLAN}" creado`)

  const hoy = dayjs().format('YYYY-MM-DD')
  const vencimiento = dayjs().add(1, 'year').format('YYYY-MM-DD')
  for (let i = 1; i <= CANTIDAD; i++) {
    await appendAlumnoToSheet({
      DNI: dni(i),
      Nombre: `test${i}`,
      Telefono: TELEFONO,
      Plan: PLAN,
      Fecha_inicio: hoy,
      Fecha_vencimiento: vencimiento,
    })
    console.log(`✅ Alumno test${i} (DNI ${dni(i)})`)
  }
} else if (accion === 'borrar') {
  const dnis = Array.from({ length: CANTIDAD }, (_, i) => dni(i + 1))
  const { error: errAlumnos } = await supabase.from('alumnos').delete().in('dni', dnis)
  if (errAlumnos) throw errAlumnos
  const { error: errPlan } = await supabase.from('planes').delete().eq('plan_o_producto', PLAN)
  if (errPlan) throw errPlan
  console.log(`🧹 Borrados los alumnos ${dnis[0]}…${dnis[CANTIDAD - 1]} y el plan "${PLAN}"`)
} else {
  console.log('Uso: node scripts/seed-test-difusion.js crear|borrar')
  process.exit(1)
}
