import { buildOpenAIRequest, DEFAULT_MODEL, parseOpenAIResponse, type ChatTurn, type CoachReply } from '../../supabase/functions/_shared/coach'
import type { SupabaseStore } from './store/supabase'

const KEY_STORAGE = 'vbc:openai-key'
const MODEL_STORAGE = 'vbc:openai-model'

/** Local mode only: the user's own OpenAI key, stored in this browser. */
export const localAi = {
  getKey: () => localStorage.getItem(KEY_STORAGE) ?? '',
  setKey: (k: string) => (k ? localStorage.setItem(KEY_STORAGE, k.trim()) : localStorage.removeItem(KEY_STORAGE)),
  getModel: () => localStorage.getItem(MODEL_STORAGE) || DEFAULT_MODEL,
  setModel: (m: string) => (m ? localStorage.setItem(MODEL_STORAGE, m.trim()) : localStorage.removeItem(MODEL_STORAGE)),
}

export class CoachError extends Error {
  locked: boolean
  constructor(message: string, locked = false) {
    super(message)
    this.locked = locked
  }
}

export async function askCoach(opts: {
  cloud: SupabaseStore | null
  teamId: string
  context: string
  messages: ChatTurn[]
}): Promise<CoachReply> {
  if (opts.cloud) {
    const { data, error } = await opts.cloud.client.functions.invoke('coach', {
      body: { team_id: opts.teamId, context: opts.context, messages: opts.messages },
    })
    if (error) {
      // FunctionsHttpError carries the response; surface the server's message.
      const ctx = (error as { context?: Response }).context
      let body: { error?: string; locked?: boolean } | null = null
      try {
        body = ctx ? await ctx.json() : null
      } catch {
        body = null
      }
      throw new CoachError(body?.error ?? error.message, !!body?.locked)
    }
    return data as CoachReply
  }

  const key = localAi.getKey()
  if (!key) throw new CoachError('Add your OpenAI API key in Team settings → AI coach to use the coach in local mode.')
  const res = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildOpenAIRequest(localAi.getModel(), opts.context, opts.messages)),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) throw new CoachError((payload as { error?: { message?: string } }).error?.message ?? `OpenAI error ${res.status}`)
  return parseOpenAIResponse(payload)
}
