import React, { useState, useEffect, useCallback } from 'react'
import toast from '@/lib/toast'

interface Interview { id: string; company: string; role: string; type: string; note: string | null; created_at: string }

interface Props { onClose: () => void; onUpdate: () => void }

const ENCOURAGEMENTS = [
  '太棒了！机会是留给有准备的人 💪',
  '又进一步！离 offer 更近了 🎉',
  '每一次面试都是成长 🌱',
  '优秀的你，值得更好的机会 ✨',
  '面一次少一次，总有一次会中的！🔥',
  '你已经比昨天的自己更厉害了 🚀',
  '好事多磨，Offer 在路上 📮',
  '自信的你最有魅力 💫',
  '保持节奏，胜利在望 🏆',
  '每一步都算数，加油！⭐',
]

const CONFETTI_COLORS = ['#14b8a6', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

export default function InterviewModal({ onClose, onUpdate }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState('tech')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [celebrate, setCelebrate] = useState<string | null>(null)

  const load = () => window.electronAPI!.getInterviews().then(setInterviews)

  useEffect(() => { load() }, [])

  const handleAdd = async () => {
    if (!company.trim() || !role.trim()) return toast.warning('公司名和职位不能为空')
    setAdding(true)
    try {
      await window.electronAPI!.addInterview({ company: company.trim(), role: role.trim(), type, note: note.trim() || undefined })
      setCompany(''); setRole(''); setNote('')
      await load()
      onUpdate()
      // 彩蛋 🎉
      const msg = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)]
      setCelebrate(msg)
      setTimeout(() => setCelebrate(null), 3000)
    } catch { toast.error('保存失败') }
    setAdding(false)
  }

  const handleDelete = async (id: string) => {
    await window.electronAPI!.deleteInterview(id)
    await load()
    onUpdate()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-[520px] max-h-[80vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold" style={{ color: '#1E293B' }}>面试记录</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
            <i className="ph-light ph-x text-lg" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 pt-4 pb-3 border-b border-slate-100 space-y-3">
          <div className="flex gap-3">
            <input value={company} onChange={e => setCompany(e.target.value)} placeholder="公司名称" maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="职位" maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
          </div>
          <div className="flex gap-3">
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors bg-white">
              <option value="tech">技术面</option>
              <option value="hr">HR面</option>
              <option value="behavior">行为面</option>
              <option value="online">在线笔试</option>
              <option value="other">其他</option>
            </select>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="备注（选填）" maxLength={200}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-teal-400 transition-colors" />
            <button onClick={handleAdd} disabled={adding}
              className="px-5 py-2 rounded-lg text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 disabled:opacity-50 transition-colors whitespace-nowrap">
              {adding ? '保存中...' : '新增面试'}
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {interviews.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">还没有面试记录</p>
          ) : interviews.map(iv => (
            <div key={iv.id} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 group">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <i className="ph-light ph-video-camera text-sm text-amber-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800">{iv.company} <span className="text-slate-400 font-normal">· {iv.role}</span></p>
                <p className="text-xs text-slate-400 mt-0.5">
                  <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-600 mr-2">
                    {{ tech: '技术面', hr: 'HR面', behavior: '行为面', online: '在线笔试', other: '其他' }[iv.type] || iv.type}
                  </span>
                  {new Date(iv.created_at).toLocaleDateString('zh-CN')}
                </p>
                {iv.note && <p className="text-xs text-slate-400 mt-0.5">{iv.note}</p>}
              </div>
              <button onClick={() => handleDelete(iv.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all">
                <i className="ph-light ph-trash text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Confetti + 鼓励语（情绪价值彩蛋） ── */}
      {celebrate && (
        <>
          <div className="fixed inset-0 pointer-events-none z-[60] overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div key={i}
                className="absolute animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  width: `${6 + Math.random() * 8}px`,
                  height: `${6 + Math.random() * 8}px`,
                  backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                  borderRadius: Math.random() > 0.5 ? '50%' : '2px',
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1.5 + Math.random() * 1.5}s`,
                }}
              />
            ))}
          </div>
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none">
            <div className="bg-white/90 backdrop-blur rounded-2xl px-8 py-6 shadow-2xl animate-bounce-in text-center">
              <p className="text-lg font-semibold" style={{ color: '#1E293B' }}>{celebrate}</p>
            </div>
          </div>
        </>
      )}

      {/* confetti keyframes injected once */}
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(0) rotate(0deg); opacity: 1; }
          100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
        }
        @keyframes bounce-in {
          0% { transform: scale(0.5); opacity: 0; }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-confetti {
          animation: confetti-fall 2s ease-in forwards;
        }
        .animate-bounce-in {
          animation: bounce-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
