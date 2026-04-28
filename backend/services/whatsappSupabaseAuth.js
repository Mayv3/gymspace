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

export async function useSupabaseAuthState() {
  const creds = (await read('creds')) ?? initAuthCreds()

  return {
    state: {
      creds,
      keys: {
        get: async (type, ids) => {
          const keys = (await read('keys')) ?? {}
          const result = {}
          for (const id of ids) {
            const val = keys[type]?.[id]
            if (val !== undefined) result[id] = val
          }
          return result
        },
        set: async (data) => {
          const keys = (await read('keys')) ?? {}
          for (const [type, typeData] of Object.entries(data)) {
            if (!keys[type]) keys[type] = {}
            for (const [id, val] of Object.entries(typeData)) {
              if (val != null) keys[type][id] = val
              else delete keys[type][id]
            }
          }
          await write('keys', keys)
        }
      }
    },
    saveCreds: () => write('creds', creds)
  }
}
