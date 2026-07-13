import type { Resume, ResumeVersion } from '@/types/resume';
export { buildATSEvalPrompt } from './prompts/ats';
export {
  buildCompanyResearchPrompt,
  buildSalaryAnalysisPrompt,
} from './prompts/company';
export type {
  CompanyResearchResult,
  SalaryAnalysisResult,
} from './prompts/company';
export {
  buildSTARPrompt,
  buildSTARBankPrompt,
} from './prompts/star';
export type {
  STARStory,
  STARStoryResult,
  STARBankResult,
} from './prompts/star';
export { buildGrammarCheckPrompt, buildTranslationPrompt } from './prompts/grammar';
export type { GrammarIssue, GrammarCheckResult } from './prompts/grammar';
export { buildInterviewPrompt } from './prompts/interview';
export { buildGuidedPrompt } from './prompts/interview';
export type { InterviewRole, InterviewResponse } from './prompts/interview';
export {
  INTERVIEW_ROLES,
  ROLE_LABELS,
  ROLE_ICONS,
  ROLE_DESCRIPTIONS,
  ROLE_COLORS,
} from './prompts/interview';

// ---------------------------------------------------------------------------
// Helper: serialize resume sections into a compact text representation
// ---------------------------------------------------------------------------
function serializeResume(resume: Resume): string {
  const parts = [`简历标题: ${resume.title}`, `版本: ${resume.version}`, ''];
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
// Tier-specific resume generation prompt
// ---------------------------------------------------------------------------
const TIER_INSTRUCTIONS: Record<ResumeVersion, string> = {
  general: '',
  big: `【角色定位】你是拥有10年以上互联网大厂招聘经验的资深HR专家，精通字节、阿里、腾讯、华为等头部企业的简历筛选标准与职级匹配规则。

【核心要求】
1. 整体定位：对标大厂对应职级的能力要求，突出体系化思维、数据驱动能力与项目复杂度，打造「标准化优秀人才」画像
2. 经历表述：
   - 所有工作/项目经历严格遵循STAR法则，以强动作动词开头，所有成果必须量化，突出数据量级、业务规模、效率提升、成本优化等核心指标
   - 重点突出跨部门协同、项目owner意识、方法论沉淀、流程SOP搭建、经验复用、复盘优化等大厂看重的能力点
   - 拔高但不造假，将零散的执行工作提炼为体系化的项目动作，体现思考深度与成长潜力
   - 用强动词开头（主导、负责、主导设计、搭建、优化、推动、实现等），避免'参与了''协助了'等弱表述
   - 每个成果必须量化（百分比、金额、时间、规模等），没有具体数据的用'显著提升''大幅优化'等程度副词
   - 将日常工作提炼为专业表述，突出技术深度和业务价值
   - 保持真实性，但不要过于保守，充分展示个人贡献
3. 简历结构：
   - 开头设置「核心竞争力」模块，用3-4条高度凝练的短句匹配目标岗位核心要求，植入大厂高频关键词
   - 主体按「工作经历/实习经历 > 项目经历 > 教育背景 > 专业技能 > 证书奖项」排序，重点内容前置
   - 每份经历按照「负责模块-核心动作-关键成果-沉淀价值」的逻辑展开
4. 语言风格：专业严谨，使用大厂通用专业表述（如OKR对齐、链路搭建、沉淀复用、降本增效、复盘迭代等），避免口语化，无空话套话
5. 禁忌：不得编造虚假经历，不得出现夸大到不符合逻辑的数据，不得出现口语化、流水账表述
6. 严格控制在一页以内：
   - 每条工作/项目经历描述控制在 2-4 行，不要超过 4 行
   - 整体内容必须严格控制在 1 页 A4 纸范围内，超出部分将被截断
   - 技能列表用逗号分隔一句话写完，不要换行
   - 删除所有冗余描述，保留最核心的信息`,
  mid: `【角色定位】你是拥有8年以上中高层招聘经验的人力专家，熟悉垂类头部公司、准上市企业、区域龙头企业的招聘逻辑。

【核心要求】
1. 整体定位：打造「能快速上手、能带业务增长」的实干型人才画像，突出落地能力与业务价值，兼顾方法与结果
2. 经历表述：
   - 重点突出独立负责的业务模块、从0到1的冷启动经验、业务卡点突破、业绩增长等核心成果，数据优先体现业务相关指标（营收、用户、转化、效率等）
   - 弱化过于宏大的体系化表述，强化「你具体做了什么、带来了什么直接业务结果」，体现独当一面的能力
   - 突出垂直赛道的相关经验，匹配目标公司的业务方向，强化「来了就能上手」的感知
   - 用强动词开头（主导、负责、主导设计、搭建、优化、推动、实现等），避免'参与了''协助了'等弱表述
   - 每个成果必须量化（百分比、金额、时间、规模等），没有具体数据的用'显著提升''大幅优化'等程度副词
   - 将日常工作提炼为专业表述，突出技术深度和业务价值
   - 保持真实性，但不要过于保守，充分展示个人贡献
3. 简历结构：
   - 开头设置「个人优势」模块，用3条左右短句突出核心技能+赛道经验+核心成果，快速抓住业务负责人眼球
   - 主体按「工作经历/实习经历 > 项目经历 > 教育背景 > 专业技能」排序，经历描述详略得当，核心成果前置
   - 每份经历按照「职责范围-核心动作-业务结果」的逻辑展开，重点突出结果
4. 语言风格：务实落地，避免空谈方法论，不用过度堆砌大厂黑话，表述精准有说服力
5. 禁忌：不得编造虚假经历，不得只讲方法论没有落地结果，不得过于空泛
6. 严格控制在一页以内：
   - 每条工作/项目经历描述控制在 2-4 行，不要超过 4 行
   - 整体内容必须严格控制在 1 页 A4 纸范围内，超出部分将被截断
   - 技能列表用逗号分隔一句话写完，不要换行
   - 删除所有冗余描述，保留最核心的信息
7. 重点经验标签: 独立负责 / 专业深度`,
  small: `【角色定位】你是深耕中小企业招聘的资深HR，熟悉创业公司、中小微企业的用人需求。

【核心要求】
1. 整体定位：打造「技能过硬、上手快、能扛事」的实操型人才画像，突出硬技能熟练度与执行力，降低企业培养成本预期
2. 经历表述：
   - 重点突出具体实操内容、掌握的工具软件、解决的具体问题、直接产出的结果，不用刻意拔高方法论
   - 体现多面手能力，突出你跨模块做过的工作，展示一人多岗的价值
   - 表述直白具体，多用实操动词，让面试官一眼就能看出来你做过什么、会不会做
   - 用强动词开头（主导、负责、主导设计、搭建、优化、推动、实现等），避免'参与了''协助了'等弱表述
   - 每个成果必须量化（百分比、金额、时间、规模等），没有具体数据的用'显著提升''大幅优化'等程度副词
   - 将日常工作提炼为专业表述，突出技术深度和业务价值
   - 保持真实性，但不要过于保守，充分展示个人贡献
3. 简历结构：
   - 开头直接放「专业技能」模块，清晰罗列掌握的工具、软件、硬技能，关键词精准匹配岗位JD
   - 主体按「工作经历/实习经历 > 项目经历 > 教育背景」排序，经历描述简洁直白，重点写具体做的事和直接结果
   - 不用设置复杂的总结模块，重点突出实操能力
4. 语言风格：直白务实，少用专业黑话，拒绝空话套话，突出执行力与产出
5. 禁忌：不得编造虚假经历，不得堆砌空泛的方法论，不得过度拔高脱离实际工作内容
6. 严格控制在一页以内：
   - 每条工作/项目经历描述控制在 2-4 行，不要超过 4 行
   - 整体内容必须严格控制在 1 页 A4 纸范围内，超出部分将被截断
   - 技能列表用逗号分隔一句话写完，不要换行
   - 删除所有冗余描述，保留最核心的信息
7. 重点经验标签: 综合能力 / 快速学习`,
};

export function buildTierPrompt(resume: Resume, tier: ResumeVersion): { system: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
  const instruction = TIER_INSTRUCTIONS[tier];

  // Only extract fields that need optimization
  const parts: string[] = []
  for (const section of resume.sections) {
    if (!section.isVisible) continue
    switch (section.type) {
      case 'summary':
        parts.push(`[summary]\n${section.content.text || ''}`)
        break
      case 'experience': {
        const items: any[] = section.content.items || []
        items.forEach((item, i) => {
          parts.push(`[experience_${i}]\n公司: ${item.company || ''} | 职位: ${item.role || ''}\n描述: ${item.description || ''}`)
        })
        break
      }
      case 'skills':
        parts.push(`[skills]\n${(section.content.skills || []).join(', ')}`)
        break
      case 'projects': {
        const items: any[] = section.content.items || []
        items.forEach((item, i) => {
          parts.push(`[projects_${i}]\n项目: ${item.name || ''} | 角色: ${item.role || ''}\n描述: ${item.description || ''}`)
        })
        break
      }
    }
  }

  const system = `你是一位简历优化专家。根据给定的层级要求，优化以下简历内容。

${instruction}

规则：
- 专业技能：只保留与工作/技术相关的技能，不相关的（如兴趣爱好类）直接去掉
- 工作/项目经历：用STAR法则优化描述，数据量化
- 个人简介：突出核心竞争力和职业方向
- 所有描述必须专业精炼，每条 2-4 行，确保整体控制在一页以内

请按以下格式返回优化后的内容（用 [section] 标记区分各个部分），只返回内容，不要额外说明：

[summary]
优化后的个人简介

[experience_0]
优化后的工作经历描述

[skills]
优化后的技能列表，只保留技术/工作相关

[projects_0]
优化后的项目描述`;

  const userMessage = `请优化为「${tier === 'big' ? '大厂适用版' : tier === 'mid' ? '中厂适用版' : '小厂适用版'}」。

需要优化的内容:
${parts.join('\n\n')}

按照要求的格式返回优化后的内容。`;

  return { system, messages: [{ role: 'user', content: userMessage }] };
}

// ---------------------------------------------------------------------------
// JD Analysis prompt
// ---------------------------------------------------------------------------
export function buildJDAnalysisPrompt(resume: Resume, jdText: string): { system: string; messages: { role: 'user'; content: string }[] } {
  const system = `你是一位专业的简历-JD匹配分析专家。你擅长分析简历与职位描述之间的匹配程度，找出差距并提供改进建议。
请以 **纯 JSON 格式** 返回分析结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "matchPercent": 整体匹配度 (0-100 数字),
  "gaps": [
    {
      "label": "能力/经验领域名称",
      "score": 单项评分 (0-100),
      "level": "good|partial|missing",
      "description": "分析说明"
    }
  ],
  "matchCounts": {
    "good": 匹配项数量,
    "partial": 部分匹配项数量,
    "missing": 缺失项数量
  }
}`;

  const resumeText = serializeResume(resume);

  const userMessage = `请分析以下简历与职位描述的匹配情况：

简历内容:
${resumeText}

职位描述 (JD):
${jdText}

请严格按照 JSON 格式返回分析结果。`;

  return { system, messages: [{ role: 'user', content: userMessage }] };
}

// ---------------------------------------------------------------------------
// Tailor resume by JD prompt
// ---------------------------------------------------------------------------
export function buildTailorPrompt(resume: Resume, jdText: string): { system: string; messages: { role: 'user'; content: string }[] } {
  const system = `你是一位专业的简历定制专家。你擅长根据职位描述 (JD) 调整简历内容，使简历更好地匹配目标岗位。
请以 **纯 JSON 格式** 返回优化后的简历，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "title": "定制化简历标题",
  "sections": [
    {
      "type": "section类型",
      "content": { ... 字段键值对 ... }
    }
  ]
}`;

  const resumeText = serializeResume(resume);

  const userMessage = `请根据以下职位描述 (JD) 优化简历，突出与 JD 匹配的关键经验和能力：

原始简历:
${resumeText}

职位描述 (JD):
${jdText}

要求:
- 突出 JD 中提到的关键能力和经验
- 调整措辞以匹配 JD 的关键词
- 保留真实经历，不要编造不实信息
- 使用量化数据展示成果
- 注意控制页数在 1 页以内

请严格按照 JSON 格式返回优化后的简历。`;

  return { system, messages: [{ role: 'user', content: userMessage }] };
}

// ---------------------------------------------------------------------------
// Chat prompt with optional tool-use instructions
// ---------------------------------------------------------------------------
export function buildChatPrompt(
  resume: Resume | null,
  history: { role: 'user' | 'ai'; content: string }[],
  message: string,
): { system: string; messages: { role: 'user' | 'assistant'; content: string }[] } {
  const resumeContext = resume ? `当前简历内容:\n${serializeResume(resume)}` : '当前没有活跃的简历。';

  const system = `你是一位 AI 简历助手，名叫「ResumeForge 助手」。你帮助用户优化简历内容、分析 JD 匹配度、润色工作描述、提供求职建议等。你适用于任何行业和职业，不限定于特定领域。

你可以使用以下工具（通过在回答末尾添加特殊标记来触发）:
- 重写简历段落: 当用户要求修改某部分内容时，在回答末尾添加:
  [TOOL]rewriteSection:{"sectionType":"类型 (如 experience)","content":{"字段名":"新内容"}}[/TOOL]

- 更新简历摘要: 在回答末尾添加:
  [TOOL]updateSummary:{"content":"新摘要内容"}[/TOOL]

当前上下文:
${resumeContext}

请用中文回答，语气专业友好。`;

  const chatHistory: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const msg of history.slice(-10)) {
    chatHistory.push({
      role: msg.role === 'ai' ? 'assistant' : 'user',
      content: msg.content,
    });
  }

  return { system, messages: [...chatHistory, { role: 'user', content: message }] };
}

// ---------------------------------------------------------------------------
// Extract tool calls from AI chat response
// ---------------------------------------------------------------------------
export interface ToolCall {
  tool: string;
  params: Record<string, unknown>;
}

export function extractToolCalls(text: string): ToolCall[] {
  const calls: ToolCall[] = [];
  const regex = /\[TOOL\](\w+):(\{[\s\S]*?\})\[\/TOOL\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    try {
      calls.push({ tool: match[1], params: JSON.parse(match[2]) });
    } catch {
      // skip invalid tool calls
    }
  }
  return calls;
}

// ---------------------------------------------------------------------------
// Tool call definitions used in chat
// ---------------------------------------------------------------------------

export interface ToolDefinition {
  name: string
  description: string
  parameters: Record<string, unknown>
}

export function getChatToolDefinitions(): ToolDefinition[] {
  return [
    {
      name: 'rewriteSection',
      description: '重写简历的某个段落或模块',
      parameters: {
        sectionType: { type: 'string', description: '段落类型，如 experience, summary, skills' },
        content: { type: 'object', description: '新的内容键值对' },
      },
    },
    {
      name: 'addSkill',
      description: '向简历的技能列表中添加新技能/能力',
      parameters: {
        skills: { type: 'array', items: { type: 'string' }, description: '要添加的技能/能力名称列表' },
      },
    },
    {
      name: 'optimizeForATS',
      description: '优化简历内容以提升 ATS 系统匹配度',
      parameters: {
        keywords: { type: 'array', items: { type: 'string' }, description: '要优化的关键词' },
      },
    },
    {
      name: 'checkGrammar',
      description: '检查简历文本的语法和拼写',
      parameters: {
        section: { type: 'string', description: '要检查的段落类型' },
      },
    },
  ]
}
