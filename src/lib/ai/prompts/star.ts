// ---------------------------------------------------------------------------
// STAR story crafting prompt — helps users build compelling STAR-format
// (Situation, Task, Action, Result) stories from their own experience.
// ---------------------------------------------------------------------------

export interface STARStory {
  situation: string;
  task: string;
  action: string;
  result: string;
  reflection: string;
  suggestion?: string;
}

export interface STARStoryResult extends STARStory {
  suggestion: string;
}

export interface STARBankResult {
  stories: Array<{
    title: string;
    situation: string;
    task: string;
    action: string;
    result: string;
    reflection: string;
  }>;
}

// ---------------------------------------------------------------------------
// Single STAR story builder — given resume context and a situation type,
// helps the user craft one targeted STAR story.
// ---------------------------------------------------------------------------

export function buildSTARPrompt(
  resume: string,
  situation: 'leadership' | 'conflict' | 'achievement' | 'failure' | 'teamwork',
): { system: string; user: string } {
  const situationLabels: Record<string, string> = {
    leadership: '领导力',
    conflict: '冲突处理',
    achievement: '重大成就',
    failure: '失败与反思',
    teamwork: '团队协作',
  };

  const system = `你是一位资深的面试辅导专家，精通 STAR 法则（Situation-Task-Action-Result）。你帮助求职者从自身经历中提炼出精彩的 STAR 故事，用于面试回答。

请以 **纯 JSON 格式** 返回分析结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "situation": "背景描述 — 当时的情况是什么样的",
  "task": "任务描述 — 你需要完成什么目标",
  "action": "行动描述 — 你具体做了什么，突出你的贡献和思考过程",
  "result": "结果描述 — 取得了什么成果，尽量量化",
  "reflection": "反思总结 — 从这个经历中学到了什么",
  "suggestion": "面试表达建议 — 如何更好地在面试中讲述这个故事"
}

要求:
- 基于用户提供的简历经历，不要编造经历
- 行动部分要具体，突出个人贡献而非团队成果
- 结果尽量用数据量化
- 中文回答`;

  const user = `请根据以下简历经历，帮我提炼一个"${situationLabels[situation]}"类型的 STAR 故事。

简历经历:
${resume}

请严格按照 JSON 格式返回 STAR 故事。`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// STAR bank builder — scans the entire resume and generates a collection of
// STAR stories covering multiple situation types.
// ---------------------------------------------------------------------------

export function buildSTARBankPrompt(
  resume: string,
): { system: string; user: string } {
  const system = `你是一位资深的面试辅导专家，精通 STAR 法则（Situation-Task-Action-Result）。请从用户的完整简历中挖掘出多个可用 STAR 故事，覆盖不同类型的情境。

请以 **纯 JSON 格式** 返回分析结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "stories": [
    {
      "title": "故事标题（简短概括）",
      "situation": "背景描述",
      "task": "任务描述",
      "action": "行动描述，突出个人贡献",
      "result": "结果描述，尽量量化",
      "reflection": "反思总结"
    }
  ]
}

要求:
- 从简历中挖掘 3-5 个高质量的 STAR 故事
- 故事类型覆盖：领导力、冲突处理、重大成就、团队协作、失败与反思等
- 每个故事要有明确的个人贡献和可量化的结果
- 不要编造简历中不存在的信息
- 中文回答`;

  const user = `请根据以下完整简历内容，生成一份 STAR 故事库，覆盖不同类型的情境，方便面试时使用。

简历内容:
${resume}

请严格按照 JSON 格式返回 STAR 故事库。`;

  return { system, user };
}
