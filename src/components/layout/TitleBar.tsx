import { useCallback, useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUpdate } from '@/lib/update';
import { useAuthStore } from '@/stores/authStore';
import UserMenu from './UserMenu';
import DownloadToggle from '@/components/ui/DownloadToggle';

const trafficLights = [
  { color: '#EF4444', label: '关闭', action: 'close' as const },
  { color: '#F59E0B', label: '最大化', action: 'maximize' as const },
  { color: '#22C55E', label: '最小化', action: 'minimize' as const },
] as const;

export default function TitleBar() {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const hasAI = Object.values(apiKeys).some(k => k?.length > 0);
  const { status, check, download, install } = useUpdate();
  const user = useAuthStore((s) => s.user);
  const [appVersion, setAppVersion] = useState('');
  useEffect(() => {
    window.electronAPI?.getVersion().then(setAppVersion);
  }, []);

  const handleTrafficLight = useCallback((action: 'minimize' | 'maximize' | 'close') => {
    window.electronAPI?.[action]();
  }, []);

  const updateProps = {
    idle: { status: 'idle' as const },
    checking: { status: 'checking' as const },
    available: { status: 'available' as const, version: status.type === 'available' ? status.version : undefined },
    downloading: { status: 'downloading' as const, percent: status.type === 'downloading' ? status.percent : undefined },
    downloaded: { status: 'downloaded' as const },
    error: { status: 'error' as const },
    'not-available': { status: 'idle' as const },
  };
  const dlProps = updateProps[status.type] || updateProps.idle;

  const updateButton = () => (
    <DownloadToggle
      status={dlProps.status as any}
      version={(dlProps as any).version}
      percent={(dlProps as any).percent}
      onCheck={check}
      onDownload={download}
      onInstall={install}
    />
  );

  return (
    <>
      <div className="flex items-center justify-between h-[44px] select-none bg-[#FAF9F6] dark:bg-slate-900" style={{ borderBottom: '1px solid rgba(0,0,0,0.06)', WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3 pl-4">
          <div className="flex items-center gap-[6px]" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {trafficLights.map((light) => (
              <button key={light.action} onClick={() => handleTrafficLight(light.action)} className="w-3 h-3 rounded-full focus:outline-none transition-opacity hover:opacity-80 group" aria-label={light.label}>
                <svg viewBox="0 0 12 12" className="w-3 h-3"><circle cx="6" cy="6" r="5.5" fill={light.color} /></svg>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-3">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#D4875E" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
              <path d="M14 8v4" /><path d="M10 10h8" />
            </svg>
            <span className="font-semibold text-sm tracking-tight" style={{ color: '#1C1814' }}>ResumeForge</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pr-5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {updateButton()}
          <UserMenu onOpenLogin={() => {}} />
          <span className="flex items-center gap-1.5 text-xs" style={{ color: '#A09890' }}>
            <span className="relative flex h-2 w-2">
              {hasAI && <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: '#D4875E' }} />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasAI ? 'bg-[#D4875E]' : 'bg-[#D5CFC6]'}`} />
            </span>
            {hasAI ? 'AI Ready' : '未配置 API'}
          </span>
        </div>
      </div>
    </>
  );
}
