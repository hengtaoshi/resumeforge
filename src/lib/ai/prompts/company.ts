// ---------------------------------------------------------------------------
// Company research prompt — investigates a target company's background,
// products, funding, culture, recent news, and interview tips.
// ---------------------------------------------------------------------------

export interface CompanyResearchResult {
  name: string;
  industry: string;
  size: string;
  funding: string;
  culture: string;
  recentNews: string[];
  interviewTips: string[];
  keyContacts: string[];
}

export function buildCompanyResearchPrompt(
  companyName: string,
): { system: string; user: string } {
  const system = `你是一位专业的求职策略顾问，擅长对目标公司进行深度调研。请基于公开可查的信息，对用户指定的公司进行全面分析。

请以 **纯 JSON 格式** 返回调研结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "name": "公司名称",
  "industry": "所属行业",
  "size": "公司规模（员工数、层级概况）",
  "funding": "融资历程与估值情况",
  "culture": "企业文化、价值观与工作氛围",
  "recentNews": ["近期重大新闻1", "近期重大新闻2", "近期重大新闻3"],
  "interviewTips": ["面试准备建议1", "面试准备建议2", "面试准备建议3"],
  "keyContacts": ["值得关注的业务负责人或招聘联系人"]
}

要求:
- 信息基于公开资料，不得编造
- 如果某些信息无法确认，注明"公开信息有限"
- 中文回答`;

  const user = `请对以下公司进行深度调研，提供公司背景、产品业务、融资情况、文化氛围、最新动态以及面试准备建议。

公司名称: ${companyName}

请严格按照 JSON 格式返回调研结果。`;

  return { system, user };
}

// ---------------------------------------------------------------------------
// Salary analysis prompt — provides a salary range estimate based on
// role, city, experience level and industry.
// ---------------------------------------------------------------------------

export interface SalaryAnalysisResult {
  role: string;
  city: string;
  experience: string;
  p10: number;
  p25: number;
  p50: number;
  p75: number;
  p90: number;
  currency: string;
  tips: string[];
}

export function buildSalaryAnalysisPrompt(
  role: string,
  city: string,
  experience: string,
  industry: string,
): { system: string; user: string } {
  const system = `你是一位资深的薪酬数据分析专家，熟悉各行业、各地区、各职级的薪酬水平。请根据用户提供的岗位、城市、经验年限和行业信息，给出合理的薪酬区间分析。

请以 **纯 JSON 格式** 返回分析结果，不要包含 markdown 包裹或其他说明文字。

返回格式:
{
  "role": "岗位名称",
  "city": "城市",
  "experience": "经验年限",
  "p10": 年薪10分位值,
  "p25": 年薪25分位值,
  "p50": 年薪中位值,
  "p75": 年薪75分位值,
  "p90": 年薪90分位值,
  "currency": "货币单位（如 CNY）",
  "tips": ["薪酬谈判建议1", "薪酬谈判建议2", "薪酬谈判建议3"]
}

要求:
- 基于公开薪酬数据和行业报告，标注数据来源参考
- 区分不同行业和城市级别的差异
- 中文回答`;

  const user = `请提供以下职位的薪酬区间分析：

岗位: ${role}
城市: ${city}
经验年限: ${experience}
行业: ${industry}

请严格按照 JSON 格式返回薪酬分析结果。`;

  return { system, user };
}
