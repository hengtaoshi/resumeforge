import { useState, useCallback, useEffect, useRef } from 'react';
import { useScanStore, runAnalysis } from '@/stores/scanStore';
import type { ScannedJob, JobPlatform, MatchScore, SkillGap } from '@/stores/scanStore';
import toast from '@/lib/toast';

/* ---------- helpers ---------- */

const PLATFORM_LABEL: Record<string, string> = {
  boss: 'BOSS直聘',
  zhilian: '智联招聘',
  liepin: '猎聘',
  '51job': '51job',
  lagou: '拉勾',
  zhaopin: '智联招聘',
  maimai: '脉脉',
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  manual: '手动输入',
  other: '其他',
};

const PLATFORM_COLOR: Record<string, string> = {
  boss: 'bg-emerald-50 text-emerald-600',
  zhilian: 'bg-blue-50 text-blue-600',
  liepin: 'bg-orange-50 text-orange-600',
  '51job': 'bg-indigo-50 text-indigo-600',
  lagou: 'bg-red-50 text-red-600',
  zhaopin: 'bg-blue-50 text-blue-600',
  maimai: 'bg-purple-50 text-purple-600',
  linkedin: 'bg-sky-50 text-sky-600',
  indeed: 'bg-slate-50 text-slate-600',
  manual: 'bg-slate-50 text-slate-500',
  other: 'bg-slate-50 text-slate-500',
};

type TabKey = 'manual' | 'url' | 'batch';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'manual', label: '手动输入' },
  { key: 'url', label: '链接导入' },
  { key: 'batch', label: '批量导入' },
];

const SCORE_COLORS = [
  { min: 80, color: '#22c55e', bg: '#dcfce7', label: '高度匹配' },
  { min: 60, color: '#eab308', bg: '#fef9c3', label: '部分匹配' },
  { min: 0, color: '#ef4444', bg: '#fee2e2', label: '匹配度低' },
];

function getScoreInfo(score: number) {
  for (const band of SCORE_COLORS) {
    if (score >= band.min) return band;
  }
  return SCORE_COLORS[SCORE_COLORS.length - 1];
}

/* ---------- components ---------- */

/** Ring chart showing a match percentage */
function ScoreRing({ score, size = 96 }: { score: number; size?: number }) {
  const info = getScoreInfo(score);
  const r = (size - 12) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth="5" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={info.color}
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <span className="absolute text-xl font-bold" style={{ color: info.color }}>
        {score}
      </span>
    </div>
  );
}

/** Score bar (compact) */
function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-14 flex-shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${value}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-6 text-right" style={{ color }}>{value}</span>
    </div>
  );
}

/** Skill gap badge */
function SkillBadge({ name, level }: { name: string; level: SkillGap['level'] }) {
  const styles: Record<SkillGap['level'], string> = {
    missing: 'bg-red-50 text-red-600 border-red-200',
    weak: 'bg-amber-50 text-amber-600 border-amber-200',
    strong: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  };
  const labels: Record<SkillGap['level'], string> = {
    missing: '缺失',
    weak: '薄弱',
    strong: '匹配',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${styles[level]}`}>
      <span className="w-1.5 h-1.5 rounded-full" style={{
        backgroundColor: level === 'strong' ? '#22c55e' : level === 'weak' ? '#eab308' : '#ef4444',
      }} />
      {name}
      <span className="opacity-60">({labels[level]})</span>
    </span>
  );
}

/* ---------- main page ---------- */

interface JobScannerProps {
  onPageChange?: (page: string) => void;
}

export default function JobScanner({ onPageChange }: JobScannerProps) {
  const { jobs, addJob, removeJob, updateJob } = useScanStore();
  const [activeTab, setActiveTab] = useState<TabKey>('manual');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [providers, setProviders] = useState<string[]>([]);

  // Form state
  const [manualText, setManualText] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [platformSelect, setPlatformSelect] = useState<string>('boss');
  const [batchText, setBatchText] = useState('');

  // Load ATS provider names from IPC on mount
  useEffect(() => {
    if (window.electronAPI?.scanProviders) {
      window.electronAPI.scanProviders()
        .then(setProviders)
        .catch(() => {/* IPC not available */});
    }
  }, []);

  const selected = jobs.find(j => j.id === selectedId) ?? null;

  /* ----- handlers ----- */

  const handleManualImport = useCallback(() => {
    if (!manualText.trim()) {
      toast.warning('请粘贴职位描述');
      return;
    }
    const id = addJob({ title: '', company: '', platform: 'manual', url: '', rawText: manualText.trim() });
    setManualText('');
    setSelectedId(id);
    toast.success('职位已导入');
  }, [manualText, addJob]);

  const handleUrlImport = useCallback(() => {
    if (!urlInput.trim()) {
      toast.warning('请输入职位链接');
      return;
    }
    const url = urlInput.trim();
    const id = addJob({ title: '', company: '', platform: platformSelect, url, rawText: url });
    setUrlInput('');
    setSelectedId(id);
    toast.success('链接已导入');
  }, [urlInput, platformSelect, addJob]);

  const handleBatchImport = useCallback(() => {
    if (!batchText.trim()) {
      toast.warning('请粘贴职位描述或多个链接');
      return;
    }
    const items = batchText.trim().split('\n').map(s => s.trim()).filter(Boolean);
    let count = 0;
    for (const item of items) {
      if (item.startsWith('http://') || item.startsWith('https://')) {
        addJob({ title: '', company: '', platform: 'other', url: item, rawText: item });
      } else if (item.length > 20) {
        addJob({ title: '', company: '', platform: 'manual', url: '', rawText: item });
      }
      count++;
    }
    setBatchText('');
    toast.success(`已导入 ${count} 个职位`);
  }, [batchText, addJob]);

  const handleAnalyze = useCallback(async (jobId: string) => {
    const job = jobs.find(j => j.id === jobId);
    if (!job) return;
    setLoadingId(jobId);
    updateJob(jobId, { status: 'analyzing' });

    // Run analysis via IPC (main process career-ops provider database)
    const { matchScore, skillGaps } = await runAnalysis(job);
    updateJob(jobId, { status: 'analyzed', matchScore, skillGaps });
    setLoadingId(null);
    setSelectedId(jobId);
  }, [jobs, updateJob]);

  const handleOptimize = useCallback((_job: ScannedJob) => {
    toast.success('正在跳转到 JD 匹配页面...');
    onPageChange?.('jd');
  }, [onPageChange]);

  /* ----- render ----- */

  return (
    <div className="flex-1 h-full overflow-hidden bg-[#F8F7F4] dark:bg-slate-900">
      <div className="flex h-full gap-6 p-8">
        {/* ============ LEFT PANEL: Import ============ */}
        <div className="w-[440px] flex-shrink-0 flex flex-col">
          {/* Header */}
          <div className="mb-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-sky-50 text-sky-600 mb-3">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12 6.477 2 12 2s10 4.477 10 10z"/>
                <path d="M12 6v6l4 2"/>
                <circle cx="12" cy="12" r="1"/>
              </svg>
              Job Scanner
            </span>
            <h1 className="text-2xl font-bold font-display" style={{ color: '#1E293B' }}>职位扫描</h1>
          </div>

          {/* Import card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 flex flex-col">
            {/* Tabs */}
            <div className="flex border-b border-slate-100">
              {TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 py-3 text-sm font-medium transition-colors relative ${
                    activeTab === tab.key
                      ? 'text-sky-600'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.key && (
                    <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-sky-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="p-4">
              {activeTab === 'manual' && (
                <div className="space-y-3">
                  <label className="block text-sm text-slate-600 font-medium">粘贴职位描述</label>
                  <textarea
                    value={manualText}
                    onChange={e => setManualText(e.target.value)}
                    placeholder={`例如：\n职位名称：高级前端工程师\n\n岗位职责：\n1. 负责公司核心产品的前端架构设计...\n\n任职要求：\n1. 5年以上前端开发经验...`}
                    className="w-full h-56 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors"
                    style={{ backgroundColor: '#FCFCFB' }}
                  />
                  <button
                    onClick={handleManualImport}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    导入职位
                  </button>
                </div>
              )}

              {activeTab === 'url' && (
                <div className="space-y-3">
                  <label className="block text-sm text-slate-600 font-medium">职位链接</label>
                  <input
                    type="url"
                    value={urlInput}
                    onChange={e => setUrlInput(e.target.value)}
                    placeholder="https://www.zhipin.com/job_detail/..."
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors"
                    style={{ backgroundColor: '#FCFCFB' }}
                  />
                  <label className="block text-sm text-slate-600 font-medium">选择平台</label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      ...Object.entries(PLATFORM_LABEL).filter(([k]) =>
                        k !== 'manual' && k !== 'other'
                      ),
                      ...providers
                        .filter(p => !(p in PLATFORM_LABEL))
                        .map(p => [p, PLATFORM_LABEL[p] || p] as [string, string]),
                    ].map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setPlatformSelect(key)}
                        className={`py-2 rounded-lg text-xs font-medium border transition-colors ${
                          platformSelect === key
                            ? 'border-sky-400 bg-sky-50 text-sky-600'
                            : 'border-slate-200 text-slate-500 hover:border-slate-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={handleUrlImport}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    导入链接
                  </button>
                </div>
              )}

              {activeTab === 'batch' && (
                <div className="space-y-3">
                  <label className="block text-sm text-slate-600 font-medium">
                    批量粘贴（每行一个链接或一段职位描述）
                  </label>
                  <textarea
                    value={batchText}
                    onChange={e => setBatchText(e.target.value)}
                    placeholder={`https://www.zhipin.com/job_detail/...\nhttps://www.liepin.com/job/...\n\n职位名称：后端工程师\n岗位要求：...`}
                    className="w-full h-56 p-3 text-sm border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-400 transition-colors"
                    style={{ backgroundColor: '#FCFCFB' }}
                  />
                  <button
                    onClick={handleBatchImport}
                    className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    批量导入
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* Quick stats */}
          {jobs.length > 0 && (
            <div className="mt-4 bg-white rounded-xl shadow-sm border border-slate-100 p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">已导入职位</span>
                <span className="font-semibold text-slate-700">{jobs.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-500">已分析</span>
                <span className="font-semibold text-slate-700">{jobs.filter(j => j.status === 'analyzed').length}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-500">匹配度 &ge; 80%</span>
                <span className="font-semibold text-emerald-600">
                  {jobs.filter(j => j.matchScore && j.matchScore.overall >= 80).length}
                </span>
              </div>
            </div>
          )}

        </div>

        {/* ============ RIGHT PANEL: Job List + Detail ============ */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* List header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold" style={{ color: '#1E293B' }}>
              职位列表
              {jobs.length > 0 && <span className="ml-2 text-sm font-normal text-slate-400">({jobs.length})</span>}
            </h2>
            {jobs.length > 0 && (
              <button
                onClick={() => { useScanStore.getState().clearJobs(); setSelectedId(null); }}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                清空全部
              </button>
            )}
          </div>

          {/* Job list / detail area */}
          <div className="flex-1 overflow-y-auto space-y-0 min-h-0">
            {jobs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="12" y1="18" x2="12" y2="12"/>
                  <line x1="9" y1="15" x2="15" y2="15"/>
                </svg>
                <p className="mt-3 text-sm text-slate-400">还没有导入职位</p>
                <p className="text-xs text-slate-300 mt-1">通过左侧面板导入职位描述或链接</p>
              </div>
            ) : (
              <>
                {selected ? (
                  /* --- Detail view --- */
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
                    {/* Back button */}
                    <button
                      onClick={() => setSelectedId(null)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 mb-4 transition-colors"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                      </svg>
                      返回列表
                    </button>

                    {/* Job header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-slate-800 truncate">{selected.title}</h3>
                        <p className="text-sm text-slate-500 mt-0.5">{selected.company}</p>
                      </div>
                      <span className={`flex-shrink-0 px-2 py-0.5 rounded text-xs font-medium ${PLATFORM_COLOR[selected.platform]}`}>
                        {PLATFORM_LABEL[selected.platform]}
                      </span>
                    </div>

                    {/* Status / Analysis */}
                    {selected.status === 'imported' && (
                      <div className="flex flex-col items-center py-8 gap-4">
                        <p className="text-sm text-slate-400">等待分析</p>
                        <button
                          onClick={() => handleAnalyze(selected.id)}
                          className="px-6 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          分析匹配
                        </button>
                      </div>
                    )}

                    {selected.status === 'analyzing' && (
                      <div className="flex flex-col items-center py-8 gap-3">
                        <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-sm text-slate-400">正在分析匹配度...</p>
                      </div>
                    )}

                    {selected.status === 'analyzed' && selected.matchScore && (
                      <div className="space-y-5">
                        {/* Score ring + bars */}
                        <div className="flex gap-6">
                          <div className="flex flex-col items-center gap-1">
                            <ScoreRing score={selected.matchScore.overall} size={96} />
                            <span className="text-xs text-slate-400">
                              {getScoreInfo(selected.matchScore.overall).label}
                            </span>
                          </div>
                          <div className="flex-1 space-y-2 pt-1">
                            <ScoreBar label="技能匹配" value={selected.matchScore.skills} color="#3b82f6" />
                            <ScoreBar label="经验匹配" value={selected.matchScore.experience} color="#8b5cf6" />
                            <ScoreBar label="学历匹配" value={selected.matchScore.education} color="#06b6d4" />
                          </div>
                        </div>

                        {/* Skill gap analysis */}
                        {selected.skillGaps && selected.skillGaps.length > 0 && (
                          <div>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2">技能差距分析</h4>
                            <div className="flex flex-wrap gap-1.5">
                              {selected.skillGaps.map((gap, i) => (
                                <SkillBadge key={i} name={gap.skill} level={gap.level} />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Original text (collapsible) */}
                        <details className="group">
                          <summary className="text-xs text-slate-400 cursor-pointer hover:text-slate-600 transition-colors select-none">
                            查看原始文本
                          </summary>
                          <pre className="mt-2 p-3 bg-slate-50 rounded-lg text-xs text-slate-500 whitespace-pre-wrap max-h-48 overflow-y-auto">
                            {selected.url && selected.url.startsWith('http')
                              ? `链接: ${selected.url}\n\n${selected.rawText}`
                              : selected.rawText}
                          </pre>
                        </details>

                        {/* Actions */}
                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleOptimize(selected)}
                            className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            根据此JD优化简历
                          </button>
                          <button
                            onClick={() => handleAnalyze(selected.id)}
                            className="px-4 py-2.5 border border-slate-200 text-slate-500 hover:bg-slate-50 text-sm font-medium rounded-lg transition-colors"
                            title="重新分析"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="23 4 23 10 17 10"/>
                              <path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/>
                            </svg>
                          </button>
                          <button
                            onClick={() => { removeJob(selected.id); setSelectedId(null); }}
                            className="px-4 py-2.5 border border-slate-200 text-red-400 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors"
                            title="删除"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="3 6 5 6 21 6"/>
                              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
                            </svg>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* --- Job cards list --- */
                  <div className="space-y-2">
                    {jobs.map(job => (
                      <JobCard
                        key={job.id}
                        job={job}
                        loading={loadingId === job.id}
                        onClick={() => setSelectedId(job.id)}
                        onAnalyze={() => handleAnalyze(job.id)}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- sub components ---------- */

function JobCard({ job, loading, onClick, onAnalyze }: {
  job: ScannedJob;
  loading: boolean;
  onClick: () => void;
  onAnalyze: () => void;
}) {
  const scoreInfo = job.matchScore ? getScoreInfo(job.matchScore.overall) : null;

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-slate-200 transition-all duration-200 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800 truncate">{job.title}</h3>
            <span className={`flex-shrink-0 px-1.5 py-0.5 rounded text-[10px] font-medium ${PLATFORM_COLOR[job.platform]}`}>
              {PLATFORM_LABEL[job.platform]}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
        </div>

        {/* Score or status badge */}
        <div className="flex-shrink-0 flex items-center gap-2">
          {job.status === 'analyzed' && job.matchScore && (
            <div className="flex items-center gap-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: scoreInfo?.bg || '#f1f5f9', color: scoreInfo?.color || '#94a3b8' }}
              >
                {job.matchScore.overall}
              </div>
            </div>
          )}
          {job.status === 'imported' && (
            <button
              onClick={e => { e.stopPropagation(); onAnalyze(); }}
              disabled={loading}
              className="px-2.5 py-1.5 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white text-xs font-medium rounded-lg transition-colors whitespace-nowrap"
            >
              {loading ? '分析中...' : '分析匹配'}
            </button>
          )}
          {job.status === 'analyzing' && (
            <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
    </div>
  );
}
