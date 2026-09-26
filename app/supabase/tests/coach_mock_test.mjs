// Runs the coach edge function under Deno against mock Supabase + OpenAI servers.
// Usage: node supabase/tests/coach_mock_test.mjs /path/to/deno
import { spawn } from 'node:child_process'
import http from 'node:http'

const deno = process.argv[2] ?? 'deno'
const state = { competition: false, usage: 0, openaiBodies: [], upserts: [] }

const send = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json' })
  res.end(body === undefined ? '' : JSON.stringify(body))
}
const readBody = (req) => new Promise((r) => { let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => r(b)) })

const mock = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x')
  const auth = req.headers.authorization ?? ''
  const wantsObject = (req.headers.accept ?? '').includes('pgrst.object')
  if (url.pathname === '/auth/v1/user') return auth === 'Bearer good-user-jwt' ? send(res, 200, { id: 'u1', aud: 'authenticated', role: 'authenticated', email: 'a@b.c' }) : send(res, 401, { msg: 'bad jwt' })
  if (url.pathname === '/rest/v1/teams') {
    const team = { id: 't1', competition_mode: state.competition ? 'on' : 'auto', ai_in_rounds: false }
    const visible = url.searchParams.get('id') === 'eq.t1' && auth === 'Bearer good-user-jwt'
    if (wantsObject) return visible ? send(res, 200, team) : send(res, 406, { code: 'PGRST116', message: 'no rows', details: 'The result contains 0 rows' })
    return send(res, 200, visible ? [team] : [])
  }
  if (url.pathname === '/rest/v1/rounds' || url.pathname === '/rest/v1/round_windows') return send(res, 200, [])
  if (url.pathname === '/rest/v1/ai_usage') {
    if (req.method === 'GET') return state.usage ? send(res, 200, { requests: state.usage }) : send(res, 406, { code: 'PGRST116', message: 'no rows', details: 'The result contains 0 rows' })
    const body = JSON.parse(await readBody(req))
    state.upserts.push(body)
    state.usage = body.requests
    return send(res, 201)
  }
  if (url.pathname === '/v1/responses') {
    const body = JSON.parse(await readBody(req))
    state.openaiBodies.push({ body, auth })
    const reply = { reply: 'Raise your price.', ideas: [], follow_ups: ['Why?'] }
    return send(res, 200, { output: [{ type: 'message', content: [{ type: 'output_text', text: JSON.stringify(reply) }] }] })
  }
  send(res, 404, { error: `unmocked ${req.method} ${url.pathname}` })
})
await new Promise((r) => mock.listen(54399, r))

const fn = spawn(deno, ['run', '--allow-net', '--allow-env', '--allow-read', 'supabase/functions/coach/index.ts'], {
  env: {
    ...process.env,
    SUPABASE_URL: 'http://127.0.0.1:54399',
    SUPABASE_ANON_KEY: 'anon',
    SUPABASE_SERVICE_ROLE_KEY: 'service',
    OPENAI_API_KEY: 'sk-test',
    OPENAI_BASE_URL: 'http://127.0.0.1:54399/v1',
    AI_DAILY_LIMIT: '2',
    NO_COLOR: '1',
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
fn.stdout.on('data', (d) => (log += d))
fn.stderr.on('data', (d) => (log += d))
for (let i = 0; i < 100 && !/Listening/.test(log); i++) await new Promise((r) => setTimeout(r, 200))
if (!/Listening/.test(log)) { console.error(log); process.exit(1) }

const call = async (jwt, body) => {
  const res = await fetch('http://127.0.0.1:8000/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(jwt ? { Authorization: `Bearer ${jwt}` } : {}) },
    body: JSON.stringify(body),
  })
  return { status: res.status, body: await res.json() }
}
const msg = { team_id: 't1', context: 'PB profit $1,000', messages: [{ role: 'user', content: 'What next?' }] }
const results = []
const expect = (name, cond, detail) => { results.push([name, cond]); console.log(`${cond ? 'PASS' : 'FAIL'} ${name}${cond ? '' : ` — ${JSON.stringify(detail)}`}`) }

let r = await call(null, msg)
expect('no auth → 401', r.status === 401, r)
r = await call('bad', msg)
expect('bad jwt → 401', r.status === 401, r)
r = await call('good-user-jwt', { ...msg, team_id: 'other' })
expect('not a member → 403', r.status === 403, r)
state.competition = true
r = await call('good-user-jwt', msg)
expect('competition lock → 423', r.status === 423 && r.body.locked === true, r)
expect('lock blocks before OpenAI', state.openaiBodies.length === 0, state.openaiBodies.length)
state.competition = false
r = await call('good-user-jwt', msg)
expect('happy path → 200 with parsed reply', r.status === 200 && r.body.reply === 'Raise your price.' && r.body.used === 1, r)
const sent = state.openaiBodies[0]
expect('OpenAI got server key, strict schema, context', sent?.auth === 'Bearer sk-test' && sent.body.text.format.strict === true && sent.body.input[0].content.includes('PB profit'), sent)
r = await call('good-user-jwt', msg)
expect('second call ok', r.status === 200 && r.body.used === 2, r)
r = await call('good-user-jwt', msg)
expect('daily limit → 429', r.status === 429, r)

fn.kill()
mock.close()
process.exit(results.every(([, ok]) => ok) ? 0 : 1)
