import { useCallback } from 'react';
import type { PageKey } from './MainLayout';

// Inline SVG paths — no CDN dependency, always renders
const ICONS: Record<string, React.ReactNode> = {
  dashboard: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  editor: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>,
  tiers: <><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></>,
  jd: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  chat: <><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></>,
  tools: <><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v16"/></>,
  scanner: <><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/><path d="M12 6v6l4 2"/><circle cx="12" cy="12" r="1"/></>,
  kanban: <><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="15" width="7" height="6" rx="1"/><rect x="14" y="11" width="7" height="10" rx="1"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></>,
};

const LABELS: Record<string, string> = {
  dashboard: '概览', editor: '打造简历', tiers: '生成简历', jd: 'JD匹配',
  chat: 'AI助手', tools: '求职工具', kanban: '求职看板', scanner: '职位扫描', settings: '设置',
};

interface SidebarProps { activePage: PageKey; onPageChange: (page: PageKey) => void }

export default function Sidebar({ activePage, onPageChange }: SidebarProps) {
  const handleClick = useCallback((key: PageKey) => onPageChange(key), [onPageChange]);

  return (
    <nav className="flex flex-col w-44 h-full bg-white border-r border-slate-200 py-3 gap-0.5 z-10 shadow-sm px-2">
      {Object.entries(ICONS).map(([key, svg]) => {
        const isActive = activePage === key;
        return (
          <button
            key={key}
            onClick={() => handleClick(key as PageKey)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 ease-in-out ${
              isActive
                ? 'bg-sky-100 text-sky-600 shadow-sm'
                : 'text-slate-400 hover:bg-slate-200/60 hover:text-slate-600'
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
              {svg}
            </svg>
            <span className="text-sm font-medium">{LABELS[key] || key}</span>
          </button>
        );
      })}
    </nav>
  );
}
