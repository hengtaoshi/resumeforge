import { useCallback } from 'react';
import { useSettingsStore } from '@/stores/settingsStore';

const trafficLights = [
  { color: '#EF4444', label: '关闭', action: 'close' as const },
  { color: '#F59E0B', label: '最大化', action: 'maximize' as const },
  { color: '#22C55E', label: '最小化', action: 'minimize' as const },
] as const;

export default function TitleBar() {
  const apiKeys = useSettingsStore((s) => s.apiKeys);
  const hasAI = Object.values(apiKeys).some(k => k?.length > 0);

  const handleTrafficLight = useCallback((action: 'minimize' | 'maximize' | 'close') => {
    window.electronAPI?.[action]();
  }, []);

  return (
    <div
      className="flex items-center justify-between h-[44px] bg-white/80 backdrop-blur-md border-b border-slate-200 select-none"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Left: Traffic light dots + App name */}
      <div className="flex items-center gap-3 pl-4">
        {/* Traffic light buttons */}
        <div className="flex items-center gap-[6px]" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {trafficLights.map((light) => (
            <button
              key={light.action}
              onClick={() => handleTrafficLight(light.action)}
              className="w-3 h-3 rounded-full focus:outline-none transition-opacity hover:opacity-80 group"
              aria-label={light.label}
            >
              {/* Outer circle with macOS-like appearance */}
              <svg viewBox="0 0 12 12" className="w-3 h-3">
                <circle cx="6" cy="6" r="5.5" fill={light.color} />
              </svg>
            </button>
          ))}
        </div>

        {/* App brand */}
        <div className="flex items-center gap-2 ml-3">
          {/* Gradient brand icon */}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="brandGradient" x1="0" y1="0" x2="24" y2="24">
                <stop offset="0%" stopColor="#0EA5E9" />
                <stop offset="100%" stopColor="#8B5CF6" />
              </linearGradient>
            </defs>
            <path
              d="M12 2L2 7L12 12L22 7L12 2Z"
              fill="url(#brandGradient)"
              stroke="url(#brandGradient)"
              strokeWidth="0.5"
            />
            <path
              d="M2 17L12 22L22 17"
              stroke="url(#brandGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M2 12L12 17L22 12"
              stroke="url(#brandGradient)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="font-semibold text-sm text-slate-800 tracking-tight">
            ResumeForge
          </span>
        </div>
      </div>

      {/* Right: Status indicator */}
      <div className="flex items-center gap-2 pr-5" style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
        <span className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="relative flex h-2 w-2">
            {hasAI && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />}
            <span className={`relative inline-flex rounded-full h-2 w-2 ${hasAI ? 'bg-emerald-500' : 'bg-slate-300'}`} />
          </span>
          {hasAI ? 'AI Ready' : '未配置 API'}
        </span>
      </div>
    </div>
  );
}
