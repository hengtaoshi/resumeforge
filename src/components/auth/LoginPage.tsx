import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import AnimatedCharacters from '@/components/ui/AnimatedCharacters'
import HoverButton from '@/components/ui/HoverButton'

// 16 个可选的用户头像（7 女 + 9 男）
const USER_AVATARS = [
  { file: 'f_v2seed_1003.svg', gender: 'female' },
  { file: 'f_v2seed_1005.svg', gender: 'female' },
  { file: 'f_v2seed_1020.svg', gender: 'female' },
  { file: 'f_v2seed_1049.svg', gender: 'female' },
  { file: 'f_v2seed_1066.svg', gender: 'female' },
  { file: 'f_v2seed_1099.svg', gender: 'female' },
  { file: 'f_v2seed_1113.svg', gender: 'female' },
  { file: 'm_v2seed_1004.svg', gender: 'male' },
  { file: 'm_v2seed_1006.svg', gender: 'male' },
  { file: 'm_v2seed_1013.svg', gender: 'male' },
  { file: 'm_v2seed_1019.svg', gender: 'male' },
  { file: 'm_v2seed_1029.svg', gender: 'male' },
  { file: 'm_v2seed_1088.svg', gender: 'male' },
  { file: 'm_v2seed_1110.svg', gender: 'male' },
  { file: 'm_v2seed_1114.svg', gender: 'male' },
  { file: 'm_v2seed_1116.svg', gender: 'male' },
]

export default function LoginPage() {
  const setLocalUser = useAuthStore((s) => s.setLocalUser)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState('')

  const handleSubmit = () => {
    const n = name.trim()
    const e = email.trim()
    if (!n) return
    if (e && !/^[^\s@]+@[^\s@]+$/.test(e)) return
    const avatarPath = selectedAvatar ? `avatars/users/${selectedAvatar}` : ''
    setLocalUser(n || '用户', e || 'local@user.com', avatarPath)
  }

  return (
    <div className="h-full grid lg:grid-cols-2 overflow-hidden">
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-gray-400 via-gray-500 to-gray-600 p-12 text-white">
        <div className="relative z-20 flex items-center gap-2 text-lg font-semibold">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4875E" strokeWidth="1.5" className="bg-white/10 backdrop-blur-sm p-1 rounded-lg">
            <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
          </svg>
          <span>ResumeForge</span>
        </div>
        <div className="relative z-20 flex items-end justify-center h-[500px]">
          <AnimatedCharacters isTyping={name.length > 0} showPassword={false} passwordLength={0} />
        </div>
        <div className="relative z-20 text-sm text-gray-600">
          <span>欢迎使用 ResumeForge</span>
        </div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCAyMCAyMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9zdmc+')] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-gray-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-gray-300/20 rounded-full blur-3xl" />
      </div>

      <div className="flex items-center justify-center p-8 bg-[#F4F2ED] dark:bg-slate-900 h-full">
        <div className="w-full max-w-[420px]">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 mb-2">欢迎使用</h1>
            <p className="text-slate-400 text-sm">填写基本信息开始使用 ResumeForge</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">昵称</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)}
                placeholder="你的名字"
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" autoFocus />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">邮箱（选填）</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 px-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm outline-none focus:border-[#D4875E] transition-colors" />
            </div>

            {/* ── 头像选择 ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                选择头像 <span className="text-slate-400 font-normal text-xs">（可选）</span>
              </label>
              <div className="grid grid-cols-8 gap-2 max-h-[160px] overflow-y-auto py-1">
                {USER_AVATARS.map((a) => {
                  const isSelected = selectedAvatar === a.file;
                  const border = a.gender === 'female'
                    ? 'border-pink-200 dark:border-pink-800'
                    : 'border-blue-200 dark:border-blue-800';
                  return (
                    <button key={a.file} type="button"
                      onClick={() => setSelectedAvatar(isSelected ? '' : a.file)}
                      className={`w-full aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                        isSelected ? 'border-[#D4875E] ring-2 ring-[#D4875E]/30 scale-105' : `${border} hover:border-slate-300`
                      }`}
                    >
                      <img src={`avatars/users/${a.file}`} alt="avatar" className="w-full h-full object-cover" />
                    </button>
                  );
                })}
              </div>
            </div>

            <HoverButton text="开始使用"
              onClick={handleSubmit} disabled={!name.trim()}
              className="w-full h-11 text-base" />
          </div>
        </div>
      </div>
    </div>
  )
}
