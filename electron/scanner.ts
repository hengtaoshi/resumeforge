/**
 * Electron IPC handlers for ATS scanner providers.
 */

import { ipcMain } from 'electron'

interface JobSearchResult {
  title: string
  company: string
  platform: string
  url: string
  matchScore: number
}

interface MatchScore {
  overall: number
  skills: number
  experience: number
  education: number
}

interface SkillGap {
  skill: string
  level: 'missing' | 'weak' | 'strong'
  category?: string
}

interface AnalyzeResult {
  matchScore: MatchScore
  skillGaps: SkillGap[]
}

function getProviders(): string[] {
  return ['zhaopin', 'liepin', '51job', 'lagou', 'maimai', 'linkedin', 'indeed']
}

interface SkillEntry { skill: string; keywords: string[]; category: string }

const SKILL_CATALOG: SkillEntry[] = [
  { skill: 'React', keywords: ['react', 'react.js', 'reactjs'], category: '前端框架' },
  { skill: 'Vue.js', keywords: ['vue', 'vue.js', 'vuejs', 'vue3'], category: '前端框架' },
  { skill: 'Angular', keywords: ['angular', 'angularjs'], category: '前端框架' },
  { skill: 'TypeScript', keywords: ['typescript', 'ts'], category: '编程语言' },
  { skill: 'JavaScript', keywords: ['javascript', 'js', 'es6', 'es2015'], category: '编程语言' },
  { skill: 'Node.js', keywords: ['node', 'node.js', 'nodejs'], category: '后端技术' },
  { skill: 'Python', keywords: ['python'], category: '编程语言' },
  { skill: 'Java', keywords: ['java'], category: '编程语言' },
  { skill: 'Go', keywords: ['go', 'golang'], category: '编程语言' },
  { skill: 'Docker', keywords: ['docker'], category: '运维部署' },
  { skill: 'Kubernetes', keywords: ['kubernetes', 'k8s'], category: '运维部署' },
  { skill: 'AWS', keywords: ['aws', 'ec2', 's3', 'lambda'], category: '云服务' },
  { skill: 'MySQL', keywords: ['mysql'], category: '数据库' },
  { skill: 'PostgreSQL', keywords: ['postgresql', 'postgres'], category: '数据库' },
  { skill: 'MongoDB', keywords: ['mongodb', 'mongo'], category: '数据库' },
  { skill: 'Redis', keywords: ['redis'], category: '数据库' },
  { skill: 'Git', keywords: ['git', 'github', 'gitlab'], category: '工具' },
  { skill: 'CI/CD', keywords: ['ci/cd', 'ci', 'cd', 'jenkins', 'github actions'], category: '运维部署' },
  { skill: 'REST API', keywords: ['rest', 'restful', 'rest api', 'api'], category: '后端技术' },
  { skill: 'GraphQL', keywords: ['graphql', 'gql'], category: '后端技术' },
  { skill: '微服务', keywords: ['微服务', 'microservice'], category: '架构' },
  { skill: 'Linux', keywords: ['linux', 'unix'], category: '工具' },
  { skill: 'CSS/SCSS', keywords: ['css', 'scss', 'sass', 'less'], category: '前端技术' },
  { skill: 'Webpack', keywords: ['webpack', 'vite', 'rollup', '打包'], category: '前端工具' },
  { skill: '敏捷开发', keywords: ['敏捷', 'scrum', 'sprint'], category: '方法论' },
]

function analyzeJobText(jobText: string): AnalyzeResult {
  const lowerText = jobText.toLowerCase()
  const matched = SKILL_CATALOG.map(entry => ({
    entry,
    matchCount: entry.keywords.filter(kw => lowerText.includes(kw)).length,
  }))
  const mentioned = matched.filter(m => m.matchCount > 0)
  const keywordHitCount = mentioned.reduce((sum, m) => sum + m.matchCount, 0)
  const skillGaps: SkillGap[] = mentioned.map(m => ({
    skill: m.entry.skill,
    level: m.matchCount >= 2 ? 'strong' : m.matchCount === 1 ? 'weak' : 'missing',
    category: m.entry.category,
  }))
  const textLen = jobText.length
  const textScore = Math.min(30, Math.round((textLen / 2000) * 30))
  const skillsScore = Math.min(95, Math.round((keywordHitCount / Math.max(1, mentioned.length)) * 30 + 25))
  const expScore = Math.min(95, Math.round(textScore + 35))
  const eduScore = Math.min(95, Math.round(textScore + 45))
  const overall = Math.round((skillsScore + expScore + eduScore) / 3)
  return {
    matchScore: {
      overall: Math.min(100, overall),
      skills: Math.min(100, skillsScore),
      experience: Math.min(100, expScore),
      education: Math.min(100, eduScore),
    },
    skillGaps: skillGaps.slice(0, 8),
  }
}

export function registerScannerHandlers(): void {
  ipcMain.handle('scan:providers', async (): Promise<string[]> => getProviders())

  ipcMain.handle('scan:search', async (_event, { provider, keyword }: { provider: string; keyword: string }): Promise<JobSearchResult[]> => {
    return [{ title: `${keyword}相关职位`, company: '示例公司', platform: provider, url: '', matchScore: 75 }]
  })

  ipcMain.handle('scan:analyze', async (_event, { jobText }: { jobText: string; jobTitle: string }): Promise<AnalyzeResult> => {
    return analyzeJobText(jobText)
  })
}
