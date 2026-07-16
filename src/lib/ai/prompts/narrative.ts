import type { Resume } from '@/types/resume'

function serializeResume(resume: Resume): string {
  const parts = [`简历标题: ${resume.title}`, '']
  for (const s of resume.sections) {
    if (!s.isVisible) continue
    parts.push(`[${s.type}]`)
    for (const [k, v] of Object.entries(s.content)) {
      if (v) parts.push(`  ${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    }
    parts.push('')
  }
  return parts.join('\n')
}

export function buildNarrativePrompt(resume: Resume) {
  const system = `你是一位资深职业叙事分析师。分析简历的职业故事线，给出结构化评估。

分析维度:
1. 职业故事类型 — 这份简历在讲什么故事？(稳定深耕型/快速成长型/方向探索型/跨界转型型/混合型)
2. 故事连贯性 — 职业轨迹有没有逻辑断层？跳槽有没有合理的进阶理由？
3. 叙事质量 — 每段经历的描述是"做了什么"还是"实现了什么价值"？有没有 STAR 结构？
4. 身份一致性 — 简历呈现的人物形象是否前后一致？（如"技术极客"突然变成"商务拓展"）
5. 核心卖点 — 简历最突出的 1-2 个差异化优势是什么？HR 看完能记住什么？

返回 JSON 格式：
{
  "storyType": "稳定深耕型",
  "storyLabel": "故事类型的一句话概括",
  "coherence": { "score": 1-5, "issues": ["可能的问题1", "..."], "suggestion": "改进建议" },
  "narrativeQuality": { "score": 1-5, "issues": [...], "suggestion": "..." },
  "identityConsistency": { "score": 1-5, "issues": [...], "suggestion": "..." },
  "coreStrengths": ["优势1", "优势2"],
  "redFlags": ["危险信号1", "..."],
  "overallSuggestion": "全局改进建议（2-3句话）"
}`

  return {
    system,
    messages: [{ role: 'user' as const, content: `分析这份简历的职业叙事：\n\n${serializeResume(resume)}` }],
  }
}
