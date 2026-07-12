import React, { useState, useEffect, useRef } from 'react';
import type { ResumeVersion, Resume } from '@/types/resume';
import { useResumeStore } from '@/stores/resumeStore';
import { buildTierPrompt } from '@/lib/ai/prompts';
import { streamAI, isAIConfigured } from '@/lib/ai/stream';
import { extractJSON } from '@/lib/ai/provider';
import toast from '@/lib/toast';

interface TierCardData {
  id: ResumeVersion;
  label: string;
  description: string;
  badgeGradient: string;
  badgeText: string;
  borderColor: string;
  ringColor: string;
  stats: {
    matchRate: number;
    pages: number;
    keyExperience: string;
  };
}

const tierCards: TierCardData[] = [
  {
    id: 'big',
    label: '大厂适用版',
    description: '对标大型企业用人标准，突出体系化工作方法、跨部门协作经验和复杂项目管理能力。',
    badgeGradient: 'from-sky-500 to-sky-600',
    badgeText: 'batched',
    borderColor: 'border-sky-200',
    ringColor: 'ring-sky-500',
    stats: { matchRate: 94, pages: 1, keyExperience: '体系化 / 跨部门协作' },
  },
  {
    id: 'mid',
    label: '中厂适用版',
    description: '适应中型企业需求，突出独立负责能力、专业深度和团队贡献。',
    badgeGradient: 'from-violet-500 to-violet-600',
    badgeText: 'balanced',
    borderColor: 'border-violet-200',
    ringColor: 'ring-violet-500',
    stats: { matchRate: 88, pages: 1, keyExperience: '独立负责 / 专业深度' },
  },
  {
    id: 'small',
    label: '小厂适用版',
    description: '匹配创业/小型企业需求，突出综合能力、适应性和快速学习能力。',
    badgeGradient: 'from-amber-500 to-amber-600',
    badgeText: 'batched',
    borderColor: 'border-amber-200',
    ringColor: 'ring-amber-500',
    stats: { matchRate: 82, pages: 1, keyExperience: '综合能力 / 快速学习' },
  },
];

type GenerateStatus = 'idle' | 'generating' | 'done';

interface TierState {
  status: GenerateStatus;
  streamingText: string;
  resultStats: { matchRate: number; pages: number; keyExperience: string } | null;
}

const TierGenerate: React.FC = () => {
  const [selectedTier, setSelectedTier] = useState<ResumeVersion | null>(null);
  const [tierStates, setTierStates] = useState<Record<string, TierState>>({
    big: { status: 'idle', streamingText: '', resultStats: null },
    mid: { status: 'idle', streamingText: '', resultStats: null },
    small: { status: 'idle', streamingText: '', resultStats: null },
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeOverlayTier, setActiveOverlayTier] = useState<ResumeVersion | null>(null);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const pendingTierRef = useRef<ResumeVersion | null>(null);

  const resumes = useResumeStore((s) => s.resumes);
  const fetchResumes = useResumeStore((s) => s.fetchResumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActiveResume = useResumeStore((s) => s.setActiveResume);
  const createResume = useResumeStore((s) => s.createResume);
  const updateResume = useResumeStore((s) => s.updateResume);

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  useEffect(() => { fetchResumes() }, [fetchResumes]);

  const handleGenerate = (id: ResumeVersion) => {
    if (tierStates[id].status !== 'idle') return;
    if (!isAIConfigured()) { toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。'); return; }
    if (!activeResume) { pendingTierRef.current = id; setShowResumePicker(true); return; }
    doGenerate(activeResume, id);
  };

  const doGenerate = (resume: Resume, id: ResumeVersion) => {
    setTierStates((prev) => ({ ...prev, [id]: { status: 'generating', streamingText: '', resultStats: null } }));
    setActiveOverlayTier(id);
    setShowOverlay(true);

    const { system, messages } = buildTierPrompt(resume, id);
    streamAI([{ role: 'system' as const, content: system }, ...messages], {
      onToken: () => {},
      onDone: async (text) => {
        // Parse AI response: sections marked with [section_name]
        const sections = resume.sections.map(sec => {
          if (sec.type === 'personal' || sec.type === 'education') return sec // keep as-is
          if (sec.type === 'summary') {
            const m = text.match(/\[summary\]([\s\S]*?)(?=\[|\n*$)/)
            if (m) return { ...sec, content: { ...sec.content, text: m[1].trim() } }
          }
          if (sec.type === 'experience') {
            const items: any[] = (sec.content.items || []).map((item: any, i: number) => {
              const m = text.match(new RegExp(`\\[experience_${i}\\][\\s\\S]*?描述: ([\\s\\S]*?)(?=\\[|$)`))
              if (m) return { ...item, description: m[1].trim() }
              return item
            })
            return { ...sec, content: { ...sec.content, items } }
          }
          if (sec.type === 'skills') {
            const m = text.match(/\[skills\]([\s\S]*?)(?=\[|\n*$)/)
            if (m) return { ...sec, content: { ...sec.content, skills: m[1].trim().split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean) } }
          }
          if (sec.type === 'projects') {
            const items: any[] = (sec.content.items || []).map((item: any, i: number) => {
              const m = text.match(new RegExp(`\\[projects_${i}\\][\\s\\S]*?描述: ([\\s\\S]*?)(?=\\[|$)`))
              if (m) return { ...item, description: m[1].trim() }
              return item
            })
            return { ...sec, content: { ...sec.content, items } }
          }
          return sec
        })

        const newResume = await createResume(`${tierCards.find(c => c.id === id)?.label || ''}简历`)
        if (newResume) {
          await updateResume(newResume.id, { version: id, sections: sections.map((s, i) => ({ ...s, id: `${Date.now()}-${i}`, sortOrder: i, isVisible: true })) })
          setTierStates(prev => ({ ...prev, [id]: { status: 'done', streamingText: '', resultStats: null } }))
          toast.success(`${tierCards.find(c => c.id === id)?.label} 简历已生成并保存。`)
        } else {
          toast.error('创建简历失败')
          setTierStates(prev => ({ ...prev, [id]: { status: 'idle', streamingText: '', resultStats: null } }))
        }
        setShowOverlay(false)
        setActiveOverlayTier(null)
      },
      onError: (err) => {
        toast.error(err.message || '生成失败，请检查 AI 配置后重试。')
        setTierStates(prev => ({ ...prev, [id]: { status: 'idle', streamingText: '', resultStats: null } }))
        setShowOverlay(false)
        setActiveOverlayTier(null)
      },
    })
  };

  const handleCardClick = (id: ResumeVersion) => {
    if (tierStates[id].status === 'done') return;
    setSelectedTier((prev) => (prev === id ? null : id));
  };

  const getCardStats = (card: TierCardData) => {
    const st = tierStates[card.id];
    if (st.status === 'done' && st.resultStats) {
      return st.resultStats;
    }
    return card.stats;
  };

  const renderButton = (card: TierCardData) => {
    const state = tierStates[card.id].status;

    if (state === 'generating') {
      return (
        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed"
        >
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          生成中...
        </button>
      );
    }

    if (state === 'done') {
      return (
        <button
          disabled
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-500 cursor-default"
        >
          <i className="ph-light ph-check-circle text-base" />
          已生成
        </button>
      );
    }

    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleGenerate(card.id); }}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        style={{ backgroundColor: '#14b8a6' }}
      >
        <i className="ph-light ph-magic-wand text-base" />
        生成此版本
      </button>
    );
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8F7F4] dark:bg-slate-900">
      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-600 mb-3">
          <i className="ph-light ph-magic-wand text-sm" />
          AI Generation
        </span>
        <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
          选择版本生成简历
        </h1>
        <p className="text-slate-500 text-sm">
          根据你的原始经历，一键生成多个梯度的简历版本，AI 自动调整措辞和详略，匹配不同层次的岗位要求。
        </p>
      </div>

      {/* Resume picker overlay */}
      {showResumePicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowResumePicker(false)}>
          <div className="bg-white rounded-xl shadow-xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">选择要生成的简历</h3>
            {resumes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 mb-3">还没有简历</p>
                <button onClick={async () => { const r = await createResume(); if (r) { setActiveResume(r.id); setShowResumePicker(false); doGenerate(r, pendingTierRef.current!) } }}
                  className="px-4 py-2 bg-teal-500 text-white rounded-lg text-sm hover:bg-teal-600">创建新简历</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resumes.map(r => (
                  <div key={r.id} onClick={() => { setActiveResume(r.id); setShowResumePicker(false); doGenerate(r, pendingTierRef.current!) }}
                    className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-sm text-slate-700">{r.title}</span>
                    <span className="text-xs text-teal-600 font-medium">使用此简历</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowResumePicker(false)} className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">取消</button>
          </div>
        </div>
      )}

      {/* Tier grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tierCards.map((card) => {
          const isSelected = selectedTier === card.id;
          const isDone = tierStates[card.id].status === 'done';
          const stats = getCardStats(card);

          return (
            <div
              key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col ${
                isSelected
                  ? `${card.borderColor} ring-2 ${card.ringColor}`
                  : 'border-slate-100'
              } ${isDone ? 'opacity-60 pointer-events-none' : ''}`}
            >
              {/* Badge */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r ${card.badgeGradient}`}
                >
                  <i className="ph-light ph-stars text-xs" />
                  {card.label}
                </span>
                {isDone && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500">
                    <i className="ph-light ph-check-circle" />
                    已完成
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">
                {card.description}
              </p>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>
                    {stats.matchRate}%
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">匹配度</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>
                    {stats.pages}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">页数</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-xs font-bold leading-tight" style={{ color: '#1E293B' }}>
                    {stats.keyExperience}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">重点经验</p>
                </div>
              </div>

              {/* Button */}
              {renderButton(card)}
            </div>
          );
        })}
      </div>

      {/* Streaming progress overlay */}
      {showOverlay && activeOverlayTier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h3 className="text-base font-semibold" style={{ color: '#1E293B' }}>
                正在生成{tierCards.find((c) => c.id === activeOverlayTier)?.label || ''}简历...
              </h3>
            </div>
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 rounded-full bg-teal-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm text-slate-500">AI 正在优化简历内容...</p>
            </div>
          </div>
        </div>
      )}

      {/* Resume count hint */}
      {resumes.length > 0 && (
        <p className="text-xs text-slate-400 mt-6 text-center">
          当前共有 {resumes.length} 份简历，生成的新版本将自动保存到简历列表。
        </p>
      )}
    </div>
  );
};

export default TierGenerate;
