import { useState, useCallback, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import toast from '@/lib/toast'
import Disclaimer from './Disclaimer'
import AnimatedCharacters from '@/components/ui/AnimatedCharacters'
import HoverButton from '@/components/ui/HoverButton'

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
  const [isTyping, setIsTyping] = useState(false)
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

  return (
    <div className="h-full grid lg:grid-cols-2 overflow-hidden">
      {/* Left: Animated Characters */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 p-12 text-white">
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4875E" strokeWidth="1.5" className="bg-white/10 backdrop-blur-sm p-1 rounded-lg">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span>ResumeForge</span>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <AnimatedCharacters isTyping={isTyping} showPassword={showPw} passwordLength={password.length} />
        </div>

        <div className="relative z-20">
          <button onClick={() => setShowDisclaimer(true)}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors bg-transparent border-none cursor-pointer">
            免责声明
          </button>
        </div>

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 rounded-full blur-3xl" />
      </div>

      {/* Right: Login Form */}
      <div className="flex items-center justify-center p-8 bg-[#F4F2ED] dark:bg-slate-900 h-full">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">
              {mode === 'register' ? '创建账号' : '欢迎回来'}
            </h1>
            <p className="text-slate-400 text-sm">
              {mode === 'register' ? '注册开始使用 ResumeForge' : '请登录你的账号'}
            </p>
          </div>

          {/* Mode Tabs */}
          <div className="flex mb-6 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            <button onClick={() => switchMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>注册</button>
            <button onClick={() => switchMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>登录</button>
          </div>

          {mode === 'register' ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">验证码</label>
                <div className="flex gap-2">
                  <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6位验证码" maxLength={6}
                    className="flex-1 h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" />
                  <button onClick={handleSendCode} disabled={sending || countdown > 0}
                    className="px-4 h-11 text-sm font-medium rounded-lg bg-[#D4875E] text-white hover:bg-[#E09A72] disabled:opacity-50 transition-colors shrink-0">
                    {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">设置密码</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="至少8位，包含字母和数字"
                    className="w-full h-11 px-3 pr-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? (
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">确认密码</label>
                <input type={showPw ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="再次输入密码"
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" />
              </div>
              <HoverButton text={submitting ? '注册中...' : '注册'}
                onClick={handleRegister} disabled={submitting}
                className="w-full h-11 text-base" />
              <p className="text-xs text-slate-400 text-center">
                注册即表示你同意 <button onClick={() => setShowDisclaimer(true)} className="text-[#D4875E] hover:underline bg-transparent border-none cursor-pointer text-xs">免责声明</button>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  onFocus={() => setIsTyping(true)} onBlur={() => setIsTyping(false)}
                  placeholder="you@example.com"
                  className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" autoFocus />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">密码</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="输入密码"
                    className="w-full h-11 px-3 pr-10 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPw ? (
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    ) : (
                      <svg className="size-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                    )}
                  </button>
                </div>
              </div>
              <HoverButton text={submitting ? '登录中...' : '登录'}
                onClick={handleLogin} disabled={submitting}
                className="w-full h-11 text-base" />
              <p className="text-xs text-slate-400 text-center">
                还没有账号？<button onClick={() => switchMode('register')} className="text-[#D4875E] hover:underline bg-transparent border-none cursor-pointer text-xs">立即注册</button>
              </p>
            </div>
          )}
        </div>
      </div>

      {showDisclaimer && <Disclaimer onClose={() => setShowDisclaimer(false)} />}
    </div>
  )
}
