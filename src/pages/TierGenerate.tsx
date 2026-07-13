import React, { useState, useEffect, useRef } from 'react';
import type { ResumeVersion, Resume, ResumeSection, SectionType } from '@/types/resume';
import { useResumeStore } from '@/stores/resumeStore';
import { buildTierPrompt, buildGuidedPrompt } from '@/lib/ai/prompts';
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

interface ChatMsg {
  role: 'ai' | 'user';
  content: string;
  id: string;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const defaultSectionTypes: { type: SectionType; label: string }[] = [
  { type: 'personal', label: '个人信息' },
  { type: 'summary', label: '个人简介' },
  { type: 'experience', label: '工作经历' },
  { type: 'education', label: '教育背景' },
  { type: 'skills', label: '专业技能' },
  { type: 'projects', label: '项目/作品经验' },
  { type: 'certifications', label: '证书资质' },
];

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

  // Guided generation state
  const [guidedActive, setGuidedActive] = useState(false);
  const [guidedMessages, setGuidedMessages] = useState<ChatMsg[]>([]);
  const [guidedInput, setGuidedInput] = useState('');
  const [guidedSending, setGuidedSending] = useState(false);
  const [guidedStreamingId, setGuidedStreamingId] = useState<string | null>(null);
  const [guidedStreamingContent, setGuidedStreamingContent] = useState('');
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const guidedEndRef = useRef<HTMLDivElement>(null);

  const resumes = useResumeStore((s) => s.resumes);
  const fetchResumes = useResumeStore((s) => s.fetchResumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActiveResume = useResumeStore((s) => s.setActiveResume);
  const createResume = useResumeStore((s) => s.createResume);
  const updateResume = useResumeStore((s) => s.updateResume);

  const activeResume = resumes.find((r) => r.id === activeResumeId);

  useEffect(() => { fetchResumes() }, [fetchResumes]);

  useEffect(() => {
    guidedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guidedMessages, guidedStreamingContent]);

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
        const sections = resume.sections.map(sec => {
          if (sec.type === 'personal' || sec.type === 'education') return sec
          if (sec.type === 'summary') {
            const m = text.match(/\[summary\]([\s\S]*?)(?=\[|\n*$)/)
            if (m) return { ...sec, content: { ...sec.content, text: m[1].trim() } }
          }
          if (sec.type === 'experience') {
            const items: any[] = (sec.content.items || []).map((item: any, i: number) => {
              const m = text.match(new RegExp(`\\[experience_${i}\\]\\s*描述: ([\\s\\S]*?)(?=\\[|$)`))
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
              const m = text.match(new RegExp(`\\[projects_${i}\\]\\s*描述: ([\\s\\S]*?)(?=\\[|$)`))
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

  // ── Guided generation ──

  const startGuided = () => {
    if (!isAIConfigured()) { toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。'); return; }
    setGuidedActive(true);
    setGeneratedResumeId(null);
    setGuidedMessages([{ role: 'ai', id: `g-${Date.now()}`, content: '你好！我是 ResumeForge 的职业规划师，很高兴为你打造一份量身定制的简历！首先，请问你目前从事什么行业，担任什么职位呢？' }]);
  };

  const sendGuidedMessage = () => {
    const text = guidedInput.trim();
    if (!text || guidedSending) return;

    const userMsg: ChatMsg = { role: 'user', id: `gu-${Date.now()}`, content: text };
    const updatedMessages = [...guidedMessages, userMsg];
    setGuidedMessages(updatedMessages);
    setGuidedInput('');
    setGuidedSending(true);

    const aiId = `ga-${Date.now()}`;
    setGuidedStreamingId(aiId);
    setGuidedStreamingContent('');

    const history = updatedMessages.map(m => ({
      role: (m.role === 'ai' ? 'assistant' : 'user') as 'user' | 'assistant',
      content: m.content,
    }));

    const { system, messages } = buildGuidedPrompt(history.slice(0, -1), text);
    streamAI([{ role: 'system', content: system }, ...messages], {
      onToken: (token) => {
        setGuidedStreamingContent((prev) => prev + token);
      },
      onDone: (finalText) => {
        const jsonMarker = finalText.indexOf('[RESUME_JSON]');
        let cleanText = finalText;
        if (jsonMarker !== -1) {
          const jsonPart = finalText.slice(jsonMarker + '[RESUME_JSON]'.length).trim();
          cleanText = finalText.slice(0, jsonMarker).trim();
          tryCreateResume(jsonPart);
        }

        setGuidedMessages((prev) => [...prev, { role: 'ai', id: aiId, content: cleanText }]);
        setGuidedStreamingId(null);
        setGuidedStreamingContent('');
        setGuidedSending(false);
      },
      onError: (err) => {
        setGuidedMessages((prev) => [...prev, { role: 'ai', id: aiId, content: `遇到问题：${err.message}` }]);
        setGuidedStreamingId(null);
        setGuidedStreamingContent('');
        setGuidedSending(false);
      },
    });
  };

  /** Normalize AI-generated content fields to match editor renderer expectations. */
  function normalizeContent(type: SectionType, content: Record<string, any>): Record<string, any> {
    switch (type) {
      case 'summary': {
        // AI may output { text: "..." } instead of { summary: "..." }
        if (content.text !== undefined && content.summary === undefined) {
          return { ...content, summary: content.text }
        }
        return content
      }
      case 'education': {
        // AI may output flat fields instead of { items: [...] }
        if (!content.items || content.items.length === 0) {
          if (content.school || content.degree || content.major) {
            return { items: [{ ...content }] }
          }
        }
        return content
      }
      default:
        return content
    }
  }

  function tryCreateResume(jsonStr: string) {
    const data = extractJSON<{
      title?: string;
      sections?: { sectionType: string; content: Record<string, any> }[];
    }>(jsonStr);
    if (!data?.sections?.length) {
      toast.warning('AI 生成的简历格式有误，请重试或手动创建简历。');
      return;
    }

    const sectionTypeMap: Record<string, SectionType> = {
      personal: 'personal', summary: 'summary', experience: 'experience',
      education: 'education', skills: 'skills', projects: 'projects',
      certifications: 'certifications',
    };

    const now = new Date().toISOString();
    const sections: ResumeSection[] = [];
    const existingTypes = new Set<SectionType>();

    for (const s of data.sections) {
      const type = sectionTypeMap[s.sectionType];
      if (type) {
        existingTypes.add(type);
        sections.push({ id: genId(), type, sortOrder: sections.length, content: normalizeContent(type, s.content || {}), isVisible: true });
      }
    }

    // ponytail: fill in missing default sections
    for (const dt of defaultSectionTypes) {
      if (!existingTypes.has(dt.type)) {
        sections.push({ id: genId(), type: dt.type, sortOrder: sections.length, content: {}, isVisible: true });
      }
    }

    const resume: Resume = {
      id: genId(),
      title: data.title || 'AI 引导生成简历',
      createdAt: now, updatedAt: now,
      theme: { primary: '#14b8a6', font: 'Noto Sans SC' },
      version: 'general',
      sections,
    };

    window.electronAPI?.saveResume(resume).then(() => {
      fetchResumes().then(() => {
        setActiveResume(resume.id);
        setGeneratedResumeId(resume.id);
        toast.success('简历已生成！可以使用上方的版本按钮生成各版本简历。');
      });
    }).catch(() => {
      toast.error('保存简历失败，请重试。');
    });
  }

  const handleCardClick = (id: ResumeVersion) => {
    if (tierStates[id].status === 'done') return;
    setSelectedTier((prev) => (prev === id ? null : id));
  };

  const getCardStats = (card: TierCardData) => {
    const st = tierStates[card.id];
    if (st.status === 'done' && st.resultStats) return st.resultStats;
    return card.stats;
  };

  const renderButton = (card: TierCardData) => {
    const state = tierStates[card.id].status;

    if (state === 'generating') {
      return (
        <button disabled
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
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
        <button disabled
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-500 cursor-default">
          <i className="ph-light ph-check-circle text-base" />
          已生成
        </button>
      );
    }

    return (
      <button
        onClick={(e) => { e.stopPropagation(); handleGenerate(card.id); }}
        className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98]"
        style={{ backgroundColor: '#14b8a6' }}>
        <i className="ph-light ph-magic-wand text-base" />
        生成此版本
      </button>
    );
  };

  // ── Render: guided chat view ──
  if (guidedActive) {
    return (
      <div className="flex-1 p-8 overflow-y-auto bg-[#F8F7F4] dark:bg-slate-900">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setGuidedActive(false)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all">
            <i className="ph-light ph-arrow-left text-base" />
            返回
          </button>
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-teal-50 text-teal-600 mb-1">
              <i className="ph-light ph-robot text-sm" />
              AI Guided
            </span>
            <h2 className="text-lg font-bold font-display" style={{ color: '#1E293B' }}>
              AI 引导生成简历
            </h2>
          </div>
          {generatedResumeId && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-600 ml-auto">
              <i className="ph-light ph-check-circle" />
              简历已生成
            </span>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col" style={{ height: 'calc(100vh - 240px)' }}>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {guidedMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'ai' ? 'bg-teal-50 text-teal-500' : 'bg-sky-50 text-sky-500'
                }`}>
                  <i className={`ph-light text-sm ${msg.role === 'ai' ? 'ph-robot' : 'ph-user-circle'}`} />
                </div>
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'ai' ? 'bg-teal-50 text-slate-700 rounded-tl-sm' : 'bg-sky-50 text-slate-700 rounded-tr-sm'
                }`} style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j}>{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {guidedStreamingId && guidedStreamingContent && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <i className="ph-light ph-robot text-sm text-teal-500" />
                </div>
                <div className="max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-teal-50 text-slate-700 rounded-tl-sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {guidedStreamingContent}
                  <span className="inline-block w-1.5 h-4 bg-teal-500 ml-0.5 animate-pulse" />
                </div>
              </div>
            )}

            {guidedSending && !guidedStreamingContent && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center flex-shrink-0">
                  <i className="ph-light ph-robot text-sm text-teal-500" />
                </div>
                <div className="bg-teal-50 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={guidedEndRef} />
          </div>

          {generatedResumeId && (
            <div className="px-5 py-2 bg-emerald-50 border-t border-emerald-100">
              <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                <i className="ph-light ph-check-circle" />
                简历已生成 — 可以返回选择版本生成各版本简历
              </p>
            </div>
          )}

          <div className="p-4 flex items-center gap-3 border-t border-slate-100">
            <input type="text" value={guidedInput}
              onChange={(e) => setGuidedInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGuidedMessage(); } }}
              placeholder={generatedResumeId ? '简历已生成，可以继续对话...' : '回答AI的问题...'}
              className="flex-1 px-4 py-2.5 rounded-lg border border-slate-200 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-200 transition-all bg-[#F8F7F4] dark:bg-slate-900"
              style={{ color: '#1E293B' }} />
            <button onClick={sendGuidedMessage}
              disabled={!guidedInput.trim() || guidedSending}
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-[0.95] flex-shrink-0"
              style={{ backgroundColor: '#14b8a6' }}>
              <i className="ph-light ph-arrow-right text-lg" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: tier grid view ──
  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8F7F4] dark:bg-slate-900">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-600 mb-3">
          <i className="ph-light ph-magic-wand text-sm" />
          AI Generation
        </span>
        <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
          选择版本生成简历
        </h1>
        <p className="text-slate-500 text-sm">
          从现有简历一键生成三个梯度版本，或通过 AI 引导对话从零创建。
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

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {tierCards.map((card) => {
          const isSelected = selectedTier === card.id;
          const isDone = tierStates[card.id].status === 'done';
          const stats = getCardStats(card);

          return (
            <div key={card.id}
              onClick={() => handleCardClick(card.id)}
              className={`bg-white rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col ${
                isSelected ? `${card.borderColor} ring-2 ${card.ringColor}` : 'border-slate-100'
              } ${isDone ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r ${card.badgeGradient}`}>
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
              <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{card.description}</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>{stats.matchRate}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">匹配度</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>{stats.pages}</p>
                  <p className="text-xs text-slate-400 mt-0.5">页数</p>
                </div>
                <div className="bg-slate-50 rounded-lg p-3 text-center">
                  <p className="font-display text-xs font-bold leading-tight" style={{ color: '#1E293B' }}>{stats.keyExperience}</p>
                  <p className="text-xs text-slate-400 mt-0.5">重点经验</p>
                </div>
              </div>
              {renderButton(card)}
            </div>
          );
        })}

        {/* AI guided generation card */}
        <div onClick={startGuided}
          className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-xl shadow-sm border border-teal-100 p-5 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col group">
          <div className="flex items-center justify-between mb-4">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r from-teal-600 to-emerald-600">
              <i className="ph-light ph-sparkle text-xs" />
              AI 引导
            </span>
            <span className="text-xs text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity">
              开始对话
            </span>
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold font-display mb-2" style={{ color: '#1E293B' }}>
              AI 引导生成
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              没有现成简历？让 AI 资深职业规划师一步步引导你，从零创建一份量身定制的简历。
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm font-medium text-teal-600 group-hover:gap-3 transition-all">
            <span>开始对话</span>
            <i className="ph-light ph-arrow-right text-base" />
          </div>
        </div>
      </div>

      {/* Generating overlay */}
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

      {resumes.length > 0 && (
        <p className="text-xs text-slate-400 mt-6 text-center">
          当前共有 {resumes.length} 份简历，生成的新版本将自动保存到简历列表。
        </p>
      )}
    </div>
  );
};

export default TierGenerate;
