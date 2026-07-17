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

  const handleClose = useCallback(() => { window.electronAPI?.close() }, [])

  return (
    <div className="h-full flex items-center justify-center" style={{ backgroundColor: '#F4F2ED' }}>
      <button onClick={handleClose}
        className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
        aria-label="关闭窗口">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <div className="auth-container">
        <div className="auth-form_area">
          <p className="auth-title">{mode === 'register' ? 'SIGN UP' : 'LOGIN'}</p>

          <div className="auth-tabs">
            <button onClick={() => switchMode('register')}
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}>注册</button>
            <button onClick={() => switchMode('login')}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}>登录</button>
          </div>

          {mode === 'register' ? (
            <>
              <div className="auth-form_group">
                <label className="auth-sub_title">邮箱</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="auth-form_style" autoFocus />
              </div>
              <div className="auth-form_group">
                <label className="auth-sub_title">验证码</label>
                <div className="auth-code-row">
                  <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6位验证码" maxLength={6} className="auth-form_style" />
                  <button onClick={handleSendCode} disabled={sending || countdown > 0} className="auth-code-btn">
                    {countdown > 0 ? `${countdown}s` : sending ? '发送中' : '发送验证码'}
                  </button>
                </div>
              </div>
              <div className="auth-form_group">
                <label className="auth-sub_title">设置密码</label>
                <input type={showPw ? 'text' : 'password'} value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="至少8位，包含字母和数字" className="auth-form_style" />
              </div>
              <div className="auth-form_group">
                <label className="auth-sub_title">确认密码</label>
                <input type={showPw ? 'text' : 'password'} value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  placeholder="再次输入密码" className="auth-form_style" />
              </div>
              <button onClick={handleRegister} disabled={submitting} className="auth-btn">
                {submitting ? '注册中...' : '注册'}
              </button>
              <p className="auth-switch">
                注册即表示你同意 <button onClick={() => setShowDisclaimer(true)} className="auth-link" style={{background:'none',border:'none',cursor:'pointer',fontSize:'inherit'}}>免责声明</button>
              </p>
            </>
          ) : (
            <>
              <div className="auth-form_group">
                <label className="auth-sub_title">邮箱</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" className="auth-form_style" autoFocus />
              </div>
              <div className="auth-form_group">
                <label className="auth-sub_title">密码</label>
                <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="输入密码" className="auth-form_style" />
              </div>
              <button onClick={handleLogin} disabled={submitting} className="auth-btn">
                {submitting ? '登录中...' : '登录'}
              </button>
              <p className="auth-switch">
                还没有账号？<button onClick={() => switchMode('register')} className="auth-link" style={{background:'none',border:'none',cursor:'pointer',fontSize:'inherit'}}>立即注册</button>
              </p>
            </>
          )}
        </div>
      </div>

      {showDisclaimer && <Disclaimer onClose={() => setShowDisclaimer(false)} />}
    </div>
  )
}
