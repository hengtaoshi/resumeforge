import React, { useState, useRef } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import { buildJDAnalysisPrompt, buildTailorPrompt, buildATSEvalPrompt } from '@/lib/ai/prompts';
import { streamAI, isAIConfigured } from '@/lib/ai/stream';
import { extractJSON } from '@/lib/ai/provider';
import toast from '@/lib/toast';

interface GapItem {
  label: string;
  score: number;
  level: 'good' | 'partial' | 'missing';
  description: string;
}

interface AnalysisResult {
  matchPercent: number;
  gaps: GapItem[];
  matchCounts: { good: number; partial: number; missing: number };
}

interface ATSScores {
  A: number;
  B: number;
  C: number;
  D: number;
  E: number;
  F: number;
  G: number;
}

interface ATSGap {
  area: string;
  score: number;
  suggestion: string;
}

interface ATSEvalResult {
  scores: ATSScores;
  overall: number;
  summary: string;
  gaps: ATSGap[];
}

const levelConfig = {
  good: { label: '匹配', color: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  partial: { label: '部分匹配', color: 'text-amber-600', bg: 'bg-amber-50', dot: 'bg-amber-500' },
  missing: { label: '缺失', color: 'text-red-600', bg: 'bg-red-50', dot: 'bg-red-500' },
};

const JDMatch: React.FC = () => {
  const [jdText, setJdText] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [tailoring, setTailoring] = useState(false);
  const [atsResult, setAtsResult] = useState<ATSEvalResult | null>(null);
  const [atsAnalyzing, setAtsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resumes = useResumeStore((s) => s.resumes);
  const activeResumeId = useResumeStore((s) => s.activeResumeId);
  const createResume = useResumeStore((s) => s.createResume);
  const updateResume = useResumeStore((s) => s.updateResume);
  const activeResume = resumes.find((r) => r.id === activeResumeId);

  const handleAnalyze = async () => {
    if (!jdText.trim() || analyzing) return;

    if (!isAIConfigured()) {
      toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。');
      return;
    }

    if (!activeResume) {
      toast.warning('请先在编辑器中创建或选择一份简历。');
      return;
    }

    setAnalyzing(true);
    setShowResult(false);
    setResult(null);
    setAtsResult(null);

    const { system, messages } = buildJDAnalysisPrompt(activeResume, jdText);
    const aiMessages = [
      { role: 'system' as const, content: system },
      ...messages,
    ];

    let fullText = '';

    streamAI(aiMessages, {
      onToken: (token) => {
        fullText += token;
      },
      onDone: (text) => {
        const parsed = extractJSON<AnalysisResult>(text);
        if (parsed && parsed.matchPercent !== undefined && parsed.gaps) {
          setResult(parsed);
          setShowResult(true);
        } else {
          toast.error('AI 返回格式异常，请重试。');
        }
        setAnalyzing(false);
      },
      onError: (err) => {
        toast.error(err.message || '分析失败，请检查 AI 配置后重试。');
        setAnalyzing(false);
      },
    });
  };

  const handleTailorResume = async () => {
    if (!result || tailoring || !activeResume) return;

    if (!isAIConfigured()) {
      toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。');
      return;
    }

    setTailoring(true);

    const { system, messages } = buildTailorPrompt(activeResume, jdText);
    const aiMessages = [
      { role: 'system' as const, content: system },
      ...messages,
    ];

    let fullText = '';

    streamAI(aiMessages, {
      onToken: () => {
        // silent streaming — no progress UI needed
      },
      onDone: async (text) => {
        const parsed = extractJSON<{
          title?: string;
          sections?: Array<{ type: string; content: Record<string, unknown> }>;
        }>(text);

        if (parsed?.sections && parsed.sections.length > 0) {
          const newResume = await createResume(parsed.title || 'JD 定制简历');
          if (newResume) {
            await updateResume(newResume.id, {
              version: 'general',
              sections: parsed.sections.map((s, i) => ({
                id: `${Date.now()}-${i}-${Math.random().toString(36).slice(2, 9)}`,
                type: s.type as any,
                sortOrder: i,
                content: s.content,
                isVisible: true,
              })),
            });
            toast.success('JD 定制简历已生成并保存。');
          } else {
            toast.error('创建简历失败，请重试。');
          }
        } else {
          toast.error('AI 返回格式异常，请重试。');
        }
        setTailoring(false);
      },
      onError: (err) => {
        toast.error(err.message || '定制失败，请检查 AI 配置后重试。');
        setTailoring(false);
      },
    });
  };

  const handleATSEval = async () => {
    if (!jdText.trim() || atsAnalyzing || !activeResume) return;

    if (!isAIConfigured()) {
      toast.warning('请先在「设置」页面配置 AI 提供商和 API 密钥。');
      return;
    }

    setAtsAnalyzing(true);
    setAtsResult(null);

    const { system, messages } = buildATSEvalPrompt(activeResume, jdText);
    const aiMessages = [
      { role: 'system' as const, content: system },
      ...messages,
    ];

    let fullText = '';

    streamAI(aiMessages, {
      onToken: (token) => {
        fullText += token;
      },
      onDone: (text) => {
        const parsed = extractJSON<ATSEvalResult>(text);
        if (parsed && parsed.scores && parsed.overall !== undefined) {
          setAtsResult(parsed);
        } else {
          toast.error('ATS 评估返回格式异常，请重试。');
        }
        setAtsAnalyzing(false);
      },
      onError: (err) => {
        toast.error(err.message || 'ATS 评估失败，请检查 AI 配置后重试。');
        setAtsAnalyzing(false);
      },
    });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.warning('文件过大，请选择小于 5MB 的文件');
      return;
    }
    const allowedTypes = ['text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.name.match(/\.(txt|doc|docx|pdf)$/i)) {
      toast.warning('不支持的文件格式');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setJdText(reader.result as string);
    };
    reader.readAsText(file);
  };

  // SVG circle chart
  const matchPercent = result?.matchPercent ?? 0;
  const circumference = 2 * Math.PI * 54;
  const strokeDashoffset = circumference - (matchPercent / 100) * circumference;
  const matchCounts = result?.matchCounts ?? { good: 0, partial: 0, missing: 0 };

  return (
    <div className="flex-1 p-8 overflow-y-auto" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-600 mb-3">
          <i className="ph-light ph-target text-sm" />
          JD Match
        </span>
        <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
          岗位匹配分析
        </h1>
        <p className="text-slate-500 text-sm">
          粘贴职位描述，AI 自动分析关键词和技能要求，与你的简历进行多维匹配评分。
        </p>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-6">
        {/* Left: JD input */}
        <div className="flex-1 min-w-0">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <label className="block text-sm font-medium mb-2" style={{ color: '#1E293B' }}>
              粘贴职位描述 (JD)
            </label>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              placeholder="请将职位描述粘贴到这里..."
              className="w-full h-64 p-4 rounded-lg border border-slate-200 resize-none text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 transition-all duration-200"
              style={{ color: '#1E293B', backgroundColor: '#F8F7F4' }}
            />

            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAnalyze}
                disabled={!jdText.trim() || analyzing}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
                style={{ backgroundColor: '#14b8a6' }}
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    分析中...
                  </>
                ) : (
                  <>
                    <i className="ph-light ph-lightning text-base" />
                    分析匹配度
                  </>
                )}
              </button>

              <button
                onClick={handleFileUpload}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-slate-200 bg-white hover:bg-slate-50 transition-all duration-200"
                style={{ color: '#1E293B' }}
              >
                <i className="ph-light ph-upload text-base" />
                上传文件
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.doc,.docx,.pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>
          </div>
        </div>

        {/* Right: Match results */}
        <div className="w-[420px] flex-shrink-0">
          {!showResult || !result ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 h-full flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <i className="ph-light ph-chart-bar text-3xl text-slate-300" />
              </div>
              <p className="text-sm text-slate-400">
                请先粘贴职位描述进行分析
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Score ring card */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold mb-5" style={{ color: '#1E293B' }}>
                  匹配评分
                </h3>

                <div className="flex items-center gap-6">
                  {/* SVG circle */}
                  <div className="relative w-28 h-28 flex-shrink-0">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="54" fill="none" stroke="#E2E8F0" strokeWidth="8" />
                      <circle
                        cx="60" cy="60" r="54"
                        fill="none"
                        stroke="#14b8a6"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="font-display text-3xl font-bold" style={{ color: '#1E293B' }}>
                        {matchPercent}%
                      </span>
                      <span className="text-xs text-slate-400 mt-0.5">匹配度</span>
                    </div>
                  </div>

                  {/* Match counts */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                        匹配
                      </span>
                      <span className="font-display font-bold" style={{ color: '#1E293B' }}>
                        {matchCounts.good}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                        部分匹配
                      </span>
                      <span className="font-display font-bold" style={{ color: '#1E293B' }}>
                        {matchCounts.partial}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                        缺失
                      </span>
                      <span className="font-display font-bold" style={{ color: '#1E293B' }}>
                        {matchCounts.missing}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleTailorResume}
                  disabled={tailoring}
                  className="w-full mt-5 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#14b8a6' }}
                >
                  {tailoring ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      生成中...
                    </>
                  ) : (
                    <>
                      <i className="ph-light ph-file-text text-base" />
                      根据 JD 定制简历
                    </>
                  )}
                </button>

                <button
                  onClick={handleATSEval}
                  disabled={atsAnalyzing}
                  className="w-full mt-3 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{
                    color: atsResult ? '#6366F1' : '#6366F1',
                    borderColor: atsResult ? '#6366F1' : '#C7D2FE',
                    backgroundColor: atsResult ? '#EEF2FF' : '#FFFFFF',
                  }}
                >
                  {atsAnalyzing ? (
                    <>
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      评估中...
                    </>
                  ) : (
                    <>
                      <i className="ph-light ph-magnifying-glass text-base" />
                      {atsResult ? '重新进行 ATS 深度评估' : 'ATS 深度评估'}
                    </>
                  )}
                </button>
              </div>

              {/* Gap analysis */}
              <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                <h3 className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>
                  差距分析
                </h3>
                <div className="space-y-3">
                  {result.gaps.map((gap) => {
                    const cfg = levelConfig[gap.level];
                    return (
                      <div
                        key={gap.label}
                        className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-sm font-medium" style={{ color: '#1E293B' }}>
                              {gap.label}
                            </span>
                            <span className={`text-xs font-medium ${cfg.color}`}>
                              {gap.score}分 · {cfg.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {gap.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ATS Evaluation Results */}
              {atsResult && (
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-semibold" style={{ color: '#1E293B' }}>
                      ATS 深度评估
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
                      style={{
                        color: atsResult.overall >= 70 ? '#059669' : atsResult.overall >= 40 ? '#D97706' : '#DC2626',
                        backgroundColor: atsResult.overall >= 70 ? '#ECFDF5' : atsResult.overall >= 40 ? '#FFFBEB' : '#FEF2F2',
                      }}
                    >
                      综合评分 {atsResult.overall}分
                    </span>
                  </div>

                  {/* A-G Dimension Bars */}
                  <div className="space-y-4 mb-5">
                    {([
                      ['A', '角色匹配'],
                      ['B', '简历质量'],
                      ['C', '职级策略'],
                      ['D', '薪酬适配'],
                      ['E', '个性化'],
                      ['F', '面试准备'],
                      ['G', '岗位真实性'],
                    ] as const).map(([key, label]) => {
                      const score = atsResult.scores[key as keyof typeof atsResult.scores];
                      const barColor = score <= 2 ? '#EF4444' : score === 3 ? '#F59E0B' : '#10B981';
                      const barBg = score <= 2 ? '#FEE2E2' : score === 3 ? '#FEF3C7' : '#D1FAE5';
                      return (
                        <div key={key}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium" style={{ color: '#1E293B' }}>
                              <span
                                className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold mr-1.5"
                                style={{ color: '#fff', backgroundColor: barColor }}
                              >
                                {key}
                              </span>
                              {label}
                            </span>
                            <span className="text-xs font-semibold" style={{ color: barColor }}>
                              {score}/5
                            </span>
                          </div>
                          <div className="w-full h-2 rounded-full" style={{ backgroundColor: '#F1F5F9' }}>
                            <div
                              className="h-full rounded-full transition-all duration-700 ease-out"
                              style={{
                                width: `${(score / 5) * 100}%`,
                                backgroundColor: barColor,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Summary */}
                  <div className="p-3 rounded-lg mb-4" style={{ backgroundColor: '#F8F7F4' }}>
                    <p className="text-sm leading-relaxed" style={{ color: '#475569' }}>
                      {atsResult.summary}
                    </p>
                  </div>

                  {/* Gaps */}
                  {atsResult.gaps.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#94A3B8' }}>
                        改进建议
                      </h4>
                      <div className="space-y-2">
                        {atsResult.gaps.map((gap, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-lg"
                            style={{ backgroundColor: '#FEF2F2' }}
                          >
                            <span
                              className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0"
                              style={{ backgroundColor: '#EF4444' }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="text-sm font-medium" style={{ color: '#1E293B' }}>
                                  {gap.area}
                                </span>
                                <span className="text-xs font-semibold" style={{ color: '#EF4444' }}>
                                  {gap.score}/5
                                </span>
                              </div>
                              <p className="text-xs leading-relaxed" style={{ color: '#DC2626' }}>
                                {gap.suggestion}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JDMatch;
