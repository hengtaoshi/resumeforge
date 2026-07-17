import { useState } from 'react'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { extractJSON } from '@/lib/ai/provider'
import toast from '@/lib/toast'

interface FormData {
  currentRole: string; industry: string; experience: string
  skills: string; education: string; interests: string; targetDirection: string
}

interface AssessmentResult {
  suitableDirections: { title: string; match: number; reason: string }[]
  strengthSummary: string
  gapAnalysis: { area: string; severity: 'high' | 'medium' | 'low'; advice: string }[]
  skillTransfer: { from: string; to: string; transferability: number }[]
  recommendedActions: string[]
}

export default function CareerAssess() {
  const [step, setStep] = useState<'form' | 'result'>('form')
  const [form, setForm] = useState<FormData>({ currentRole: '', industry: '', experience: '', skills: '', education: '', interests: '', targetDirection: '' })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AssessmentResult | null>(null)

  const handleSubmit = async () => {
    if (!isAIConfigured()) { toast.warning('请先配置 AI 提供商'); return }
    if (!form.currentRole || !form.skills) { toast.warning('请至少填写当前职位和技能'); return }
    setLoading(true)
    try {
      const text = await askAI([{ role: 'user', content: `你是一位资深职业规划师。基于以下信息进行职业定位分析：

当前职位：${form.currentRole}  行业：${form.industry || '未填写'}  经验：${form.experience || '未填写'}
核心技能：${form.skills}  教育：${form.education || '未填写'}  兴趣：${form.interests || '未填写'}  目标方向：${form.targetDirection || '未明确'}

返回 JSON：
{
  "suitableDirections": [{ "title": "推荐方向", "match": 0-100, "reason": "理由" }],
  "strengthSummary": "核心优势总结",
  "gapAnalysis": [{ "area": "短板", "severity": "high/medium/low", "advice": "提升建议" }],
  "skillTransfer": [{ "from": "现有技能", "to": "目标技能", "transferability": 0-100 }],
  "recommendedActions": ["行动1", "行动2"]
}` }])
      const parsed = extractJSON<AssessmentResult>(text)
      if (parsed?.suitableDirections) { setResult(parsed); setStep('result') }
      else { toast.error('返回格式异常') }
    } catch (e: any) { toast.error(e?.message || '分析失败') }
    finally { setLoading(false) }
  }

  if (step === 'result' && result) {
    return (
      <div className="max-w-3xl space-y-5">
        <button onClick={() => { setStep('form'); setResult(null) }} className="text-sm text-[#D4875E] hover:text-[#D4875E]">← 重新填写</button>
        <div className="bg-emerald-50 rounded-xl p-5">
          <p className="text-xs text-emerald-600 font-medium mb-1">核心优势</p>
          <p className="text-sm text-slate-700">{result.strengthSummary}</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 mb-3">推荐方向</p>
          {result.suitableDirections.map((d, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[rgba(0,0,0,0.06)] flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center text-sm font-bold text-[#D4875E]">{d.match}%</div>
              <div><p className="text-sm font-medium text-slate-800">{d.title}</p><p className="text-xs text-slate-500">{d.reason}</p></div>
            </div>
          ))}
        </div>
        {result.skillTransfer.length > 0 && (
          <div>
            <p className="text-sm font-semibold text-slate-700 mb-3">技能可迁移性</p>
            {result.skillTransfer.map((s, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-white rounded-lg border border-[rgba(0,0,0,0.06)] mb-2">
                <span className="text-xs w-28 text-right text-slate-600">{s.from}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${s.transferability}%` }} />
                </div>
                <span className="text-xs w-28 text-slate-500">{s.to}</span>
                <span className="text-xs font-bold text-[#D4875E] w-8 text-right">{s.transferability}%</span>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white rounded-xl p-5 border border-[rgba(0,0,0,0.06)]">
          <p className="text-sm font-semibold text-slate-700 mb-3">改进方向</p>
          {result.gapAnalysis.map((g, i) => (
            <div key={i} className="flex items-start gap-3 mb-3">
              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${g.severity === 'high' ? 'bg-red-400' : g.severity === 'medium' ? 'bg-amber-400' : 'bg-sky-400'}`} />
              <div><p className="text-sm font-medium text-slate-700">{g.area}</p><p className="text-xs text-slate-500">{g.advice}</p></div>
            </div>
          ))}
        </div>
        <div className="bg-[rgba(212,135,94,0.10)] rounded-xl p-5">
          <p className="text-xs font-semibold text-[#D4875E] uppercase mb-2">建议行动</p>
          <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">{result.recommendedActions.map((a, i) => <li key={i}>{a}</li>)}</ol>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-slate-500">填写职业背景，AI 将分析适合你的发展方向和能力短板。</p>
      {(/* eslint-disable */ [['currentRole', '当前职位 *'], ['industry', '所在行业'], ['experience', '经验年限'], ['skills', '核心技能 *'], ['education', '教育背景'], ['interests', '兴趣方向'], ['targetDirection', '目标方向（如有）']] as const).map(([key, label]) => (
        <div key={key}>
          <label className="block text-xs text-slate-500 mb-1">{label}</label>
          <input value={form[key]} onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
            className="w-full px-3 py-2 text-sm border border-[rgba(0,0,0,0.10)] rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-300" />
        </div>
      ))}
      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-2.5 bg-accent hover:bg-accent-hover disabled:bg-teal-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2">
        {loading && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
        {loading ? '分析中...' : '开始职业定位分析'}
      </button>
    </div>
  )
}
