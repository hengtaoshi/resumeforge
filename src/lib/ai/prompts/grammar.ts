// ---------------------------------------------------------------------------
// Grammar Check Prompt
// ---------------------------------------------------------------------------

export interface GrammarIssue {
  type:
    | 'weak_verb'
    | 'vague_description'
    | 'grammar_error'
    | 'spelling'
    | 'passive_voice'
    | 'redundancy'
    | 'tense_inconsistency'
    | 'missing_keyword'
  text: string
  suggestion: string
  severity: 'low' | 'medium' | 'high'
}

export interface GrammarCheckResult {
  overallScore: number
  issues: GrammarIssue[]
  improvedText: string
}

export function buildGrammarCheckPrompt(text: string): {
  system: string
  user: string
} {
  const system = `你是一位专业的英文简历校对专家。你擅长检查简历中的语法问题、弱动词、模糊描述、拼写错误、语态问题、不一致时态以及 ATS 关键词缺失。

请以 **纯 JSON 格式** 返回分析结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "overallScore": 总体评分 (0-100 数字),
  "issues": [
    {
      "type": "问题类型 (weak_verb | vague_description | grammar_error | spelling | passive_voice | redundancy | tense_inconsistency | missing_keyword)",
      "text": "原文片段",
      "suggestion": "修改建议",
      "severity": "严重程度 (low | medium | high)"
    }
  ],
  "improvedText": "修改后的完整文本"
}`

  const user = `请检查以下简历文本中的语法和措辞问题，特别注意：
1. 弱动词（was, were, been 等）—— 替换为强动作动词
2. 模糊描述 —— 没有量化、影响不清晰
3. 语法错误
4. 被动语态过度使用
5. ATS 关键词缺失

${text}

请严格按照 JSON 格式返回检查结果。`

  return { system, user }
}

// ---------------------------------------------------------------------------
// Translation Prompt
// ---------------------------------------------------------------------------

export function buildTranslationPrompt(
  content: Record<string, unknown>,
  targetLang: string,
): { system: string; user: string } {
  const langMap: Record<string, string> = {
    en: '英文 (English)',
    'zh-CN': '简体中文',
    ja: '日语 (日本語)',
    ko: '韩语 (한국어)',
  }
  const langName = langMap[targetLang] || targetLang

  const system = `你是一位专业的简历本地化翻译专家。你擅长将简历内容在不同语言之间进行准确、专业的翻译，同时保持简历的正式语气和专业术语的准确性。

翻译要求:
- 保持专业简历的正式语气
- 确保专业术语的准确翻译
- 保留所有数据、数字、日期和专有名词不变
- 适配目标语言的简历文化习惯
- 保持 JSON 结构不变，只翻译字段值

请以 **纯 JSON 格式** 返回翻译结果，保持与原 JSON 完全相同的结构。`

  const user = `请将以下简历内容翻译成 ${langName}：

${JSON.stringify(content, null, 2)}

请严格按照与原 JSON 相同的结构返回翻译结果，只翻译字段值，不改变键名。`

  return { system, user }
}
