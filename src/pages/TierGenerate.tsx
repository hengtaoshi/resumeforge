import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { ResumeVersion, Resume, ResumeSection, SectionType } from '@/types/resume';
import { useResumeStore } from '@/stores/resumeStore';
import { buildTierPrompt, buildGuidedPrompt } from '@/lib/ai/prompts';
import type { AdvisorPersona } from '@/lib/ai/prompts/interview';
import { ADVISOR_PERSONAS } from '@/lib/ai/prompts/interview';
import { streamAI, isAIConfigured } from '@/lib/ai/stream';
import { extractJSON } from '@/lib/ai/provider';
import { useAuthStore } from '@/stores/authStore';
import toast from '@/lib/toast';

// ─── Types ───────────────────────────────────────────────

type GenerateStatus = 'idle' | 'generating' | 'done';

interface ChatMsg {
  role: 'ai' | 'user';
  content: string;
  id: string;
}

// ─── Tier card data ──────────────────────────────────────

interface TierCardData {
  id: ResumeVersion;
  label: string;
  description: string;
  badgeGradient: string;
  badgeText: string;
  borderColor: string;
  ringColor: string;
  stats: { matchRate: number; pages: number; keyExperience: string };
}

const tierCards: TierCardData[] = [
  { id: 'big', label: '大厂适用版', description: '对标大型企业用人标准，突出体系化工作方法、跨部门协作经验和复杂项目管理能力。', badgeGradient: 'from-[#D4875E] to-[#E09A72]', badgeText: 'batched', borderColor: 'border-[rgba(212,135,94,0.20)]', ringColor: 'ring-[#D4875E]', stats: { matchRate: 94, pages: 1, keyExperience: '体系化 / 跨部门协作' } },
  { id: 'mid', label: '中厂适用版', description: '适应中型企业需求，突出独立负责能力、专业深度和团队贡献。', badgeGradient: 'from-violet-500 to-violet-600', badgeText: 'balanced', borderColor: 'border-violet-200', ringColor: 'ring-violet-500', stats: { matchRate: 88, pages: 1, keyExperience: '独立负责 / 专业深度' } },
  { id: 'small', label: '小厂适用版', description: '匹配创业/小型企业需求，突出综合能力、适应性和快速学习能力。', badgeGradient: 'from-amber-500 to-amber-600', badgeText: 'batched', borderColor: 'border-amber-200', ringColor: 'ring-amber-500', stats: { matchRate: 82, pages: 1, keyExperience: '综合能力 / 快速学习' } },
];

// ─── Helpers ─────────────────────────────────────────────

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Sections that always get an empty fallback if AI didn't provide them
const coreSectionTypes: { type: SectionType; label: string }[] = [
  { type: 'personal', label: '个人信息' }, { type: 'summary', label: '个人简介' },
  { type: 'experience', label: '工作经历' }, { type: 'education', label: '教育背景' },
  { type: 'skills', label: '专业技能' },
];

const PERSONA_COLORS: Record<string, string> = {
  warm: 'from-rose-400 to-pink-500',
  professional: 'from-blue-500 to-indigo-600',
  storyteller: 'from-violet-400 to-purple-500',
  practical: 'from-amber-500 to-orange-600',
  analytical: 'from-teal-500 to-emerald-600',
};

const PERSONA_GRADIENTS: Record<string, string> = {
  warm: 'linear-gradient(135deg, #F43F5E, #EC4899)',
  professional: 'linear-gradient(135deg, #3B82F6, #4F46E5)',
  storyteller: 'linear-gradient(135deg, #A78BFA, #8B5CF6)',
  practical: 'linear-gradient(135deg, #F59E0B, #EA580C)',
  analytical: 'linear-gradient(135deg, #14B8A6, #059669)',
};

const PERSONA_CARD_BG: Record<string, string> = {
  warm: 'from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30',
  professional: 'from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30',
  storyteller: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
  practical: 'from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30',
  analytical: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30',
};

// ─── Component ───────────────────────────────────────────

const TierGenerate: React.FC = () => {
  const resumes = useResumeStore((s) => s.resumes);
  const fetchResumes = useResumeStore((s) => s.fetchResumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const setActiveResume = useResumeStore((s) => s.setActiveResume);
  const createResume = useResumeStore((s) => s.createResume);
  const updateResume = useResumeStore((s) => s.updateResume);

  const activeResume = resumes.find((r) => r.id === activeResumeId);
  const userAvatar = useAuthStore((s) => s.user?.avatar || '');

  useEffect(() => { fetchResumes() }, [fetchResumes]);

  // ── View mode ──
  type ViewMode = 'pick' | 'chat' | 'tiers';
  const [viewMode, setViewMode] = useState<ViewMode>('pick');

  // ── Persona (null until user picks one) ──
  const [persona, setPersona] = useState<AdvisorPersona | null>(null);
  const personaRef = useRef(persona);
  personaRef.current = persona;

  // ── Chat state ──
  const [guidedMessages, setGuidedMessages] = useState<ChatMsg[]>([]);
  const [guidedInput, setGuidedInput] = useState('');
  const [guidedSending, setGuidedSending] = useState(false);
  const [guidedStreamingId, setGuidedStreamingId] = useState<string | null>(null);
  const [guidedStreamingContent, setGuidedStreamingContent] = useState('');
  const [generatedResumeId, setGeneratedResumeId] = useState<string | null>(null);
  const guidedEndRef = useRef<HTMLDivElement>(null);
  const chatSessionIdRef = useRef<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);

  // ── Tier state ──
  const [selectedTier, setSelectedTier] = useState<ResumeVersion | null>(null);
  const [tierStates, setTierStates] = useState<Record<string, { status: GenerateStatus; resultStats: { matchRate: number; pages: number; keyExperience: string } | null }>>({
    big: { status: 'idle', resultStats: null },
    mid: { status: 'idle', resultStats: null },
    small: { status: 'idle', resultStats: null },
  });
  const [showOverlay, setShowOverlay] = useState(false);
  const [activeOverlayTier, setActiveOverlayTier] = useState<ResumeVersion | null>(null);
  const [showResumePicker, setShowResumePicker] = useState(false);
  const pendingTierRef = useRef<ResumeVersion | null>(null);

  // ── Auto-scroll ──
  useEffect(() => {
    guidedEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [guidedMessages, guidedStreamingContent]);

  useEffect(() => {
    if (window.electronAPI?.getChatSessions) {
      window.electronAPI.getChatSessions().then(setSessions).catch(() => {});
    }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Persona Selection
  // ═══════════════════════════════════════════════════════════

  const selectPersona = useCallback((p: AdvisorPersona) => {
    if (!isAIConfigured()) { toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。'); return; }
    const sid = genId();
    chatSessionIdRef.current = sid;
    setPersona(p);
    setGeneratedResumeId(null);
    setGuidedMessages([{
      role: 'ai',
      id: `g-${Date.now()}`,
      content: p.openings[Math.floor(Math.random() * p.openings.length)],
    }]);
    setViewMode('chat');
  }, []);

  const backToPicker = useCallback(() => {
    setPersona(null);
    setGuidedMessages([]);
    setGeneratedResumeId(null);
    chatSessionIdRef.current = null;
    setViewMode('pick');
    if (window.electronAPI?.getChatSessions) {
      window.electronAPI.getChatSessions().then(setSessions).catch(() => {});
    }
  }, []);

  const restoreSession = useCallback(async (sessionId: string, personaName: string) => {
    const persona = ADVISOR_PERSONAS.find(p => p.name === personaName);
    if (!persona) { toast.error('找不到对应的顾问'); return; }
    try {
      const msgs: any[] = await window.electronAPI!.getChatMessages(sessionId);
      const chatMsgs: ChatMsg[] = msgs.map((m, i) => ({
        role: m.role === 'assistant' ? 'ai' : (m.role as 'ai' | 'user'),
        content: m.content,
        id: `${sessionId}-${i}`,
      }));
      chatSessionIdRef.current = sessionId;
      setPersona(persona);
      setGuidedMessages(chatMsgs);
      const hasJson = chatMsgs.some(m => m.content.includes('[RESUME_JSON]'));
      if (hasJson) {
        const resumeMsgs = chatMsgs.filter(m => m.role === 'ai' && m.content.includes('[RESUME_JSON]'));
        for (const msg of resumeMsgs) {
          const jsonPart = msg.content.slice(msg.content.indexOf('[RESUME_JSON]') + '[RESUME_JSON]'.length).trim();
          if (jsonPart) tryCreateResume(jsonPart);
        }
      }
      setViewMode('chat');
    } catch { toast.error('恢复对话失败'); }
  }, []);

  // ═══════════════════════════════════════════════════════════
  // Guided Chat
  // ═══════════════════════════════════════════════════════════

  const sendGuidedMessage = useCallback(() => {
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

        const aiMsg: ChatMsg = { role: 'ai', id: aiId, content: cleanText };
        const allMsgs = [...updatedMessages, aiMsg];
        setGuidedMessages(allMsgs);
        setGuidedStreamingId(null);
        setGuidedStreamingContent('');
        setGuidedSending(false);
        if (window.electronAPI?.saveChatSession && chatSessionIdRef.current) {
          window.electronAPI.saveChatSession({
            id: chatSessionIdRef.current,
            personaName: personaRef.current?.name || '',
            messages: allMsgs.map(m => ({ role: m.role, content: m.content })),
          }).catch(() => {});
        }
      },
      onError: (err) => {
        setGuidedMessages((prev) => [...prev, { role: 'ai', id: aiId, content: `抱歉，遇到了一点问题：${err.message}。请重试一下？` }]);
        setGuidedStreamingId(null);
        setGuidedStreamingContent('');
        setGuidedSending(false);
      },
    });
  }, [guidedInput, guidedSending, guidedMessages]);

  function normDate(d: string): string {
    if (!d) return '';
    if (/至今|现在|当前|present|now/i.test(d)) return '';
    // "2020年1月" or "2020年01月" → "2020-01"
    const m = d.match(/(\d{4})\s*[年/-]\s*(\d{1,2})/);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}`;
    // "2020年" → "2020-01"
    const y = d.match(/(\d{4})\s*年/);
    if (y) return `${y[1]}-01`;
    // "2020-01" or "2020/01" — already partial date
    const p = d.match(/^(\d{4})[\/-](\d{1,2})$/);
    if (p) return `${p[1]}-${p[2].padStart(2, '0')}`;
    // full YYYY-MM-DD — keep as-is
    if (/^\d{4}-\d{2}-\d{2}$/.test(d)) return d;
    return d;
  }

  function normalizeAIContent(type: SectionType, content: Record<string, any>): Record<string, any> {
    switch (type) {
      case 'personal':
        return {
          name: content.name || content.fullName || content.userName || '',
          title: content.title || content.jobTitle || content.position || content.求职意向 || '',
          email: content.email || content.mail || '',
          phone: content.phone || content.tel || content.mobile || '',
          location: content.location || content.address || content.city || '',
        };
      case 'summary': {
        const text = content.text || content.summary || content.about || '';
        return { text, summary: text };
      }
      case 'experience': {
        const items = (content.items || content.experiences || []).map((item: any) => ({
          company: item.company || item.employer || '',
          role: item.role || item.position || item.title || item.职位 || '',
          startDate: normDate(item.startDate || item.start_date || item.from || ''),
          endDate: normDate(item.endDate || item.end_date || item.to || ''),
          description: item.description || item.desc || item.responsibilities || item.achievements || item.工作描述 || '',
        }));
        return { items };
      }
      case 'education': {
        const items = (content.items || content.educations || []).map((item: any) => ({
          school: item.school || item.institution || item.university || item.schoolName || '',
          degree: item.degree || item.education || item.学历 || '',
          major: item.major || item.field || item.fieldOfStudy || item.专业 || '',
          startDate: normDate(item.startDate || item.start_date || item.from || ''),
          endDate: normDate(item.endDate || item.end_date || item.to || ''),
        }));
        return { items };
      }
      case 'skills':
        return { skills: content.skills || content.技能 || content.technologies || [] };
      case 'projects': {
        const items = (content.items || content.projects || []).map((item: any) => ({
          name: item.name || item.projectName || item.project || '',
          role: item.role || item.position || '',
          tech: item.tech || item.technologies || item.technology || item.技术 || '',
          description: item.description || item.desc || item.项目描述 || '',
          startDate: normDate(item.startDate || ''),
          endDate: normDate(item.endDate || ''),
        }));
        return { items };
      }
      case 'certifications': {
        const items = (content.items || content.certifications || content.certs || []).map((item: any) => ({
          name: item.name || item.certName || item.title || '',
          issuer: item.issuer || item.organization || item.颁发机构 || '',
          date: normDate(item.date || item.obtainedDate || item.获得日期 || ''),
        }));
        return { items };
      }
      default:
        return content;
    }
  }

  function tryCreateResume(jsonStr: string) {
    const data = extractJSON<{ title?: string; version?: string; sections?: { sectionType: string; content: Record<string, any> }[] }>(jsonStr);
    console.log('[DEBUG] tryCreateResume data:', JSON.stringify(data, null, 2));
    if (!data?.sections?.length) {
      toast.warning('简历信息好像不太完整，我们继续聊一聊把细节补全吧？');
      return;
    }

    const sectionTypeMap: Record<string, SectionType> = {
      personal: 'personal', summary: 'summary', experience: 'experience',
      education: 'education', skills: 'skills', projects: 'projects', certifications: 'certifications',
    };

    const now = new Date().toISOString();
    const sections: ResumeSection[] = [];
    const existingTypes = new Set<SectionType>();

    for (const s of data.sections) {
      let type = sectionTypeMap[s.sectionType] || sectionTypeMap[s.type];
      if (!type) {
        const key = Object.keys(s).find(k => sectionTypeMap[k]);
        if (key) type = sectionTypeMap[key];
      }
      if (type) {
        existingTypes.add(type);
        sections.push({ id: genId(), type, sortOrder: sections.length, content: normalizeAIContent(type, s.content || {}), isVisible: true });
      }
    }

    for (const dt of coreSectionTypes) {
      if (!existingTypes.has(dt.type)) {
        sections.push({ id: genId(), type: dt.type, sortOrder: sections.length, content: {}, isVisible: true });
      }
    }

    const version = (['big', 'mid', 'small'] as const).includes(data.version as any)
      ? (data.version as ResumeVersion)
      : 'general' as ResumeVersion;

    const resume: Resume = {
      id: genId(), title: data.title || `${personaRef.current?.name || 'AI'}·引导简历`,
      createdAt: now, updatedAt: now,
      theme: { primary: '#D4875E', font: 'Noto Sans SC' },
      version, sections,
    };
    console.log('[DEBUG] resume to save:', JSON.stringify(resume, null, 2));
    console.log('[DEBUG] sections count:', sections.length, 'first section content:', JSON.stringify(sections[0]?.content));

    window.electronAPI?.saveResume(resume).then(() => {
      fetchResumes().then(() => {
        setActiveResume(resume.id);
        setGeneratedResumeId(resume.id);
        const versionLabel = version === 'big' ? '大厂版' : version === 'mid' ? '中厂版' : version === 'small' ? '小厂版' : '通用版';
        toast.success(`🎉 ${versionLabel}简历已生成！可以去编辑器查看和调整。`);
      });
    }).catch(() => {
      toast.error('保存简历失败，请重试。');
    });
  }

  // ═══════════════════════════════════════════════════════════
  // Tier Generation
  // ═══════════════════════════════════════════════════════════

  const handleGenerate = (id: ResumeVersion) => {
    if (tierStates[id].status !== 'idle') return;
    if (!isAIConfigured()) { toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。'); return; }
    if (!activeResume) { pendingTierRef.current = id; setShowResumePicker(true); return; }
    doGenerate(activeResume, id);
  };

  const doGenerate = (resume: Resume, id: ResumeVersion) => {
    setTierStates((prev) => ({ ...prev, [id]: { status: 'generating', resultStats: null } }));
    setActiveOverlayTier(id);
    setShowOverlay(true);

    const { system, messages } = buildTierPrompt(resume, id);
    streamAI([{ role: 'system' as const, content: system }, ...messages], {
      onToken: () => {},
      onDone: async (text) => {
        const sections = resume.sections.map(sec => {
          if (sec.type === 'personal' || sec.type === 'education') return sec;
          if (sec.type === 'summary') { const m = text.match(/\[summary\]([\s\S]*?)(?=\[|\n*$)/); if (m) return { ...sec, content: { ...sec.content, text: m[1].trim() } }; }
          if (sec.type === 'experience') { const items: any[] = (sec.content.items || []).map((item: any, i: number) => { const m = text.match(new RegExp(`\\[experience_${i}\\]\\s*描述: ([\\s\\S]*?)(?=\\[|$)`)); if (m) return { ...item, description: m[1].trim() }; return item; }); return { ...sec, content: { ...sec.content, items } }; }
          if (sec.type === 'skills') { const m = text.match(/\[skills\]([\s\S]*?)(?=\[|\n*$)/); if (m) return { ...sec, content: { ...sec.content, skills: m[1].trim().split(/[,，、]/).map((s: string) => s.trim()).filter(Boolean) } }; }
          if (sec.type === 'projects') { const items: any[] = (sec.content.items || []).map((item: any, i: number) => { const m = text.match(new RegExp(`\\[projects_${i}\\]\\s*描述: ([\\s\\S]*?)(?=\\[|$)`)); if (m) return { ...item, description: m[1].trim() }; return item; }); return { ...sec, content: { ...sec.content, items } }; }
          return sec;
        });

        const newResume = await createResume(`${tierCards.find(c => c.id === id)?.label || ''}简历`);
        if (newResume) {
          await updateResume(newResume.id, { version: id, sections: sections.map((s, i) => ({ ...s, id: `${Date.now()}-${i}`, sortOrder: i, isVisible: true })) });
          setTierStates(prev => ({ ...prev, [id]: { status: 'done', resultStats: null } }));
          toast.success(`${tierCards.find(c => c.id === id)?.label} 简历已生成并保存。`);
        } else { toast.error('创建简历失败'); setTierStates(prev => ({ ...prev, [id]: { status: 'idle', resultStats: null } })); }
        setShowOverlay(false);
        setActiveOverlayTier(null);
      },
      onError: (err) => {
        toast.error(err.message || '生成失败，请检查 AI 配置后重试。');
        setTierStates(prev => ({ ...prev, [id]: { status: 'idle', resultStats: null } }));
        setShowOverlay(false);
        setActiveOverlayTier(null);
      },
    });
  };

  // ═══════════════════════════════════════════════════════════
  // Render: Persona Picker
  // ═══════════════════════════════════════════════════════════

  if (viewMode === 'pick') {
    return (
      <div className="flex-1 overflow-y-auto bg-[#F4F2ED] dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-6 sm:px-8 py-8 sm:py-12">
          {/* Header */}
          <div className="text-center mb-10">
            <div className="w-16 h-16 mx-auto mb-5 rounded-3xl bg-gradient-to-br from-[#D4875E] to-[#B8656F] flex items-center justify-center shadow-lg shadow-[#D4875E]/20">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
              </svg>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">AI 引导生成简历</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              选择一位你喜欢的职业顾问，通过对话一步步帮你打造一份量身定制的简历。
            </p>
          </div>

          {/* Persona Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {ADVISOR_PERSONAS.map((p) => {
              const grad = PERSONA_GRADIENTS[p.id] || 'linear-gradient(135deg, #D4875E, #B8656F)';
              const cardBg = PERSONA_CARD_BG[p.id] || 'from-slate-50 to-slate-100';
              return (
                <button
                  key={p.id}
                  onClick={() => selectPersona(p)}
                  className="group text-left bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col"
                >
                  {/* Avatar + Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={p.avatarUrl}
                      alt={p.name}
                      className="w-11 h-11 rounded-xl shadow-sm shrink-0 bg-slate-100 dark:bg-slate-700"
                    />
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{p.title}</div>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4 line-clamp-2 flex-1">
                    {p.tagline}
                  </p>

                  {/* Strengths */}
                  <div className="space-y-1.5 mb-4">
                    {p.strengths.map((s, i) => (
                      <div key={i} className="flex items-start gap-1.5">
                        <svg className="w-3.5 h-3.5 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ color: grad.includes('F43F') ? '#F43F5E' : grad.includes('3B82') ? '#3B82F6' : grad.includes('A78B') ? '#A78BFA' : grad.includes('F59E') ? '#F59E0B' : '#14B8A6' }}>
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div
                    className="w-full py-2.5 rounded-xl text-xs font-semibold text-white text-center transition-all group-hover:shadow-md"
                    style={{ background: grad }}
                  >
                    选择{p.name}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat History */}
          <div className="mt-10 max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span className="text-xs font-medium text-slate-400">历史对话</span>
            </div>
            {sessions.length > 0 ? (
              <div className="space-y-1.5">
                {sessions.map((s: any) => {
                  const persona = ADVISOR_PERSONAS.find(p => p.name === s.persona_name);
                  const date = s.updated_at ? new Date(s.updated_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
                  return (
                    <button key={s.id} onClick={() => restoreSession(s.id, s.persona_name)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:shadow-sm transition-all text-left">
                      {persona ? (
                        <img src={persona.avatarUrl} alt="" className="w-8 h-8 rounded-full shrink-0 bg-slate-100 dark:bg-slate-700" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{s.persona_name || '未知顾问'}</div>
                        <div className="text-[11px] text-slate-400">{date}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-300"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-slate-400 text-center py-3 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">暂无对话记录，完成一次引导对话后将出现在这里</p>
            )}
          </div>

          <div className="mt-8 text-center">
            <button
              onClick={() => setViewMode('tiers')}
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-[#D4875E] transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              已有简历？去一键生成多版本
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render: Guided Chat
  // ═══════════════════════════════════════════════════════════

  if (viewMode === 'chat' && persona) {
    return (
      <div className="flex-1 flex flex-col overflow-hidden bg-[#F4F2ED] dark:bg-slate-900">
        {/* ── Header ── */}
        <div className="shrink-0 px-6 py-4 border-b border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setViewMode('tiers')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
                版本生成
              </button>
              <div className="hidden sm:flex items-center gap-3">
                <div className="flex items-center gap-2.5">
                  <img src={persona.avatarUrl} alt={persona.name}
                    className="w-9 h-9 rounded-full shadow-sm shrink-0 bg-slate-100 dark:bg-slate-700" />
                  <div className="leading-tight">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">{persona.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-400 font-medium">{persona.tagline}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{persona.title}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-[#D4875E]/10 text-[#D4875E]">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                AI 引导
              </span>
              <button
                onClick={backToPicker}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-slate-400 hover:text-[#D4875E] hover:bg-[#D4875E]/5 transition-all"
                title="切换顾问"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                切换顾问
              </button>
            </div>
          </div>
        </div>

        {/* ── Mobile Persona Bar ── */}
        <div className="sm:hidden flex items-center gap-2 px-6 py-2 bg-white/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-700">
          <img src={persona.avatarUrl} alt={persona.name}
            className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700" />
          <span className="text-xs text-slate-600 dark:text-slate-300">{persona.name} · {persona.tagline}</span>
        </div>

        {/* ── Chat Area ── */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          <div className="max-w-3xl mx-auto space-y-5">
            {guidedMessages.map((msg) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                {msg.role === 'ai' ? (
                  <img src={persona.avatarUrl} alt={persona.name}
                    className="w-8 h-8 rounded-full shadow-sm shrink-0 bg-slate-100 dark:bg-slate-700" />
                ) : userAvatar ? (
                  <img src={userAvatar} alt="你"
                    className="w-8 h-8 rounded-full shrink-0 bg-slate-100 dark:bg-slate-700 object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-slate-100 dark:bg-slate-700 text-slate-400">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
                <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'ai'
                    ? 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-sm'
                    : 'text-white rounded-tr-sm'
                }`} style={msg.role !== 'ai' ? { background: 'linear-gradient(135deg, #D4875E, #B8656F)' } : undefined}>
                  {msg.content.split('\n').map((line, i) => (
                    <React.Fragment key={i}>
                      {i > 0 && <br />}
                      {line.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith('**') && part.endsWith('**')
                          ? <strong key={j} className="text-slate-900 dark:text-slate-100">{part.slice(2, -2)}</strong>
                          : part
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}

            {guidedStreamingId && guidedStreamingContent && (
              <div className="flex gap-3">
                <img src={persona.avatarUrl} alt={persona.name}
                  className="w-8 h-8 rounded-full shadow-sm shrink-0 bg-slate-100 dark:bg-slate-700" />
                <div className="max-w-[78%] rounded-2xl px-4 py-3 text-sm leading-relaxed bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm border border-slate-100 dark:border-slate-700 rounded-tl-sm">
                  {guidedStreamingContent}
                  <span className="inline-block w-1.5 h-4 bg-[#D4875E] ml-0.5 animate-pulse rounded-sm" />
                </div>
              </div>
            )}

            {guidedSending && !guidedStreamingContent && (
              <div className="flex gap-3">
                <img src={persona.avatarUrl} alt={persona.name}
                  className="w-8 h-8 rounded-full shadow-sm shrink-0 bg-slate-100 dark:bg-slate-700" />
                <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-100 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D4875E] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#D4875E] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#D4875E] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={guidedEndRef} />
          </div>
        </div>

        {/* ── Input Area ── */}
        <div className="shrink-0 border-t border-slate-100 dark:border-slate-700 bg-white/80 dark:bg-slate-800/80 backdrop-blur">
          {generatedResumeId && (
            <div className="px-6 py-2 bg-emerald-50 dark:bg-emerald-900/30 border-b border-emerald-100 dark:border-emerald-800">
              <div className="max-w-3xl mx-auto flex items-center justify-between">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  ✅ 简历已生成！可以继续对话调整，或去「版本生成」制作多版本
                </p>
                <button onClick={() => setViewMode('tiers')} className="text-xs text-[#D4875E] hover:underline font-medium">
                  去生成版本 →
                </button>
              </div>
            </div>
          )}
          <div className="max-w-3xl mx-auto p-4 flex items-end gap-3">
            <textarea
              value={guidedInput}
              onChange={(e) => setGuidedInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendGuidedMessage(); } }}
              placeholder={generatedResumeId ? '继续补充或修改简历信息...' : `回答${persona.name}的问题...`}
              rows={1}
              className="flex-1 px-5 py-3 rounded-xl border border-slate-200 dark:border-slate-600 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#D4875E]/20 dark:focus:ring-[#D4875E]/40 focus:border-[#D4875E] transition-all bg-[#F4F2ED] dark:bg-slate-700 dark:text-slate-200 resize-none overflow-y-auto"
              style={{ color: '#1E293B', minHeight: 44, maxHeight: 150 }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 150) + 'px';
              }}
            />
            <button
              onClick={sendGuidedMessage}
              disabled={!guidedInput.trim() || guidedSending}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white disabled:opacity-40 transition-all active:scale-[0.95] flex-shrink-0 shadow-sm hover:shadow-md"
              style={{ background: 'linear-gradient(135deg, #D4875E, #B8656F)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════
  // Render: Tier Generation View
  // ═══════════════════════════════════════════════════════════

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
        <button disabled className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-400 cursor-not-allowed">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
          生成中...
        </button>
      );
    }
    if (state === 'done') {
      return (
        <button disabled className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-emerald-50 text-emerald-500 cursor-default">
          <i className="ph-light ph-check-circle text-base" />
          已生成
        </button>
      );
    }
    return (
      <button onClick={(e) => { e.stopPropagation(); handleGenerate(card.id); }} className="btn-pill primary w-full">
        <i className="ph-light ph-magic-wand text-base" />
        生成此版本
      </button>
    );
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F4F2ED] dark:bg-slate-900">
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => setViewMode('pick')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 5 5 12 12 19"/></svg>
            ← 返回选择顾问
          </button>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-600 mb-3">
          <i className="ph-light ph-magic-wand text-sm" />
          AI Generation
        </span>
        <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
          一键生成多版本简历
        </h1>
        <p className="text-slate-500 text-sm">
          从已有简历一键生成大厂/中厂/小厂三个梯度版本，精准匹配不同企业用人标准。
        </p>
      </div>

      {showResumePicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowResumePicker(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 w-96" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold mb-4">选择要生成的简历</h3>
            {resumes.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-slate-400 mb-3">还没有简历</p>
                <button onClick={async () => { const r = await createResume(); if (r) { setActiveResume(r.id); setShowResumePicker(false); doGenerate(r, pendingTierRef.current!) } }} className="px-4 py-2 bg-accent text-white rounded-lg text-sm hover:bg-accent-hover">创建新简历</button>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {resumes.map(r => (
                  <div key={r.id} onClick={() => { setActiveResume(r.id); setShowResumePicker(false); doGenerate(r, pendingTierRef.current!) }} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors">
                    <span className="text-sm text-slate-700">{r.title}</span>
                    <span className="text-xs text-[#D4875E] font-medium">使用此简历</span>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowResumePicker(false)} className="w-full mt-3 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">取消</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tierCards.map((card) => {
          const isSelected = selectedTier === card.id;
          const isDone = tierStates[card.id].status === 'done';
          const stats = getCardStats(card);
          return (
            <div key={card.id} onClick={() => handleCardClick(card.id)}
              className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border p-5 cursor-pointer transition-all duration-200 hover:shadow-md flex flex-col ${isSelected ? `${card.borderColor} ring-2 ${card.ringColor}` : 'border-slate-100 dark:border-slate-700'} ${isDone ? 'opacity-60 pointer-events-none' : ''}`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold text-white bg-gradient-to-r ${card.badgeGradient}`}>
                  {card.label}
                </span>
                {isDone && <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-500"><i className="ph-light ph-check-circle" />已完成</span>}
              </div>
              <p className="text-sm text-slate-500 leading-relaxed mb-5 flex-1">{card.description}</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>{stats.matchRate}%</p>
                  <p className="text-xs text-slate-400 mt-0.5">匹配度</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="font-display text-lg font-bold" style={{ color: '#1E293B' }}>{stats.pages}</p>
                  <p className="text-xs text-slate-400 mt-0.5">页数</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3 text-center">
                  <p className="font-display text-xs font-bold leading-tight" style={{ color: '#1E293B' }}>{stats.keyExperience}</p>
                  <p className="text-xs text-slate-400 mt-0.5">重点经验</p>
                </div>
              </div>
              {renderButton(card)}
            </div>
          );
        })}
      </div>

      {resumes.length > 0 && (
        <p className="text-xs text-slate-400 mt-6 text-center">当前共有 {resumes.length} 份简历，生成的新版本将自动保存。</p>
      )}

      {showOverlay && activeOverlayTier && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl p-6 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <svg className="animate-spin h-5 w-5 text-teal-500" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              <h3 className="text-base font-semibold" style={{ color: '#1E293B' }}>正在生成{tierCards.find((c) => c.id === activeOverlayTier)?.label || ''}简历...</h3>
            </div>
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-teal-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-3 h-3 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-3 h-3 rounded-full bg-teal-600 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <p className="text-sm text-slate-500">AI 正在优化简历内容...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TierGenerate;
