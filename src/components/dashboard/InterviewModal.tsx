import React, { useState, useEffect } from 'react'
import toast from '@/lib/toast'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { buildReviewPrompt } from '@/lib/ai/prompts/review'

interface Interview { id: string; company: string; role: string; type: string; note: string | null; review: string | null; created_at: string }

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

const CONFETTI_COLORS = ['#D4875E', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// ponytail: minimal markdown renderer for review result
function RenderMarkdown({ text }: { text: string }) {
  const lines = text.split('\n')
  const els: React.ReactNode[] = []
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    if (l.startsWith('### ')) els.push(<h3 key={i} className="text-base font-semibold mt-4 mb-2" style={{ color: '#0f172a' }}>{l.slice(4)}</h3>)
    else if (l.startsWith('## ')) els.push(<h2 key={i} className="text-lg font-bold mt-5 mb-2" style={{ color: '#0f172a' }}>{l.slice(3)}</h2>)
    else if (l.startsWith('- ')) els.push(<li key={i} className="text-sm ml-4 text-slate-600">{l.slice(2)}</li>)
    else if (/^[1-3]\. /.test(l)) els.push(<li key={i} className="text-sm ml-4 text-slate-600">{l}</li>)
    else if (l.trim() === '') els.push(<div key={i} className="h-2" />)
    else els.push(<p key={i} className="text-sm text-slate-600 leading-relaxed">{l}</p>)
  }
  return <div className="prose prose-sm max-w-none" style={{ color: '#1E293B' }}>{els}</div>
}

export default function InterviewModal({ onClose, onUpdate }: Props) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [type, setType] = useState('tech')
  const [note, setNote] = useState('')
  const [adding, setAdding] = useState(false)
  const [celebrate, setCelebrate] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNotes, setReviewNotes] = useState('')
  const [reviewResult, setReviewResult] = useState<string | null>(null)
  const [reviewing, setReviewing] = useState(false)

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

  const startReview = (iv: Interview) => {
    setReviewingId(iv.id)
    setReviewNotes(iv.review ? '' : '')  // if already reviewed, start fresh
    setReviewResult(iv.review)
  }

  const submitReview = async () => {
    if (!reviewingId || !reviewNotes.trim()) return toast.warning('请填写面试复盘笔记')
    if (!isAIConfigured()) return toast.warning('请先在设置中配置 AI 服务')
    setReviewing(true)
    setReviewResult(null)
    try {
      const iv = interviews.find(i => i.id === reviewingId)
      if (!iv) return
      const { system, messages } = buildReviewPrompt(iv.company, iv.role, iv.type, reviewNotes)
      const text = await askAI([{ role: 'system', content: system }, ...messages])
      setReviewResult(text)
      await window.electronAPI!.saveReview(reviewingId, text)
      toast.success('复盘完成 ✅')
    } catch (err: any) {
      toast.error('复盘失败: ' + (err.message || String(err)))
    }
    setReviewing(false)
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
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
            <input value={role} onChange={e => setRole(e.target.value)} placeholder="职位" maxLength={100}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
          </div>
          <div className="flex gap-3">
            <select value={type} onChange={e => setType(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors bg-white">
              <option value="tech">技术面</option>
              <option value="hr">HR面</option>
              <option value="behavior">行为面</option>
              <option value="online">在线笔试</option>
              <option value="other">其他</option>
            </select>
            <input value={note} onChange={e => setNote(e.target.value)} placeholder="备注（选填）" maxLength={200}
              className="flex-1 px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-accent transition-colors" />
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
                <button onClick={() => startReview(iv)}
                  className={`mt-1.5 text-xs px-2 py-0.5 rounded-full border transition-colors ${iv.review ? 'bg-teal-50 text-[#D4875E] border-teal-200 hover:bg-teal-100' : 'text-slate-400 border-slate-200 hover:border-accent hover:text-teal-500'}`}>
                  <i className="ph-light ph-arrows-clockwise text-xs mr-0.5" />复盘
                </button>
              </div>
              <button onClick={() => handleDelete(iv.id)} className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded hover:bg-red-50 flex items-center justify-center text-slate-300 hover:text-red-400 transition-all">
                <i className="ph-light ph-trash text-sm" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Review Panel ── */}
      {reviewingId && (
        <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/30" onClick={() => setReviewingId(null)}>
          <div className="bg-white rounded-2xl shadow-xl w-[600px] max-h-[85vh] flex flex-col mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-semibold" style={{ color: '#1E293B' }}>📋 面试复盘</h2>
              <button onClick={() => setReviewingId(null)} className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400">
                <i className="ph-light ph-x text-lg" />
              </button>
            </div>

            {reviewResult ? (
              /* ── Review Result ── */
              <div className="flex-1 overflow-y-auto p-6">
                <RenderMarkdown text={reviewResult} />
                <button onClick={() => { setReviewingId(null); setReviewResult(null) }}
                  className="mt-4 w-full py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover transition-colors">
                  返回面试记录
                </button>
              </div>
            ) : (
              /* ── Review Form ── */
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-sm text-slate-500 mb-4">
                  详细描述你的面试过程：面试官问了哪些问题？你是如何回答的？哪些地方感觉好、哪些感觉不好？描述越详细，复盘分析越有针对性。
                </p>
                <textarea value={reviewNotes} onChange={e => setReviewNotes(e.target.value)}
                  placeholder="例如：面试官先让我做了自我介绍，然后问了一个系统设计题…\n我回答的时候感觉在XXX方面不够好…\n面试官追问了XXX，我当时没答上来…"
                  className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-accent transition-colors resize-none"
                  style={{ color: '#1E293B' }} />
                <button onClick={submitReview} disabled={reviewing || !reviewNotes.trim()}
                  className="mt-3 w-full py-2.5 rounded-lg text-sm font-medium text-white bg-accent hover:bg-accent-hover disabled:opacity-50 transition-colors">
                  {reviewing ? '🤔 AI 正在分析...' : '🚀 提交复盘'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
