// AI coach proxy. Keeps the OpenAI key server-side and enforces, per request:
//   1. the caller is signed in and belongs to the team,
//   2. the competition lock (no AI while a round/mini-challenge is open unless the team opted in),
//   3. a daily request cap per team.
// Secrets: OPENAI_API_KEY (required), OPENAI_MODEL (optional), AI_DAILY_LIMIT (optional, default 150),
// OPENAI_BASE_URL (optional; for tests or an OpenAI-compatible gateway).
import { createClient } from 'npm:@supabase/supabase-js@2'
import {
  buildOpenAIRequest,
  DEFAULT_MODEL,
  isCompetitionOpen,
  parseOpenAIResponse,
  type ChatTurn,
} from '../_shared/coach.ts'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if (req.method !== 'POST') return json(405, { error: 'POST only' })

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return json(401, { error: 'Sign in first.' })

  const url = Deno.env.get('SUPABASE_URL')!
  const userClient = createClient(url, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: userData, error: userError } = await userClient.auth.getUser()
  if (userError || !userData.user) return json(401, { error: 'Your session expired. Sign in again.' })

  let body: { team_id?: string; context?: string; messages?: ChatTurn[] }
  try {
    body = await req.json()
  } catch {
    return json(400, { error: 'Invalid JSON body.' })
  }
  const teamId = body.team_id
  const messages = (body.messages ?? []).filter(
    (m) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string' && m.content.trim(),
  )
  if (!teamId || messages.length === 0 || messages[messages.length - 1].role !== 'user')
    return json(400, { error: 'Missing team or message.' })

  // RLS on these reads guarantees the caller is a member of the team.
  const [{ data: team }, { data: rounds }, { data: windows }] = await Promise.all([
    userClient.from('teams').select('id, competition_mode, ai_in_rounds').eq('id', teamId).maybeSingle(),
    userClient.from('rounds').select('kind, opens_at, closes_at').eq('team_id', teamId),
    userClient.from('round_windows').select('opens_at, closes_at').eq('team_id', teamId),
  ])
  if (!team) return json(403, { error: 'You are not a member of this team.' })

  if (!team.ai_in_rounds && isCompetitionOpen(team, rounds ?? [], windows ?? [], new Date())) {
    return json(423, {
      error:
        'The AI coach is off while a competition round or mini-challenge is open (competition mode). A teammate can change this in Team settings once you have confirmed with your advisor that it is allowed.',
      locked: true,
    })
  }

  const apiKey = Deno.env.get('OPENAI_API_KEY')
  if (!apiKey) return json(503, { error: 'The AI coach is not set up yet: the OpenAI key has not been added to the server.' })

  // Daily cap (service role: ai_usage is not writable by clients).
  const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)
  const limit = Number(Deno.env.get('AI_DAILY_LIMIT') ?? '150')
  const today = new Date().toISOString().slice(0, 10)
  const { data: usage } = await admin.from('ai_usage').select('requests').eq('team_id', teamId).eq('day', today).maybeSingle()
  const used = usage?.requests ?? 0
  if (used >= limit) return json(429, { error: `Daily AI limit reached (${limit} requests). It resets at midnight UTC.` })
  await admin.from('ai_usage').upsert({ team_id: teamId, day: today, requests: used + 1 })

  const model = Deno.env.get('OPENAI_MODEL') || DEFAULT_MODEL
  const base = Deno.env.get('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1'
  const res = await fetch(`${base}/responses`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(buildOpenAIRequest(model, String(body.context ?? ''), messages)),
  })
  const payload = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = (payload as { error?: { message?: string } }).error?.message ?? `OpenAI error ${res.status}`
    console.error('openai', res.status, msg)
    return json(502, { error: `The AI service returned an error: ${msg}` })
  }
  try {
    return json(200, { ...parseOpenAIResponse(payload), model, used: used + 1, limit })
  } catch (e) {
    return json(502, { error: e instanceof Error ? e.message : 'Could not read the AI response.' })
  }
})
