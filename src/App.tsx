import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import MainLayout from './components/layout/MainLayout'
import LoginPage from './components/auth/LoginPage'
import type { PageKey } from './components/layout/MainLayout'
import Dashboard from './pages/Dashboard'
import Editor from './pages/Editor'
import TierGenerate from './pages/TierGenerate'
import JDMatch from './pages/JDMatch'
import AIChat from './pages/AIChat'
import CareerTools from './pages/CareerTools'
import JobScanner from './pages/JobScanner'
import Kanban from './pages/Kanban'
import Settings from './pages/Settings'

export default function App() {
  const user = useAuthStore((s) => s.user)
  const checkAuth = useAuthStore((s) => s.checkAuth)
  const [initDone, setInitDone] = useState(false)

  useEffect(() => {
    checkAuth().finally(() => setInitDone(true))
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!initDone) return <div className="h-full bg-[#F4F2ED] dark:bg-slate-900" />

  if (!user) return <LoginPage />

  return <MainApp />
}

function MainApp() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard')

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard onPageChange={(p) => setActivePage(p as PageKey)} />,
    editor: <Editor />,
    tiers: <TierGenerate />,
    jd: <JDMatch />,
    chat: <AIChat />,
    tools: <CareerTools />,
    kanban: <Kanban />,
    scanner: <JobScanner onPageChange={(p) => setActivePage(p as PageKey)} />,
    settings: <Settings />,
  }

  return (
    <MainLayout activePage={activePage} onPageChange={setActivePage}>
      {pages[activePage]}
    </MainLayout>
  )
}
