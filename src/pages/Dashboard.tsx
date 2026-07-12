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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 flex items-center gap-4 hover:shadow-md transition-shadow duration-200">
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
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-shadow duration-200 cursor-pointer group" onClick={onClick}>
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

  const loadStats = () => {
    window.electronAPI?.getTrackingStats().then(s => {
      if (s) { setAtsScore(s.atsScore); setDeliveryCount(s.deliveryCount); setInterviewCount(s.interviewCount) }
    }).catch(() => {})
  }

  useEffect(() => { fetchResumes(); loadStats() }, [fetchResumes]);

  const resumeCount = resumes.length;

  const handleCreateResume = async () => {
    await createResume();
    onPageChange?.('editor');
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8F7F4] dark:bg-slate-900">
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
              color="bg-sky-50 text-sky-500"
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
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                <i className="ph-light ph-file-text text-3xl text-brand-400" />
              </div>
              <p className="text-sm text-slate-400 mb-4">还没有简历，创建第一份简历开始</p>
              <button
                onClick={handleCreateResume}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:shadow-md transition-all duration-200"
                style={{ backgroundColor: '#14b8a6' }}
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
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
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
            <div className="text-center py-8">
              <i className="ph-light ph-clock-counter-clockwise text-2xl text-slate-200 mb-2 block" />
              <p className="text-xs text-slate-300">暂无活动</p>
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
