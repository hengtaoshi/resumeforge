import React from 'react';
import toast from '@/lib/toast';

interface ToolCardProps {
  icon: string;
  title: string;
  description: string;
  iconBg: string;
  iconColor: string;
  onClick?: () => void;
}

const tools: ToolCardProps[] = [
  { icon: 'ph-magnifying-glass', title: '职位扫描',
    description: '自动扫描主流招聘平台，根据你的简历画像智能推荐匹配度最高的职位，省去手动搜索的繁琐。',
    iconBg: 'bg-sky-50', iconColor: 'text-sky-500' },
  { icon: 'ph-users-three', title: '人脉推荐',
    description: '基于你的行业和职业目标，智能推荐值得建立联系的业内人士，拓展职业社交圈获取更多机会。',
    iconBg: 'bg-violet-50', iconColor: 'text-violet-500' },
  { icon: 'ph-gauge', title: 'ATS 评估',
    description: '六维评分系统全面评估简历的 ATS 兼容性，针对关键词密度、格式解析等给出优化建议。',
    iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
  { icon: 'ph-chats', title: '模拟面试',
    description: '6 种面试官角色可选（HR、技术主管、CEO 等），AI 实时反馈回答质量并给出改进方向。',
    iconBg: 'bg-rose-50', iconColor: 'text-rose-500' },
  { icon: 'ph-buildings', title: '公司研究',
    description: '深度模式了解公司背景、产品矩阵、融资历程和文化价值观，面试前做到心中有数。',
    iconBg: 'bg-purple-50', iconColor: 'text-purple-500' },
  { icon: 'ph-currency-circle-dollar', title: '薪酬分析',
    description: '薪酬谈判框架 + 行业薪资数据库，输入岗位和城市即可获取精准的薪资区间参考。',
    iconBg: 'bg-amber-50', iconColor: 'text-amber-500' },
];

interface CareerToolsProps { onPageChange?: (page: string) => void }

const CareerTools: React.FC<CareerToolsProps> = ({ onPageChange }) => {
  const handleClick = (title: string) => {
    switch (title) {
      case '职位扫描': onPageChange?.('scanner'); break;
      case 'ATS 评估': onPageChange?.('jd'); break;
      case '模拟面试': toast.info('打开AI助手，输入"开始模拟面试"即可选择面试官角色进行模拟面试'); break;
      case '公司研究': toast.info('打开AI助手，输入"研究 [公司名]"即可获取深度公司研究报告'); break;
      case '薪酬分析': toast.info('打开AI助手，输入"薪酬分析 [岗位] [城市] [经验]"即可获取薪酬参考'); break;
      default: toast.info(`${title}功能正在开发中，敬请期待`);
    }
  };
  return (
    <div className="flex-1 p-8 overflow-y-auto" style={{ backgroundColor: '#F8F7F4' }}>
      {/* Header */}
      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-600 mb-3">
          <i className="ph-light ph-suitcase text-sm" />
          Career Tools
        </span>
        <h1 className="text-2xl font-bold mb-1 font-display" style={{ color: '#1E293B' }}>
          求职工具箱
        </h1>
        <p className="text-slate-500 text-sm">
          一站式职业发展工具，助你在求职路上做出更明智的决策。
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <div
            key={tool.title}
            onClick={() => handleClick(tool.title)}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 hover:shadow-md transition-all duration-200 cursor-pointer group flex items-start gap-4"
          >
            {/* Icon */}
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${tool.iconBg} ${tool.iconColor} group-hover:scale-110 transition-transform duration-200`}
            >
              <i className={`ph-light ${tool.icon}`} />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-semibold mb-1 group-hover:text-brand-500 transition-colors duration-200"
                style={{ color: '#1E293B' }}
              >
                {tool.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                {tool.description}
              </p>
            </div>

            {/* Arrow */}
            <div className="flex-shrink-0 text-slate-200 group-hover:text-brand-400 transition-colors duration-200 self-center">
              <i className="ph-light ph-arrow-right text-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CareerTools;
