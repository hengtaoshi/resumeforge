import type { ReactNode } from 'react';
import TitleBar from './TitleBar';
import Sidebar from './Sidebar';

export type PageKey = 'dashboard' | 'editor' | 'tiers' | 'jd' | 'chat' | 'tools' | 'kanban' | 'scanner' | 'interview' | 'settings';

interface MainLayoutProps {
  children: ReactNode;
  activePage: PageKey;
  onPageChange: (page: PageKey) => void;
}

export default function MainLayout({ children, activePage, onPageChange }: MainLayoutProps) {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden bg-[#F8F7F4]">
      {/* Title bar at top */}
      <TitleBar />

      {/* Body: Sidebar + Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left sidebar */}
        <Sidebar activePage={activePage} onPageChange={onPageChange} />

        {/* Main content area */}
        <main className="flex-1 overflow-y-auto p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
