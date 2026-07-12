import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import toast from '@/lib/toast'
import Disclaimer from './Disclaimer'

type Mode = 'login' | 'register'

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return '密码长度不能少于 8 位'
  if (!/[a-zA-Z]/.test(pw)) return '密码必须包含字母'
  if (!/[0-9]/.test(pw)) return '密码必须包含数字'
  return null
}

export default function LoginPage() {
  const { sendCode, register, login } = useAuthStore()
  const [mode, setMode] = useState<Mode>('register')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [showDisclaimer, setShowDisclaimer] = useState(false)

  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown(c => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  const switchMode = useCallback((m: Mode) => {
    setMode(m)
    setPassword('')
    setConfirm('')
    setCode('')
  }, [])

  const handleSendCode = useCallback(async () => {
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) { toast.error('请输入有效邮箱', 3000); return }
    setSending(true)
    try {
      await sendCode(email)
      setCountdown(60)
    } catch (e: any) { toast.error(e?.message || '发送失败', 3000) }
    setSending(false)
  }, [email, sendCode])

  const handleRegister = useCallback(async () => {
    if (!/^[^\s@]+@[^\s@]+$/.test(email)) { toast.error('请输入有效邮箱', 3000); return }
    if (code.length !== 6) { toast.error('请输入6位验证码', 3000); return }
    const pwErr = validatePassword(password)
    if (pwErr) { toast.error(pwErr, 3000); return }
    if (password !== confirm) { toast.error('两次密码输入不一致', 3000); return }
    setSubmitting(true)
    try {
      await register(email, code, password)
    } catch (e: any) { toast.error(e?.message || '注册失败', 3000) }
    setSubmitting(false)
  }, [email, code, password, confirm, register])

  const handleLogin = useCallback(async () => {
    if (!email || !password) { toast.error('请输入邮箱和密码', 3000); return }
    setSubmitting(true)
    try {
      await login(email, password)
    } catch (e: any) { toast.error(e?.message || '登录失败', 3000) }
    setSubmitting(false)
  }, [email, password, login])

  // Allow closing the app from login/register page
  const handleClose = useCallback(() => {
    window.electronAPI?.close()
  }, [])

  return (
    <div className="h-full flex items-center justify-center bg-[#F8F7F4]">
      {/* Close button */}
      <button onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        aria-label="关闭窗口">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="w-full max-w-sm mx-4">
        {/* Brand */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-sky-500 mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
              <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-slate-800">ResumeForge</h1>
          <p className="text-sm text-slate-500 mt-1">简历优化与求职辅助工具</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl border border-slate-200">
          {/* Tabs */}
          <div className="flex border-b border-slate-200">
            <button onClick={() => switchMode('register')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'register' ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>注册</button>
            <button onClick={() => switchMode('login')}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${mode === 'login' ? 'text-sky-600 border-b-2 border-sky-500' : 'text-slate-400 hover:text-slate-600'}`}>登录</button>
          </div>

          <div className="p-6 space-y-4">
            {mode === 'register' ? (
              /* ── 注册：所有字段在同一页 ── */
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    autoFocus />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">验证码</label>
                  <div className="flex gap-2">
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6位验证码" maxLength={6}
                      className="flex-1 px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm text-center tracking-[6px] font-mono focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                    <button onClick={handleSendCode} disabled={sending || countdown > 0}
                      className="px-4 py-2.5 bg-sky-50 text-sky-600 rounded-lg text-xs font-medium hover:bg-sky-100 disabled:opacity-50 transition-colors whitespace-nowrap">
                      {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">设置密码</label>
                  <div className="relative">
                    <input type={showPw ? 'text' : 'password'} value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="至少8位，包含字母和数字"
                      className="w-full px-3.5 py-2.5 pr-10 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPw
                        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">确认密码</label>
                  <input type={showPw ? 'text' : 'password'} value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="再次输入密码"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                </div>
                <button onClick={handleRegister} disabled={submitting}
                  className="w-full py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
                  {submitting ? '注册中...' : '注册'}
                </button>
                <p className="text-xs text-slate-400 text-center">
                  注册即表示你同意 <button onClick={() => setShowDisclaimer(true)} className="text-sky-500 hover:underline">免责声明</button>
                </p>
              </>
            ) : (
              /* ── 登录：邮箱 + 密码 ── */
              <>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">邮箱</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500"
                    autoFocus />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">密码</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-500" />
                </div>
                <button onClick={handleLogin} disabled={submitting}
                  className="w-full py-2.5 bg-sky-500 text-white rounded-lg text-sm font-medium hover:bg-sky-600 disabled:opacity-50 transition-colors">
                  {submitting ? '登录中...' : '登录'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDisclaimer && <Disclaimer onClose={() => setShowDisclaimer(false)} />}
    </div>
  )
}
