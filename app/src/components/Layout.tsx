import { useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useCoach } from '../state/coach'
import { CoachPanel } from './CoachPanel'
import { GuideInline, GuideSidebar } from './GuidePanel'
import { competitionActive, openWindow } from '../lib/metrics'
import { useTeam } from '../state/app'
import { useActiveRound, useNow, useRows } from '../state/data'

const NAV = [
  { to: '/', label: 'Home', icon: '⌂' },
  { to: '/attempts', label: 'Attempts', icon: '☰' },
  { to: '/attempts/new', label: 'Log', icon: '+' },
  { to: '/backlog', label: 'Ideas', icon: '💡' },
  { to: '/round', label: 'Round', icon: '⏱' },
  { to: '/settings', label: 'Team', icon: '⚙' },
]

function CompetitionBanner() {
  const { team } = useTeam()
  const { rounds } = useActiveRound()
  const { data: windows = [] } = useRows('round_windows')
  const now = useNow()
  if (!competitionActive(team, rounds, windows, now)) return null
  const w = openWindow(windows, now)
  return (
    <div role="status" className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
      Competition mode{w ? ` · ${w.label} open` : ''} — keep this app closed on the device running the sim. Log
      attempts afterwards or from another device.
    </div>
  )
}

function RoundPicker() {
  const { rounds, round, setRoundId } = useActiveRound()
  if (!round) return null
  return (
    <select
      aria-label="Active round"
      className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-900"
      value={round.id}
      onChange={(e) => setRoundId(e.target.value)}
    >
      {rounds.map((r) => (
        <option key={r.id} value={r.id}>
          {r.label}
        </option>
      ))}
    </select>
  )
}

export function Layout() {
  const { team, mode, me } = useTeam()
  const loc = useLocation()
  const coach = useCoach()
  const [guideOpen, setGuideOpen] = useState(() => localStorage.getItem('vbc:guide') !== 'hidden')
  const setGuide = (open: boolean) => {
    localStorage.setItem('vbc:guide', open ? 'shown' : 'hidden')
    setGuideOpen(open)
  }
  const isActive = (to: string) => (to === '/' ? loc.pathname === '/' : loc.pathname === to || (to === '/attempts' && loc.pathname.startsWith('/attempts/') && loc.pathname !== '/attempts/new'))

  return (
    <div className="min-h-dvh pb-20 md:pb-0">
      <CompetitionBanner />
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <div className="truncate font-bold">{team.name}</div>
            <div className="text-xs text-slate-500">
              VBC Entrepreneurship · {mode === 'local' ? 'this device only' : me?.role === 'advisor' ? 'advisor (read-only)' : 'team sync'}
            </div>
          </div>
          <RoundPicker />
          <button className="btn btn-primary px-3 py-1.5 xl:hidden" onClick={() => coach.setOpen(true)}>
            ✨ AI coach
          </button>
        </div>
        <nav className="mx-auto hidden max-w-[1600px] gap-1 px-4 pb-2 md:flex" aria-label="Main">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={() =>
                `rounded-lg px-3 py-1.5 text-sm font-medium ${
                  isActive(n.to)
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
          {!guideOpen && (
            <button className="ml-auto hidden rounded-lg px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 lg:block dark:text-slate-300" onClick={() => setGuide(true)}>
              Show guide
            </button>
          )}
        </nav>
      </header>
      <div
        className={`mx-auto max-w-[1600px] gap-5 px-4 py-5 lg:grid ${
          guideOpen ? 'lg:grid-cols-[17rem_minmax(0,1fr)] xl:grid-cols-[17rem_minmax(0,1fr)_24rem]' : 'xl:grid-cols-[minmax(0,1fr)_24rem]'
        }`}
      >
        {guideOpen && (
          <aside className="hidden lg:block" aria-label="How to">
            <div className="sticky top-28 max-h-[calc(100dvh-8rem)] overflow-y-auto">
              <GuideSidebar onCollapse={() => setGuide(false)} />
            </div>
          </aside>
        )}
        <main className="min-w-0">
          <div className={guideOpen ? 'lg:hidden' : ''}>
            <GuideInline />
          </div>
          <Outlet />
        </main>
        <aside className="hidden xl:block">
          <div className="card sticky top-28 h-[calc(100dvh-8rem)] overflow-hidden p-0">
            <CoachPanel />
          </div>
        </aside>
      </div>

      {/* Coach drawer for screens narrower than xl */}
      {coach.open && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <button className="absolute inset-0 bg-slate-900/40" aria-label="Close AI coach" onClick={() => coach.setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-xl sm:w-[26rem] dark:bg-slate-900">
            <CoachPanel onClose={() => coach.setOpen(false)} />
          </div>
        </div>
      )}
      <nav
        className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-6 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)] md:hidden dark:border-slate-800 dark:bg-slate-950"
        aria-label="Main mobile"
      >
        {NAV.map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            className={() =>
              `flex flex-col items-center gap-0.5 py-2 text-[11px] ${
                isActive(n.to) ? 'font-semibold text-brand-600 dark:text-brand-100' : 'text-slate-500'
              }`
            }
          >
            <span
              aria-hidden
              className={`text-lg leading-none ${n.to === '/attempts/new' ? 'flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-white' : ''}`}
            >
              {n.icon}
            </span>
            {n.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
