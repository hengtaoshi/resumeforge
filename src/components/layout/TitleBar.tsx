import { useCallback, useState, useEffect } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';
import { useUpdate } from '@/lib/update';
import { useAuthStore } from '@/stores/authStore';
import UserMenu from './UserMenu';

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

  const handleUpdateAction = useCallback(() => {
    if (status.type === 'available') download();
    else if (status.type === 'downloaded') install();
    else if (status.type === 'idle' || status.type === 'error' || status.type === 'not-available') check();
  }, [status, check, download, install]);

  const updateButton = () => {
    switch (status.type) {
      case 'checking':
        return (
          <button disabled className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-400 text-xs cursor-not-allowed">
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 10.5" />
            </svg>
            检查更新...
          </button>
        );
      case 'available':
        return (
          <button onClick={handleUpdateAction} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-600 hover:bg-amber-100 text-xs font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            下载 v{status.version}
          </button>
        );
      case 'downloading':
        return (
          <button disabled className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs">
            <svg className="animate-spin" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeDasharray="31.4 10.5" />
            </svg>
            下载中 {status.percent}%
          </button>
        );
      case 'downloaded':
        return (
          <button onClick={handleUpdateAction} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-50 text-green-600 hover:bg-green-100 text-xs font-medium transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
            立即重启安装
          </button>
        );
      case 'error':
        return (
          <button onClick={handleUpdateAction} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 text-xs transition-colors" title={status.message}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12" y2="16" />
            </svg>
            更新失败，重试
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex items-center justify-between h-[44px] bg-white/80 backdrop-blur-md border-b border-slate-200 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        {/* Left: Traffic light dots + App name */}
        <div className="flex items-center gap-3 pl-4">
          <div className="flex items-center gap-[6px]" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
            {trafficLights.map((light) => (
              <button key={light.action} onClick={() => handleTrafficLight(light.action)} className="w-3 h-3 rounded-full focus:outline-none transition-opacity hover:opacity-80 group" aria-label={light.label}>
                <svg viewBox="0 0 12 12" className="w-3 h-3"><circle cx="6" cy="6" r="5.5" fill={light.color} /></svg>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 ml-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="brandGradient" x1="0" y1="0" x2="24" y2="24">
                  <stop offset="0%" stopColor="#0EA5E9" />
                  <stop offset="100%" stopColor="#8B5CF6" />
                </linearGradient>
              </defs>
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="url(#brandGradient)" stroke="url(#brandGradient)" strokeWidth="0.5" />
              <path d="M2 17L12 22L22 17" stroke="url(#brandGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="url(#brandGradient)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold text-sm text-slate-800 tracking-tight">ResumeForge</span>
            {appVersion && <span className="text-[11px] text-slate-400 font-mono">v{appVersion}</span>}
          </div>
        </div>

        {/* Right: User menu + update button + AI status */}
        <div className="flex items-center gap-3 pr-5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {updateButton()}
          <UserMenu onOpenLogin={() => {}} />
          <span className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              {hasAI && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${hasAI ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            </span>
            {hasAI ? 'AI Ready' : '未配置 API'}
          </span>
        </div>
      </div>
    </>
  );
}
