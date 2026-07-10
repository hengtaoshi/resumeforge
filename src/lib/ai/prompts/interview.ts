import type { Resume } from '@/types/resume';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type InterviewRole = 'hr' | 'tech' | 'behavior' | 'scene' | 'deep' | 'leadership';

export interface InterviewResponse {
  role: string;
  question: string;
  feedback?: string;
  tips?: string[];
  nextRole?: string;
}

// ---------------------------------------------------------------------------
// Role constants
// ---------------------------------------------------------------------------

export const INTERVIEW_ROLES: InterviewRole[] = [
  'hr',
  'tech',
  'behavior',
  'scene',
  'deep',
  'leadership',
];

export const ROLE_LABELS: Record<InterviewRole, string> = {
  hr: 'HR 面试官',
  tech: '技术面试官',
  behavior: '行为面试官',
  scene: '场景面试官',
  deep: '深入面试官',
  leadership: '领导力面试官',
};

export const ROLE_ICONS: Record<InterviewRole, string> = {
  hr: 'ph-user-circle',
  tech: 'ph-code',
  behavior: 'ph-chats-circle',
  scene: 'ph-lightbulb',
  deep: 'ph-magnifying-glass',
  leadership: 'ph-crown',
};

export const ROLE_DESCRIPTIONS: Record<InterviewRole, string> = {
  hr: '文化契合度 / 求职动机 / 职业规划',
  tech: '技术深度 / 问题解决能力',
  behavior: 'STAR 法则行为面试',
  scene: '情景判断与决策能力',
  deep: '深入追问与压力测试',
  leadership: '管理视野与战略思维',
};

export const ROLE_COLORS: Record<InterviewRole, { bg: string; text: string; ring: string; badgeBg: string }> = {
  hr:   { bg: 'bg-sky-50', text: 'text-sky-700', ring: 'ring-sky-200', badgeBg: 'bg-sky-500' },
  tech: { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-emerald-200', badgeBg: 'bg-emerald-500' },
  behavior: { bg: 'bg-violet-50', text: 'text-violet-700', ring: 'ring-violet-200', badgeBg: 'bg-violet-500' },
  scene: { bg: 'bg-amber-50', text: 'text-amber-700', ring: 'ring-amber-200', badgeBg: 'bg-amber-500' },
  deep: { bg: 'bg-rose-50', text: 'text-rose-700', ring: 'ring-rose-200', badgeBg: 'bg-rose-500' },
  leadership: { bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', badgeBg: 'bg-orange-500' },
};

// ---------------------------------------------------------------------------
// Role system prompts
// ---------------------------------------------------------------------------

const ROLE_SYSTEM_PROMPTS: Record<InterviewRole, string> = {
  hr: `## 角色定位
你是一位资深的HR面试官，擅长评估候选人的文化契合度、求职动机和职业规划。

## 面试风格
友好但专业，注重了解候选人的价值观、工作偏好和长期发展目标。

## 考察重点
- 为什么选择这个行业 / 岗位
- 职业规划和发展方向
- 团队协作和沟通风格
- 对公司和岗位的理解
- 价值观和文化契合度`,

  tech: `## 角色定位
你是一位资深的技术面试官，擅长评估候选人的技术深度和问题解决能力。

## 面试风格
逻辑严谨，由浅入深，注重思维过程和技术原理。

## 考察重点
- 核心技术栈的深度理解
- 系统设计和架构能力
- 问题分析和解决思路
- 代码质量和最佳实践
- 技术选型和权衡能力`,

  behavior: `## 角色定位
你是一位专业的行为面试官，精通 STAR（情境 — 任务 — 行动 — 结果）面试法。

## 面试风格
结构化追问，深入挖掘候选人的真实行为和贡献。

## 考察重点
- 用 STAR 法则考察关键经历
- 量化成果和影响力
- 团队协作和冲突处理
- 领导力和主动性
- 失败经历和反思`,

  scene: `## 角色定位
你是一位资深的场景面试官，擅长通过情景判断问题评估候选人的决策能力。

## 面试风格
设定具体工作场景，考察候选人的分析和决策过程。

## 考察重点
- 面对复杂情况的判断力
- 优先级排序和取舍能力
- 风险识别和应对策略
- 沟通和利益平衡
- 决策逻辑和思考框架`,

  deep: `## 角色定位
你是一位深入的追问型面试官，擅长通过连续追问考察候选人的思考深度。

## 面试风格
刨根问底，不断深入，不容许模糊回答，测试知识边界。

## 考察重点
- 技术 / 业务原理的深入理解
- 经验背后的思考总结
- 面对压力时的反应
- 知识体系的完整度
- 学习的深度和广度`,

  leadership: `## 角色定位
你是一位资深的领导力面试官，擅长评估候选人的管理能力和战略思维。

## 面试风格
高屋建瓴，关注大局观和影响力。

## 考察重点
- 团队管理和人才培养
- 战略规划和执行能力
- 跨部门协作和资源整合
- 变革推动和创新能力
- 愿景和价值观引领`,
};

// ---------------------------------------------------------------------------
// Helper: serialize resume into compact text
// ---------------------------------------------------------------------------

function serializeResume(resume: Resume): string {
  const parts = [`简历标题: ${resume.title}`, ''];
  for (const section of resume.sections) {
    if (!section.isVisible) continue;
    parts.push(`[${section.type}]`);
    for (const [key, value] of Object.entries(section.content)) {
      if (value) {
        parts.push(`  ${key}: ${typeof value === 'string' ? value : JSON.stringify(value)}`);
      }
    }
    parts.push('');
  }
  return parts.join('\n');
}

// ---------------------------------------------------------------------------
// buildInterviewPrompt
// ---------------------------------------------------------------------------

/**
 * Build a system prompt and initial user message for the mock interview.
 *
 * @param resume   – the current resume (nullable)
 * @param roleType – which interviewer role to play
 * @param question – the user's latest message (e.g. "开始面试" or an answer)
 */
export function buildInterviewPrompt(
  resume: Resume | null,
  roleType: InterviewRole,
  question: string,
): { system: string; messages: { role: 'user'; content: string }[] } {
  const roleLabel = ROLE_LABELS[roleType];
  const rolePrompt = ROLE_SYSTEM_PROMPTS[roleType];
  const resumeContext = resume
    ? `\n\n## 候选人简历背景\n${serializeResume(resume)}`
    : '\n\n（暂无简历信息，请根据候选人的回答灵活提问）';

  const system = `你是一位专业的面试官，正在进行一场「${roleLabel}」模拟面试。

${rolePrompt}

## 面试规则
1. 每次只问一个问题，等待候选人回答
2. 根据候选人的简历背景提出个性化、有针对性的问题
3. 候选人回答后，先给予具体的反馈（指出亮点和改进方向），再提出下一个问题
4. 保持专业友好的态度，鼓励候选人展现最佳状态
5. 总共问 4–6 个问题后，给出整体表现评价和总结
6. 请用中文进行面试${resume ? '，结合候选人简历中的经历进行提问' : ''}

${resumeContext}

现在开始面试。请根据以上角色设定，提出第一个问题。`;

  return { system, messages: [{ role: 'user', content: question }] };
}
