import { Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Spinner } from './components/ui'
import { AttemptDetail } from './pages/AttemptDetail'
import { AttemptForm } from './pages/AttemptForm'
import { Attempts } from './pages/Attempts'
import { Backlog } from './pages/Backlog'
import { Compare } from './pages/Compare'
import { Home } from './pages/Home'
import { CloudOnboarding, LocalOnboarding, SignIn } from './pages/Onboarding'
import { RoundPage } from './pages/RoundPage'
import { Settings } from './pages/Settings'
import { useApp } from './state/app'
import { CoachProvider } from './state/coach'

export default function App() {
  const { status, mode, team } = useApp()

  if (status === 'loading') return <Spinner />
  if (status === 'signed_out') return <SignIn />
  if (status === 'no_team' || !team) return mode === 'local' ? <LocalOnboarding /> : <CloudOnboarding />

  return (
    <Routes>
      {/* key forces a clean remount when switching teams */}
      <Route
        element={
          <CoachProvider key={team.id}>
            <Layout />
          </CoachProvider>
        }
      >
        <Route index element={<Home />} />
        <Route path="attempts" element={<Attempts />} />
        <Route path="attempts/new" element={<AttemptForm key="new" />} />
        <Route path="attempts/compare" element={<Compare />} />
        <Route path="attempts/:id" element={<AttemptDetail />} />
        <Route path="attempts/:id/edit" element={<AttemptForm key="edit" />} />
        <Route path="backlog" element={<Backlog />} />
        <Route path="round" element={<RoundPage />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
