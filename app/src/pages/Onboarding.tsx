import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Card, ErrorNote, Field } from '../components/ui'
import { seedSeason } from '../lib/data'
import { BUSINESS_TYPES, DEFAULT_DECISION_KEYS } from '../lib/season'
import { newId, nowIso } from '../lib/store/store'
import type { Role, Team } from '../lib/types'
import { useApp } from '../state/app'

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center gap-4 px-4 py-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">VBC Run Logbook</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Track every DECA Virtual Business Challenge Entrepreneurship attempt: hypothesis → run → log → compare to
          your best → next test.
        </p>
      </div>
      {children}
      <p className="text-center text-xs text-slate-500">
        Not affiliated with DECA or Knowledge Matters. This is an after-the-run logbook — it never connects to the
        simulation.
      </p>
    </div>
  )
}

function AgeCheck({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span>I am 13 or older.</span>
    </label>
  )
}

export function LocalOnboarding() {
  const { localStore, refresh } = useApp()
  const [teamName, setTeamName] = useState('')
  const [names, setNames] = useState('')
  const [business, setBusiness] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const qc = useQueryClient()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const team: Team = {
        id: newId(),
        name: teamName.trim(),
        track: 'entrepreneurship',
        business_type: business || null,
        competition_mode: 'auto',
        decision_keys: DEFAULT_DECISION_KEYS,
        join_code: null,
        created_at: nowIso(),
      }
      const store = localStore!
      await store.createTeam(team)
      const members = names
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
      await store.insertMany(
        'members',
        members.map((display_name) => ({
          id: newId(),
          team_id: team.id,
          user_id: null,
          display_name,
          role: 'student' as Role,
        })),
      )
      await seedSeason(store, team.id)
      qc.clear()
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <Card>
        <form className="space-y-4" onSubmit={submit}>
          <h2 className="text-lg font-semibold">Set up your team</h2>
          <Field label="Team name" htmlFor="team-name">
            <input
              id="team-name"
              className="input"
              required
              maxLength={80}
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="e.g. Lincoln HS VBC"
            />
          </Field>
          <Field label="Team members" hint="First names or nicknames, separated by commas (1–3 people)." htmlFor="members">
            <input
              id="members"
              className="input"
              value={names}
              onChange={(e) => setNames(e.target.value)}
              placeholder="Sam, Alex"
            />
          </Field>
          <Field label="Business (optional)" hint="You can change this per attempt." htmlFor="biz">
            <select id="biz" className="input" value={business} onChange={(e) => setBusiness(e.target.value)}>
              <option value="">Not chosen yet</option>
              {BUSINESS_TYPES.map((b) => (
                <option key={b}>{b}</option>
              ))}
            </select>
          </Field>
          <p className="rounded-xl bg-slate-100 p-3 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            Local mode: data stays in this browser. Export a backup regularly from Team settings. To share data across
            teammates' phones, deploy with Supabase (see README).
          </p>
          <ErrorNote error={error} />
          <button className="btn btn-primary w-full" disabled={busy || !teamName.trim()}>
            Create team
          </button>
        </form>
      </Card>
    </Shell>
  )
}

export function SignIn() {
  const { cloudStore } = useApp()
  const auth = cloudStore!.client.auth
  const [method, setMethod] = useState<'password' | 'link'>('password')
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [sent, setSent] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<{ error: unknown }>) => {
    setBusy(true)
    setError(null)
    setInfo(null)
    try {
      const { error } = await fn()
      if (error) setError(error)
      return !error
    } finally {
      setBusy(false)
    }
  }

  const submitPassword = async (e: FormEvent) => {
    e.preventDefault()
    if (mode === 'signin') {
      await run(() => auth.signInWithPassword({ email: email.trim(), password }))
      return
    }
    let needsConfirm = false
    const ok = await run(async () => {
      const res = await auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: window.location.origin },
      })
      needsConfirm = !res.error && !res.data.session
      return res
    })
    if (ok && needsConfirm) {
      setMode('signin')
      setInfo('Account created. Click the confirmation link we emailed you, then come back here and sign in.')
    }
  }

  const sendLink = async (e: FormEvent) => {
    e.preventDefault()
    const ok = await run(() =>
      auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: window.location.origin } }),
    )
    if (ok) setSent(true)
  }

  const verify = async (e: FormEvent) => {
    e.preventDefault()
    await run(() => auth.verifyOtp({ email: email.trim(), token: code.trim(), type: 'email' }))
  }

  const emailField = (
    <Field label="Email" htmlFor="email">
      <input
        id="email"
        type="email"
        className="input"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
    </Field>
  )

  return (
    <Shell>
      <Card>
        {method === 'password' ? (
          <form className="space-y-4" onSubmit={submitPassword}>
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
              {(['signin', 'signup'] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  className={`rounded-lg py-1.5 text-sm font-medium ${mode === m ? 'bg-white shadow dark:bg-slate-950' : ''}`}
                  onClick={() => setMode(m)}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>
            {emailField}
            <Field label="Password" htmlFor="password" hint={mode === 'signup' ? 'At least 8 characters.' : undefined}>
              <input
                id="password"
                type="password"
                className="input"
                required
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
            {info && <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">{info}</p>}
            <ErrorNote error={error} />
            <button className="btn btn-primary w-full" disabled={busy}>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
            </button>
            <button type="button" className="w-full text-center text-sm text-slate-500 underline" onClick={() => setMethod('link')}>
              Email me a sign-in link instead
            </button>
          </form>
        ) : !sent ? (
          <form className="space-y-4" onSubmit={sendLink}>
            <h2 className="text-lg font-semibold">Sign in with an email link</h2>
            {emailField}
            <ErrorNote error={error} />
            <button className="btn btn-primary w-full" disabled={busy}>
              Email me a sign-in link
            </button>
            <button type="button" className="w-full text-center text-sm text-slate-500 underline" onClick={() => setMethod('password')}>
              Use a password instead
            </button>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verify}>
            <h2 className="text-lg font-semibold">Check your email</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              We sent a sign-in link to <strong>{email}</strong>. Open it on this device, or enter the code from the
              email if there is one.
            </p>
            <Field label="Code" htmlFor="otp">
              <input
                id="otp"
                className="input tracking-widest"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <ErrorNote error={error} />
            <div className="flex gap-2">
              <button type="button" className="btn btn-secondary flex-1" onClick={() => setSent(false)}>
                Back
              </button>
              <button className="btn btn-primary flex-1" disabled={busy || code.trim().length < 6}>
                Verify code
              </button>
            </div>
          </form>
        )}
      </Card>
    </Shell>
  )
}

export function CloudOnboarding() {
  const { cloudStore, refresh, signOut, session, error: appError } = useApp()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [teamName, setTeamName] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [code, setCode] = useState('')
  const [role, setRole] = useState<Role>('student')
  const [ageOk, setAgeOk] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const [busy, setBusy] = useState(false)
  const qc = useQueryClient()

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const store = cloudStore!
      if (tab === 'create') {
        const teamId = await store.createTeam(teamName.trim(), displayName.trim(), ageOk)
        await store.updateTeam(teamId, { decision_keys: DEFAULT_DECISION_KEYS })
        await seedSeason(store, teamId)
        localStorage.setItem('vbc:cloudTeam', teamId)
      } else {
        const teamId = await store.joinTeam(code.trim(), displayName.trim(), role, ageOk)
        localStorage.setItem('vbc:cloudTeam', teamId)
      }
      qc.clear()
      await refresh()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Shell>
      <Card>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {(['create', 'join'] as const).map((t) => (
            <button
              key={t}
              type="button"
              className={`rounded-lg py-1.5 text-sm font-medium ${tab === t ? 'bg-white shadow dark:bg-slate-950' : ''}`}
              onClick={() => setTab(t)}
            >
              {t === 'create' ? 'Create a team' : 'Join with a code'}
            </button>
          ))}
        </div>
        <form className="space-y-4" onSubmit={submit}>
          {tab === 'create' ? (
            <Field label="Team name" htmlFor="team-name">
              <input
                id="team-name"
                className="input"
                required
                maxLength={80}
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
              />
            </Field>
          ) : (
            <>
              <Field label="Join code" hint="Ask a teammate — it's on their Team page." htmlFor="code">
                <input
                  id="code"
                  className="input uppercase tracking-widest"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
              </Field>
              <Field label="I am a…" htmlFor="role">
                <select id="role" className="input" value={role} onChange={(e) => setRole(e.target.value as Role)}>
                  <option value="student">Team member (can log attempts)</option>
                  <option value="advisor">Advisor (read-only)</option>
                </select>
              </Field>
            </>
          )}
          <Field label="Your display name" hint="First name or nickname only." htmlFor="display-name">
            <input
              id="display-name"
              className="input"
              required
              maxLength={40}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </Field>
          <AgeCheck checked={ageOk} onChange={setAgeOk} />
          <ErrorNote error={error ?? appError} />
          <button className="btn btn-primary w-full" disabled={busy || !ageOk}>
            {tab === 'create' ? 'Create team' : 'Join team'}
          </button>
        </form>
      </Card>
      <p className="text-center text-sm text-slate-500">
        Signed in as {session?.user.email} ·{' '}
        <button className="underline" onClick={() => void signOut()}>
          Sign out
        </button>
      </p>
    </Shell>
  )
}
