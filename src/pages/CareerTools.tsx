import { useState } from 'react';
import InterviewTips from './InterviewTips';
import SalaryCompare from './career/SalaryCompare';
import CompanyWatchlist from './career/CompanyWatchlist';
import InterviewCalendar from './career/InterviewCalendar';
import NetworkRecommend from './career/NetworkRecommend';
import KeywordOptimize from './career/KeywordOptimize';
import CareerAssess from './career/CareerAssess';

type ToolName = '人脉推荐' | '关键词优化' | '面试技巧' | '薪资对比' | '公司关注列表' | '面试日历' | '职业定位'

const TOOLS: { name: ToolName; icon: string; desc: string; iconBg: string; iconColor: string }[] = [
  { name: '薪资对比', icon: 'ph-currency-circle-dollar', desc: '对比不同 Offer 的薪资构成，包括基本薪资、股票期权和奖金，帮助你做出最优选择。', iconBg: 'bg-emerald-50', iconColor: 'text-emerald-500' },
  { name: '公司关注列表', icon: 'ph-buildings', desc: '追踪你关注的公司动态，记录投递和面试进度，不遗漏任何一个机会。', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  { name: '面试日历', icon: 'ph-calendar-check', desc: '管理所有面试安排，按时间排序展示，轻松跟踪面试进度。', iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  { name: '人脉推荐', icon: 'ph-users-three', desc: '基于你的行业和职业目标，智能推荐值得建立联系的业内人士。', iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
  { name: '关键词优化', icon: 'ph-magnifying-glass', desc: '分析职位描述关键词，优化简历内容以提升 ATS 匹配度。', iconBg: 'bg-blue-50', iconColor: 'text-blue-500' },
  { name: '面试技巧', icon: 'ph-chat-circle-text', desc: '非技术类面试高频问题应答策略，覆盖离职原因、优缺点、团队冲突等场景。', iconBg: 'bg-teal-50', iconColor: 'text-teal-500' },
  { name: '职业定位', icon: 'ph-compass', desc: '基于你的职业背景和技能，AI 推荐适合的发展方向并分析能力短板。', iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
]

function ToolShell({ title, children, onBack }: { title: string; children: React.ReactNode; onBack: () => void }) {
  return (
    <div className="flex-1 overflow-y-auto bg-[#F8F7F4]">
      <div className="sticky top-0 z-10 bg-[#F8F7F4] border-b border-slate-200 px-8 py-3 flex items-center gap-3">
        <button onClick={onBack} className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>返回
        </button>
        <span className="text-sm font-medium text-slate-700">{title}</span>
      </div>
      <div className="p-8">{children}</div>
    </div>
  )
}

const CareerTools: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolName | null>(null)
  const back = () => setActiveTool(null)

  if (activeTool === '薪资对比') {
    return <ToolShell title="薪资对比" onBack={back}><SalaryCompare /></ToolShell>
  }
  if (activeTool === '公司关注列表') {
    return <ToolShell title="公司关注列表" onBack={back}><CompanyWatchlist /></ToolShell>
  }
  if (activeTool === '面试日历') {
    return <ToolShell title="面试日历" onBack={back}><InterviewCalendar /></ToolShell>
  }
  if (activeTool === '人脉推荐') {
    return <ToolShell title="人脉推荐" onBack={back}><NetworkRecommend /></ToolShell>
  }
  if (activeTool === '关键词优化') {
    return <ToolShell title="关键词优化" onBack={back}><KeywordOptimize /></ToolShell>
  }
  if (activeTool === '面试技巧') {
    return (
      <ToolShell title="面试技巧" onBack={back}>
        <InterviewTips />
      </ToolShell>
    )
  }
  if (activeTool === '职业定位') {
    return <ToolShell title="职业定位" onBack={back}><CareerAssess /></ToolShell>
  }

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-[#F8F7F4]">
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 mb-3">
          <i className="ph-light ph-suitcase text-sm" />Career Tools
        </span>
        <h1 className="text-2xl font-bold mb-1" style={{ color: '#1E293B' }}>求职工具箱</h1>
        <p className="text-slate-500 text-sm">一站式职业发展工具，助你在求职路上做出更明智的决策。</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {TOOLS.map(t => (
          <div key={t.name} onClick={() => setActiveTool(t.name)}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group flex items-start gap-4"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${t.iconBg} ${t.iconColor} group-hover:scale-110 transition-transform duration-200`}>
              <i className={`ph-light ${t.icon}`} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold mb-1" style={{ color: '#1E293B' }}>{t.name}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{t.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default CareerTools;
