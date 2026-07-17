import { useState, useRef, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'

export default function UserMenu({ onOpenLogin }: { onOpenLogin: () => void }) {
  const { user, logout } = useAuthStore()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  if (!user) {
    return (
      <button
        onClick={onOpenLogin}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[rgba(212,135,94,0.10)] text-[#D4875E] hover:bg-[rgba(212,135,94,0.10)] text-xs font-medium transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
          <polyline points="10 17 15 12 10 7" />
          <line x1="15" y1="12" x2="3" y2="12" />
        </svg>
        登录
      </button>
    )
  }

  const initial = user.nickname?.charAt(0)?.toUpperCase() || '?'

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 transition-colors"
      >
        {user.avatar ? (
          <img src={user.avatar} alt="" className="w-6 h-6 rounded-full" />
        ) : (
          <span className="w-6 h-6 rounded-full bg-[#D4875E] text-white text-[11px] font-semibold flex items-center justify-center">
            {initial}
          </span>
        )}
        <span className="text-xs text-slate-700 max-w-[80px] truncate">{user.nickname || user.email}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50">
          <div className="px-3.5 py-2 border-b border-slate-100">
            <p className="text-xs font-medium text-slate-700 truncate">{user.nickname || user.email}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">邮箱登录</p>
          </div>
          <button
            onClick={() => { logout(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3.5 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            退出登录
          </button>
        </div>
      )}
    </div>
  )
}
