import React, { useEffect, useState } from 'react';
import { useResumeStore } from '@/stores/resumeStore';
import DeliveryModal from '@/components/dashboard/DeliveryModal';
import InterviewModal from '@/components/dashboard/InterviewModal';

interface StatCardProps {
  icon: string;
  label: string;
  value: string | number;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  return (
    <div className="card-doc p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-lg flex items-center justify-center text-xl ${color}`}
      >
        <i className={`ph-light ${icon}`} />
      </div>
      <div>
        <p className="font-display text-2xl font-bold text-[#1E293B]">{value}</p>
        <p className="text-sm text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  );
};

interface ResumeCardProps {
  title: string;
  updatedAt: string;
  onClick?: () => void;
}

const ResumeCard: React.FC<ResumeCardProps> = ({ title, updatedAt, onClick }) => {
  return (
    <div className="card-doc p-5 transition-all duration-300 cursor-pointer group" onClick={onClick}>
      <div className="w-10 h-10 rounded-lg bg-brand-50 flex items-center justify-center text-brand-500 mb-4 group-hover:bg-brand-100 transition-colors">
        <i className="ph-light ph-file-text text-xl" />
      </div>
      <h3 className="font-medium text-[#1E293B] mb-1 truncate">{title}</h3>
      <p className="text-xs text-slate-400">{updatedAt}</p>
    </div>
  );
};

/* Simple relative-time helper */
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} 小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} 天前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} 个月前`;
  return `${Math.floor(months / 12)} 年前`;
}

interface DashboardProps {
  onPageChange?: (page: string) => void
}

const Dashboard: React.FC<DashboardProps> = ({ onPageChange }) => {
  const resumes = useResumeStore((s) => s.resumes);
  const fetchResumes = useResumeStore((s) => s.fetchResumes);
  const createResume = useResumeStore((s) => s.createResume);
  const setActiveResume = useResumeStore((s) => s.setActiveResume);

  const [atsScore, setAtsScore] = useState<number | null>(null)
  const [deliveryCount, setDeliveryCount] = useState(0)
  const [interviewCount, setInterviewCount] = useState(0)
  const [showDelivery, setShowDelivery] = useState(false)
  const [showInterview, setShowInterview] = useState(false)
  const [activities, setActivities] = useState<Array<{ type: 'delivery' | 'interview'; data: any; time: string }>>([])

  const loadStats = () => {
    window.electronAPI?.getTrackingStats().then(s => {
      if (s) { setAtsScore(s.atsScore); setDeliveryCount(s.deliveryCount); setInterviewCount(s.interviewCount) }
    }).catch(() => {})
    // 加载最近活动（合并投递和面试，按时间倒序）
    Promise.all([
      window.electronAPI!.getDeliveries().catch(() => []),
      window.electronAPI!.getInterviews().catch(() => []),
    ]).then(([dels, ivs]) => {
      const merged: any[] = [
        ...dels.map((d: any) => ({ type: 'delivery' as const, data: d, time: d.created_at })),
        ...ivs.map((i: any) => ({ type: 'interview' as const, data: i, time: i.created_at })),
      ]
      merged.sort((a, b) => b.time.localeCompare(a.time))
      setActivities(merged.slice(0, 20))
    }).catch(() => {})
  }

  useEffect(() => { fetchResumes(); loadStats() }, [fetchResumes]);

  const resumeCount = resumes.length;

  const handleCreateResume = async () => {
    await createResume();
    onPageChange?.('editor');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F4F2ED] dark:bg-slate-900">
      {/* AI Guide Hero — 主功能入口 */}
      <div
        className="rounded-2xl p-6 mb-8 cursor-pointer transition-all duration-300 hover:shadow-xl group relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #D4875E 0%, #B8656F 50%, #A0607A 100%)' }}
        onClick={() => onPageChange?.('tiers')}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%)'
        }} />
        <div className="relative z-10 flex items-center gap-6">
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/20 backdrop-blur items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2.5a.5.5 0 01.5.5v2.5h2.5a.5.5 0 01.35.85l-2.5 2.5a.5.5 0 01-.85-.35V6h-2.5a.5.5 0 01-.35-.85l2.5-2.5A.5.5 0 0114.5 2.5zM18 14a.5.5 0 01.5.5V17h2.5a.5.5 0 01.35.85l-2.5 2.5A.5.5 0 0118 20v-2.5h-2.5a.5.5 0 01-.35-.85l2.5-2.5A.5.5 0 0118 14zM8 16a4 4 0 01-4-4V5a2 2 0 012-2h6v2H6v7a2 2 0 004 0v-1h2v1a4 4 0 01-4 4z"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white/90 bg-white/15 backdrop-blur">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                主功能
              </span>
              <span className="text-[11px] text-white/60">点击开始 AI 引导</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">AI 引导生成简历</h2>
            <p className="text-sm text-white/80 max-w-lg">
              与 AI 职业顾问对话，一步步帮你打造一份量身定制的专业简历。从行业到经历，从技能到故事，每个细节都精心打磨。
            </p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-white/80 group-hover:translate-x-1 transition-transform">
            <span className="text-sm font-medium">开始</span>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
        {/* 底部装饰线 */}
        <div className="absolute bottom-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      </div>

      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-brand-50 text-brand-600 mb-3">
          <i className="ph-light ph-layout text-sm" />
          Dashboard
        </span>
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: '#1E293B' }}
        >
          欢迎回来
        </h1>
        <p className="text-slate-500 text-sm">
          这是你的简历管理中心，今天也是美好的一天。
        </p>
      </div>

      {/* Main content */}
      <div className="flex gap-6">
        {/* Left column */}
        <div className="flex-1 min-w-0">
          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon="ph-file-text"
              label="简历总数"
              value={resumeCount}
              color="bg-brand-50 text-brand-500"
            />
            <StatCard
              icon="ph-gauge"
              label="ATS评分"
              value={atsScore ?? '-'}
              color="bg-[rgba(212,135,94,0.10)] text-[#D4875E]"
            />
            <div onClick={() => setShowDelivery(true)} className="cursor-pointer">
              <StatCard
                icon="ph-paper-plane"
                label="投递次数"
                value={deliveryCount}
                color="bg-violet-50 text-violet-500"
              />
            </div>
            <div onClick={() => setShowInterview(true)} className="cursor-pointer">
              <StatCard
                icon="ph-video-camera"
                label="面试机会"
                value={interviewCount}
                color="bg-amber-50 text-amber-500"
              />
            </div>
          </div>

          {/* Resume section */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2
                className="text-lg font-bold"
                style={{ color: '#1E293B' }}
              >
                我的简历
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                共 {resumeCount} 份简历
              </p>
            </div>
          </div>

          {/* Resume grid or empty state */}
          {resumeCount === 0 ? (
            <div className="card-doc p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                <i className="ph-light ph-file-text text-3xl text-brand-400" />
              </div>
              <p className="text-sm text-slate-400 mb-4">还没有简历，创建第一份简历开始</p>
              <button
                onClick={handleCreateResume}
                className="btn-pill primary inline-flex items-center gap-1.5"
              >
                <i className="ph-light ph-plus text-base" />
                新建简历
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {resumes.map((resume) => (
                <ResumeCard
                  key={resume.id}
                  title={resume.title}
                  updatedAt={`最后编辑 ${relativeTime(resume.updatedAt)}`}
                  onClick={() => {
                    setActiveResume(resume.id);
                    onPageChange?.('editor');
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="w-72 flex-shrink-0">
          <div className="card-doc p-5">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="font-bold text-sm"
                style={{ color: '#1E293B' }}
              >
                最近活动
              </h3>
              <span className="text-xs text-brand-500 font-medium">
                查看全部
              </span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto">
              {activities.length === 0 ? (
                <div className="text-center py-6">
                  <i className="ph-light ph-clock-counter-clockwise text-2xl text-slate-200 mb-2 block" />
                  <p className="text-xs text-slate-300">暂无活动</p>
                </div>
              ) : activities.map((a, i) => (
                <div key={`${a.type}-${a.data.id}`} className="flex items-start gap-3 pb-3 border-b border-slate-50 last:border-0">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${a.type === 'delivery' ? 'bg-violet-50' : 'bg-amber-50'}`}>
                    <i className={`ph-light text-xs ${a.type === 'delivery' ? 'ph-paper-plane text-violet-500' : 'ph-video-camera text-amber-500'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700">
                      {a.type === 'delivery'
                        ? `投递了 ${a.data.company} · ${a.data.role}`
                        : `面试 ${a.data.company} · ${a.data.role}`
                      }
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{relativeTime(a.time)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showDelivery && <DeliveryModal onClose={() => setShowDelivery(false)} onUpdate={loadStats} />}
      {showInterview && <InterviewModal onClose={() => setShowInterview(false)} onUpdate={loadStats} />}
    </div>
  );
};

export default Dashboard;
