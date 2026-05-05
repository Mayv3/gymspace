import { initAuthCreds, BufferJSON } from '@whiskeysockets/baileys'
import supabase from '../db/supabase.js'

const TABLE = 'whatsapp_session'

async function read(id) {
  const { data } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', id)
    .maybeSingle()

  if (!data?.data?.value) return null
  try {
    return JSON.parse(data.data.value, BufferJSON.reviver)
  } catch {
    return null
  }
}

async function write(id, value) {
  const serialized = JSON.stringify(value, BufferJSON.replacer)
  await supabase
    .from(TABLE)
    .upsert({ id, data: { value: serialized }, updated_at: new Date().toISOString() })
}

async function migrateKeysBlob() {
  const { data } = await supabase
    .from(TABLE)
    .select('data')
    .eq('id', 'keys')
    .maybeSingle()

  if (!data?.data?.value) return

  let blob
  try {
    blob = JSON.parse(data.data.value, BufferJSON.reviver)
  } catch {
    return
  }

  const toUpsert = []
  for (const [type, typeData] of Object.entries(blob)) {
    if (!typeData || typeof typeData !== 'object') continue
    for (const [id, val] of Object.entries(typeData)) {
      if (val == null) continue
      toUpsert.push({
        id: `keys:${type}:${id}`,
        data: { value: JSON.stringify(val, BufferJSON.replacer) },
        updated_at: new Date().toISOString()
      })
    }
  }

  if (toUpsert.length) await supabase.from(TABLE).upsert(toUpsert)
  await supabase.from(TABLE).delete().eq('id', 'keys')
}

export async function useSupabaseAuthState() {
  await migrateKeysBlob()

  const creds = (await read('creds')) ?? initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const rowIds = ids.map(id => `keys:${type}:${id}`)
          const { data } = await supabase
            .from(TABLE)
            .select('id, data')
            .in('id', rowIds)

          const result = {}
          for (const row of data ?? []) {
            const keyId = row.id.slice(`keys:${type}:`.length)
            try {
              result[keyId] = JSON.parse(row.data.value, BufferJSON.reviver)
            } catch {
              // skip malformed
            }
          }
          return result
        },
        set: async (data) => {
          const toUpsert = []
          const toDelete = []

          for (const [type, typeData] of Object.entries(data)) {
            for (const [id, val] of Object.entries(typeData)) {
              const rowId = `keys:${type}:${id}`
              if (val != null) {
                toUpsert.push({
                  id: rowId,
                  data: { value: JSON.stringify(val, BufferJSON.replacer) },
                  updated_at: new Date().toISOString()
                })
              } else {
                toDelete.push(rowId)
              }
            }
          }

          const ops = []
          if (toUpsert.length) ops.push(supabase.from(TABLE).upsert(toUpsert))
          if (toDelete.length) ops.push(supabase.from(TABLE).delete().in('id', toDelete))
          await Promise.all(ops)
        }
      }
    },
    saveCreds: () => write('creds', creds)
  }
}
