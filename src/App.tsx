import { useState } from 'react';
import MainLayout from './components/layout/MainLayout';
import type { PageKey } from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import Editor from './pages/Editor';
import TierGenerate from './pages/TierGenerate';
import JDMatch from './pages/JDMatch';
import AIChat from './pages/AIChat';
import CareerTools from './pages/CareerTools';
import JobScanner from './pages/JobScanner';
import Settings from './pages/Settings';

export default function App() {
  const [activePage, setActivePage] = useState<PageKey>('dashboard');

  const pages: Record<PageKey, React.ReactNode> = {
    dashboard: <Dashboard onPageChange={(p) => setActivePage(p as PageKey)} />,
    editor: <Editor />,
    tiers: <TierGenerate />,
    jd: <JDMatch />,
    chat: <AIChat />,
    tools: <CareerTools onPageChange={(p) => setActivePage(p as PageKey)} />,
    scanner: <JobScanner onPageChange={(p) => setActivePage(p as PageKey)} />,
    settings: <Settings />,
  };

  return (
    <MainLayout activePage={activePage} onPageChange={setActivePage}>
      {pages[activePage]}
    </MainLayout>
  );
}
