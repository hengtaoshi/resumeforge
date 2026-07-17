import { useState } from 'react'
import { askAI, isAIConfigured } from '@/lib/ai/stream'
import { useResumeStore } from '@/stores/resumeStore'
import toast from '@/lib/toast'

interface Connection {
  name: string
  title: string
  company: string
  reason: string
  commonGround: string
}

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-cyan-500',
  'bg-orange-500',
  'bg-accent',
]

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

export default function NetworkRecommend() {
  const [needs, setNeeds] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<Connection[] | null>(null)

  const store = useResumeStore()
  const resume = store.resumes.find((r) => r.id === store.activeResumeId)
  const personal = resume?.sections.find((s) => s.type === 'personal')?.content
  const skillsSec = resume?.sections.find((s) => s.type === 'skills')?.content

  const userName: string = personal?.name || ''
  const userTitle: string = personal?.title || ''
  const skillList: string[] = Array.isArray(skillsSec?.skills) ? skillsSec.skills : []

  const handleRecommend = async () => {
    if (!isAIConfigured()) {
      toast.warning('请先在设置中配置 AI 密钥')
      return
    }

    setLoading(true)
    setResults(null)

    try {
      const response = await askAI([
        {
          role: 'system',
          content: `你是一位职业人脉拓展专家。根据用户提供的个人信息和需求，推荐 5-8 位值得建立联系的业内人士。

请以 **纯 JSON 格式** 返回，不要包含 markdown 包裹或其他说明文字：
{
  "connections": [
    {
      "name": "联系人姓名",
      "title": "职位",
      "company": "公司",
      "reason": "推荐理由（一句话）",
      "commonGround": "与用户的共同点或连接点"
    }
  ]
}

要求：
- 覆盖不同公司和职位
- 推荐理由要具体、有说服力
- commonGround 要结合用户的实际背景`,
        },
        {
          role: 'user',
          content: [
            userName ? `姓名：${userName}` : '',
            userTitle ? `当前职位：${userTitle}` : '',
            skillList.length > 0 ? `技能：${skillList.join('、')}` : '',
            needs ? `\n额外需求：${needs}` : '',
          ]
            .filter(Boolean)
            .join('\n'),
        },
      ])

      const cleaned = response.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
      const parsed = JSON.parse(cleaned)
      const connections: Connection[] = parsed.connections || []
      setResults(connections)

      if (connections.length === 0) {
        toast.info('未生成推荐结果，可尝试调整需求')
      }
    } catch {
      toast.error('生成推荐失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile summary */}
      <div className="bg-white border border-[rgba(0,0,0,0.10)] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">
          <i className="ph-light ph-user-circle text-slate-400 mr-1.5" />
          我的信息
        </h3>
        {userName || userTitle || skillList.length > 0 ? (
          <div className="space-y-1 text-sm text-slate-600">
            {userName && (
              <p>
                <span className="text-slate-400 w-12 inline-block">姓名</span>
                {userName}
              </p>
            )}
            {userTitle && (
              <p>
                <span className="text-slate-400 w-12 inline-block">职位</span>
                {userTitle}
              </p>
            )}
            {skillList.length > 0 && (
              <p>
                <span className="text-slate-400 w-12 inline-block">技能</span>
                {skillList.join('、')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-400">暂无简历信息，建议先创建并完善简历</p>
        )}
      </div>

      {/* Needs input */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1.5">
          额外需求 <span className="text-slate-400 font-normal">（选填）</span>
        </label>
        <input
          type="text"
          value={needs}
          onChange={(e) => setNeeds(e.target.value)}
          placeholder="例如：北京AI方向、想找大厂机会..."
          className="w-full px-4 py-2.5 border border-[rgba(0,0,0,0.10)] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent"
        />
      </div>

      {/* Action */}
      <button
        onClick={handleRecommend}
        disabled={loading}
        className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-white text-sm font-medium rounded-xl hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            生成推荐中...
          </>
        ) : (
          <>
            <i className="ph-light ph-magic-wand text-base" />
            开始推荐
          </>
        )}
      </button>

      {/* Results */}
      {results && results.length > 0 && (
        <div>
          <h3 className="text-base font-semibold text-slate-800 mb-4">
            推荐人脉
            <span className="text-sm font-normal text-slate-400 ml-2">共 {results.length} 人</span>
          </h3>
          <div className="space-y-3">
            {results.map((c, i) => (
              <div
                key={i}
                className="bg-white border border-[rgba(0,0,0,0.10)] rounded-xl p-4 flex items-start gap-4 hover:shadow-[0_1px_3px_rgba(0,0,0,0.02)] transition-shadow"
              >
                <div
                  className={`w-10 h-10 rounded-full ${getAvatarColor(i)} flex items-center justify-center text-white text-sm font-bold shrink-0`}
                >
                  {(c.name || '?').charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-sm font-semibold text-slate-800">{c.name}</span>
                    <span className="text-xs text-slate-400">{c.title}</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{c.company}</p>
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-600">
                    {c.reason}
                  </span>
                  {c.commonGround && (
                    <p className="text-xs text-slate-400 mt-2">
                      <span className="font-medium text-slate-500">共同点：</span>
                      {c.commonGround}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty / idle state */}
      {results && results.length === 0 && !loading && (
        <div className="text-center py-12 text-sm text-slate-400">
          <i className="ph-light ph-users-three text-3xl text-slate-200 block mb-2" />
          暂无推荐结果，可调整需求后重试
        </div>
      )}
    </div>
  )
}
