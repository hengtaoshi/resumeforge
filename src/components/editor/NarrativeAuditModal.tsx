import { useState } from 'react'
import type { Resume } from '@/types/resume'
import { buildNarrativePrompt } from '@/lib/ai/prompts/narrative'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { extractJSON } from '@/lib/ai/provider'
import toast from '@/lib/toast'

interface NarrativeResult {
  storyType: string
  storyLabel: string
  coherence: { score: number; issues: string[]; suggestion: string }
  narrativeQuality: { score: number; issues: string[]; suggestion: string }
  identityConsistency: { score: number; issues: string[]; suggestion: string }
  coreStrengths: string[]
  redFlags: string[]
  overallSuggestion: string
}

export default function NarrativeAuditModal({ resume, onClose }: { resume: Resume; onClose: () => void }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<NarrativeResult | null>(null)

  const handleAnalyze = async () => {
    if (!isAIConfigured()) { toast.warning('请先配置 AI 提供商'); return }
    setLoading(true)
    try {
      const { system, messages } = buildNarrativePrompt(resume)
      const text = await askAI([{ role: 'system', content: system }, ...messages])
      const parsed = extractJSON<NarrativeResult>(text)
      if (parsed?.storyType) {
        setResult(parsed)
      } else {
        toast.error('AI 返回格式异常，请重试')
      }
    } catch (e: any) {
      toast.error(e?.message || '分析失败')
    } finally {
      setLoading(false)
    }
  }

  function ScoreBadge({ score, label }: { score: number; label: string }) {
    const color = score >= 4 ? 'text-emerald-600 bg-emerald-50' : score >= 3 ? 'text-amber-600 bg-amber-50' : 'text-red-600 bg-red-50'
    return <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>{label} {score}/5</span>
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-[600px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="text-lg font-bold text-slate-800">简历叙事审计</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">&times;</button>
        </div>
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!result && !loading && (
            <div className="text-center py-8 text-slate-400 text-sm space-y-3">
              <p>AI 将分析你的简历在讲什么职业故事</p>
              <button onClick={handleAnalyze} className="px-6 py-2.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-sm font-medium transition-colors">
                开始分析
              </button>
            </div>
          )}
          {loading && (
            <div className="flex flex-col items-center py-8 gap-3">
              <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-slate-400">正在分析叙事结构...</p>
            </div>
          )}
          {result && (
            <>
              <div className="bg-teal-50 rounded-lg p-4">
                <p className="text-xs text-[#D4875E] font-medium mb-1">职业故事类型</p>
                <p className="text-lg font-bold text-slate-800">{result.storyType}</p>
                <p className="text-sm text-slate-600 mt-1">{result.storyLabel}</p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg border">
                  <ScoreBadge score={result.coherence.score} label="连贯性" />
                  <ul className="mt-2 space-y-1">
                    {result.coherence.issues.map((s, i) => <li key={i} className="text-xs text-slate-500">• {s}</li>)}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border">
                  <ScoreBadge score={result.narrativeQuality.score} label="叙事质量" />
                  <ul className="mt-2 space-y-1">
                    {result.narrativeQuality.issues.map((s, i) => <li key={i} className="text-xs text-slate-500">• {s}</li>)}
                  </ul>
                </div>
                <div className="p-3 rounded-lg border">
                  <ScoreBadge score={result.identityConsistency.score} label="身份一致性" />
                  <ul className="mt-2 space-y-1">
                    {result.identityConsistency.issues.map((s, i) => <li key={i} className="text-xs text-slate-500">• {s}</li>)}
                  </ul>
                </div>
              </div>

              {result.coreStrengths.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">核心优势</p>
                  <div className="flex flex-wrap gap-2">
                    {result.coreStrengths.map((s, i) => (
                      <span key={i} className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-lg">{s}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.redFlags.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 uppercase mb-2">需要注意</p>
                  <ul className="space-y-1">
                    {result.redFlags.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-red-600">
                        <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-xs font-semibold text-slate-500 uppercase mb-1">全局建议</p>
                <p className="text-sm text-slate-700">{result.overallSuggestion}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
