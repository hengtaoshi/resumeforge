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

  const isOn = status === 'downloaded'
  const isInstalling = status === 'downloading'

  return (
    <div style={{ fontFamily: '"Noto Sans SC","Plus Jakarta Sans",system-ui,sans-serif', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
      <style>{`
        .ul-label {
          background-color: transparent;
          border: 1.5px solid ${isInstalling ? '#D4875E' : isOn ? '#6A8D6A' : '#D4875E'};
          display: flex;
          align-items: center;
          border-radius: 50px;
          width: ${isOn ? 90 : isInstalling ? 36 : 100}px;
          cursor: pointer;
          transition: all .35s ease;
          padding: 3px;
          position: relative;
          opacity: ${status === 'checking' ? .6 : 1};
        }
        .ul-input { display: none; }
        .ul-title {
          font-size: 10px;
          color: ${isOn ? '#5A7A5A' : '#6B6560'};
          transition: all .35s ease;
          position: absolute;
          right: 10px;
          bottom: 8px;
          text-align: center;
          white-space: nowrap;
          font-weight: 500;
        }
        .ul-title:last-child { opacity: ${isOn ? 1 : 0}; visibility: ${isOn ? 'visible' : 'hidden'}; }

        .ul-circle {
          height: 26px; width: 26px;
          border-radius: 50%;
          background-color: ${isInstalling ? '#D4875E' : isOn ? 'transparent' : '#D4875E'};
          display: flex; justify-content: center; align-items: center;
          transition: all .35s ease;
          position: relative;
          overflow: hidden;
          flex-shrink: 0;
        }
        ${isInstalling ? `.ul-circle { animation: pulse 1s forwards; rotate: 180deg; }` : ''}
        ${isOn ? `.ul-circle { opacity: 0; visibility: hidden; }` : ''}

        .ul-circle .icon {
          color: #fff; width: 14px;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          transition: all .35s ease;
        }
        .ul-circle .square {
          aspect-ratio: 1; width: 10px;
          border-radius: 2px; background-color: #fff;
          opacity: 0; visibility: hidden;
          position: absolute; top: 50%; left: 50%;
          transform: translate(-50%,-50%);
          transition: all .35s ease;
        }
        .ul-circle::before {
          content: "";
          position: absolute; left: 0; top: 0;
          background-color: rgba(0,0,0,.15);
          width: 100%; height: 0;
          transition: all .35s ease;
        }
        ${isInstalling ? `.ul-circle::before { animation: installing 3s ease-in-out forwards; }
        .ul-circle .icon { opacity: 0; visibility: hidden; }
        .ul-circle .square { opacity: 1; visibility: visible; }` : ''}

        @keyframes pulse {
          0% { scale: .95; box-shadow: 0 0 0 0 rgba(212,135,94,.5); }
          70% { scale: 1; box-shadow: 0 0 0 10px rgba(255,255,255,0); }
          100% { scale: .95; box-shadow: 0 0 0 0 rgba(255,255,255,0); }
        }
        @keyframes installing { from { height: 0; } to { height: 100%; } }

        .ul-spinner { width: 14px; height: 14px; border: 2px solid rgba(255,255,255,.3); border-top-color: #fff; border-radius: 50%; animation: spin .6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .ul-percent { position: absolute; color: #fff; font-size: 8px; font-weight: 600; z-index: 2; }

        .ul-error { font-size: 10px; color: #D4875E; }
      `}</style>

      <span className="ul-label" onClick={handleClick} style={{ pointerEvents: status === 'checking' || status === 'downloading' ? 'none' : 'auto' }}>
        <input type="checkbox" className="ul-input" checked={isOn} readOnly />
        <span className="ul-circle">
          {status === 'checking' && <div className="ul-spinner" />}
          {status === 'downloading' && <><div className="ul-spinner" /><span className="ul-percent">{percent || 0}%</span></>}
          {status === 'idle' && (
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19V5m0 14-4-4m4 4 4-4" />
            </svg>
          )}
          {status === 'available' && (
            <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          )}
          {status === 'downloaded' && <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><polyline points="20 6 9 17 4 12" /></svg>}
          <div className="square" />
        </span>
        <span className="ul-title">
          {status === 'checking' ? '检查中' : status === 'idle' ? '检查更新' : status === 'available' ? '下载' : status === 'downloading' ? '下载中' : status === 'downloaded' ? '已就绪' : '重试'}
        </span>
        <span className="ul-title">
          {status === 'downloaded' ? '立即重启' : status === 'available' ? `v${version || ''}` : ''}
        </span>
      </span>
      {status === 'error' && <span className="ul-error">失败，点击重试</span>}
    </div>
  )
}
