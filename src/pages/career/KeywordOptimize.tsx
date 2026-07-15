import { useState } from 'react'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { useResumeStore } from '@/stores/resumeStore'
import toast from '@/lib/toast'

interface KeywordItem {
  word: string
  score: number
  inResume: boolean
}

interface AnalyzeResult {
  keywords: KeywordItem[]
  summary: string
  suggestions: string[]
}

export default function KeywordOptimize() {
  const [jdText, setJdText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalyzeResult | null>(null)

  const store = useResumeStore()
  const resume = store.resumes.find((r) => r.id === store.activeResumeId)
  const skillsSec = resume?.sections.find((s) => s.type === 'skills')?.content
  const skillList: string[] = Array.isArray(skillsSec?.skills) ? skillsSec.skills : []

  const handleAnalyze = async () => {
    if (!jdText.trim()) {
      toast.warning('请先粘贴职位描述')
      return
    }
    if (!isAIConfigured()) {
      toast.warning('请先在设置中配置 AI 密钥')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const response = await askAI([
        {
          role: 'system',
          content: `你是一位简历关键词优化专家。分析职位描述（JD），提取核心关键词，并与简历中的技能进行交叉对比。

请以 **纯 JSON 格式** 返回，不要包含 markdown 包裹或其他说明文字：
{
  "keywords": [
    { "word": "关键词", "score": 重要程度 (0-100), "inResume": true/false }
  ],
  "summary": "简短的分析总结（一句话）",
  "suggestions": ["优化建议1", "优化建议2", "..."]
}

要求：
- 提取 15-20 个核心关键词，按重要程度从高到低排序
- score 表示该关键词在 JD 中的重要程度
- inResume 表示该关键词是否出现在用户的简历技能中
- suggestions 给出 3-5 条具体优化建议`,
        },
        {
          role: 'user',
          content: `职位描述（JD）：
${jdText}

我的简历技能：
${skillList.length > 0 ? skillList.join('、') : '（暂未填写）'}

请分析关键词匹配情况并提供优化建议。`,
        },
      ])

      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned) as AnalyzeResult
      setResult(parsed)
    } catch {
      toast.error('分析失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const keywords = result?.keywords ?? []
  const matchedCount = keywords.filter((k) => k.inResume).length
  const missingCount = keywords.length - matchedCount

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* JD Input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          职位描述（JD）
        </label>
        <textarea
          value={jdText}
          onChange={(e) => setJdText(e.target.value)}
          rows={8}
          placeholder="请粘贴职位描述内容..."
          className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent resize-y"
        />
      </div>

      {/* Action */}
      <button
        onClick={handleAnalyze}
        disabled={loading || !jdText.trim()}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            分析中...
          </>
        ) : (
          <>
            <i className="ph-light ph-seal-check text-base" />
            开始分析
          </>
        )}
      </button>

      {/* Results */}
      {result ? (
        <div className="space-y-5">
          {/* Summary */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-semibold text-slate-700">匹配概览</span>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                匹配 {matchedCount}/{keywords.length}
              </span>
              {missingCount > 0 && (
                <span className="text-xs text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                  缺失 {missingCount}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-600">{result.summary}</p>
          </div>

          {/* Keyword badges */}
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-3">
              关键词分析
              <span className="text-xs font-normal text-slate-400 ml-2">按重要度排序</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((k, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                    k.inResume
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}
                  title={`重要度: ${k.score}`}
                >
                  {k.word}
                  <span
                    className={`text-[10px] leading-none ${
                      k.inResume ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {k.score}
                  </span>
                </span>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                已在简历中
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                简历中缺失
              </span>
              <span className="text-slate-300">数字=重要度</span>
            </div>
          </div>

          {/* Suggestions */}
          {result.suggestions.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-3">优化建议</h4>
              <ul className="space-y-2">
                {result.suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-sm text-slate-600 leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-600 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        !loading && (
          <div className="text-center py-12 text-sm text-slate-400">
            <i className="ph-light ph-magnifying-glass text-3xl text-slate-200 block mb-2" />
            粘贴职位描述后点击「开始分析」查看关键词匹配
          </div>
        )
      )}
    </div>
  )
}
