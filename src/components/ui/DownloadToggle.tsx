import React from 'react'

interface Props {
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error'
  version?: string
  percent?: number
  onCheck?: () => void
  onDownload?: () => void
  onInstall?: () => void
}

export default function DownloadToggle({ status, version, percent, onCheck, onDownload, onInstall }: Props) {
  const handleClick = () => {
    if (status === 'checking' || status === 'downloading') return
    if (status === 'available') { onDownload?.(); return }
    if (status === 'downloaded') { onInstall?.(); return }
    onCheck?.()
  }

  const downloading = status === 'downloading'
  const done = status === 'downloaded'
  const pct = Math.min(100, Math.max(0, percent ?? 0))

  return (
    <div className="dl-container">
      <style>{`
        .dl-container { padding: 0; margin: 0; display: flex; justify-content: center; align-items: center; }
        .dl-label {
          background-color: transparent;
          border: 1.5px solid ${done ? '#6A8D6A' : '#D4875E'};
          display: flex; align-items: center;
          border-radius: 50px;
          width: ${done ? 90 : downloading ? 36 : 100}px;
          cursor: pointer;
          transition: all .4s ease;
          padding: 3px;
          position: relative;
          opacity: ${status === 'checking' ? 0.6 : 1};
        }
        .dl-label::before {
          content: "";
          position: absolute;
          top: 0; bottom: 0; left: 0; right: 0;
          background-color: #fff;
          width: 5px; height: 5px;
          transition: all .4s ease;
          border-radius: 100%;
          margin: auto;
          opacity: ${downloading ? 1 : 0};
          visibility: ${downloading ? 'visible' : 'hidden'};
          ${downloading ? 'animation: dl-rotate 3s ease-in-out .4s forwards;' : ''}
        }
        .dl-label .dl-input { display: none; }
        .dl-label .dl-title {
          font-size: 10px;
          color: ${done ? '#5A7A5A' : '#6B6560'};
          transition: all .4s ease;
          position: absolute;
          right: ${done ? 32 : 10}px;
          bottom: 9px;
          text-align: center;
          font-weight: 500;
          line-height: 1;
          opacity: ${downloading ? 0 : 1};
          visibility: ${downloading ? 'hidden' : 'visible'};
        }
        .dl-label .dl-title:last-child { opacity: ${done ? 1 : 0}; visibility: ${done ? 'visible' : 'hidden'}; right: ${done ? 32 : 10}px; color: ${done ? '#5A7A5A' : '#6B6560'}; }
        .dl-label .dl-circle {
          height: 26px; width: 26px;
          border-radius: 50%;
          background-color: ${done ? 'transparent' : '#D4875E'};
          display: flex; justify-content: center; align-items: center;
          transition: all .4s ease;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
          ${downloading ? 'animation: dl-pulse 1s forwards; rotate: 180deg;' : ''}
          ${done ? 'opacity: 0; visibility: hidden;' : ''}
        }
        .dl-label .dl-circle .dl-icon {
          color: #fff; width: 16px;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          transition: all .4s ease;
          ${downloading ? 'opacity: 0; visibility: hidden;' : ''}
        }
        .dl-label .dl-circle .dl-square {
          aspect-ratio: 1; width: 10px;
          border-radius: 2px; background-color: #fff;
          opacity: ${downloading ? 1 : 0};
          visibility: ${downloading ? 'visible' : 'hidden'};
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          transition: all .4s ease;
        }
        .dl-label .dl-circle::before {
          content: "";
          position: absolute; left: 0; top: 0;
          background-color: rgba(0,0,0,0.12);
          width: 100%; height: ${downloading ? pct : 0}%;
          transition: height .3s ease;
        }
        @keyframes dl-pulse {
          0% { scale: .95; box-shadow: 0 0 0 0 rgba(212,135,94,0.5); }
          70% { scale: 1; box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { scale: .95; box-shadow: 0 0 0 0 rgba(212,135,94,0); }
        }
        @keyframes dl-rotate {
          0% { transform: rotate(-90deg) translate(16px) rotate(0); opacity: 1; visibility: visible; }
          99% { transform: rotate(270deg) translate(16px) rotate(270deg); opacity: 1; visibility: visible; }
          100% { opacity: 0; visibility: hidden; }
        }
        .dl-spinner { width: 16px; height: 16px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: dl-spin .6s linear infinite; }
        @keyframes dl-spin { to { transform: rotate(360deg); } }
        .dl-error { font-size: 10px; color: #D4875E; cursor: pointer; margin-left: 6px; }
      `}</style>

      <span className="dl-label" onClick={handleClick} style={{ pointerEvents: status === 'checking' || downloading ? 'none' : 'auto' }}>
        <input type="checkbox" className="dl-input" checked={done} readOnly />
        <span className="dl-circle">
          {status === 'checking' && <div className="dl-spinner" />}
          {status === 'idle' && (
            <svg className="dl-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 19V5m0 14-4-4m4 4 4-4" />
            </svg>
          )}
          {status === 'available' && (
            <svg className="dl-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          {downloading && <span style={{ color: '#fff', fontSize: 14, fontWeight: 600, zIndex: 2, position: 'relative' }}>{pct}%</span>}
          {done && (
            <svg className="dl-icon" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
          <div className="dl-square" />
        </span>
        <span className="dl-title">
          {status === 'checking' ? '检查中' : status === 'idle' ? '检查更新' : status === 'available' ? '下载' : downloading ? '下载中' : '已就绪'}
        </span>
        <span className="dl-title">
          {done ? '立即重启' : ''}
        </span>
      </span>
      {status === 'error' && <span className="dl-error" onClick={onCheck}>失败，点击重试</span>}
    </div>
  )
}
