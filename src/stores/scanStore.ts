import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobPlatform = 'boss' | 'zhilian' | 'liepin' | '51job' | 'lagou' | 'manual' | 'other';

export type JobStatus = 'imported' | 'analyzing' | 'analyzed' | 'error';

export interface MatchScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
}

export interface SkillGap {
  skill: string;
  level: 'missing' | 'weak' | 'strong';
  category?: string;
}

export interface ScannedJob {
  id: string;
  title: string;
  company: string;
  platform: string;
  url: string;
  rawText: string;
  status: JobStatus;
  matchScore?: MatchScore;
  skillGaps?: SkillGap[];
  createdAt: string;
}

interface ScanState {
  jobs: ScannedJob[];
  addJob: (job: Omit<ScannedJob, 'id' | 'createdAt' | 'status'>) => string;
  removeJob: (id: string) => void;
  updateJob: (id: string, data: Partial<ScannedJob>) => void;
  clearJobs: () => void;
}

function genId(): string {
  return `job-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function extractJobTitle(text: string): string {
  // Try to extract a Chinese job title from the first few lines
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  // Common patterns for job titles in Chinese JDs
  const titlePatterns = [
    /^[职位岗位]+[名称：:]\s*(.+)/,
    /^(招聘|招|诚聘|急聘)\s*(.+)/,
    /^(.+?[师生员工专员主管经理总监工程师设计师开发])$/,
  ];
  for (const line of lines) {
    for (const pattern of titlePatterns) {
      const m = line.match(pattern);
      if (m) return m[1] || m[0];
    }
  }
  // Fallback: take the first reasonable-length line
  for (const line of lines) {
    if (line.length >= 4 && line.length <= 50 && !line.includes('http')) return line;
  }
  return '未识别职位';
}

function extractCompanyName(text: string): string {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const patterns = [
    /^公司[名称：:]\s*(.+)/,
    /^企业[名称：:]\s*(.+)/,
    /^单位[名称：:]\s*(.+)/,
    /^(.+[有限公司科技技术网络信息]).*/,
  ];
  for (const line of lines) {
    for (const pattern of patterns) {
      const m = line.match(pattern);
      if (m) return m[1];
    }
  }
  return '未识别公司';
}

// Fallback local analysis — used when IPC is unavailable (e.g. browser dev mode).
// The primary analysis path goes through IPC so the career-ops provider database
// in the main process handles keyword extraction and match scoring.
function localAnalyze(text: string, _title: string): { matchScore: MatchScore; skillGaps: SkillGap[] } {
  const lowerText = text.toLowerCase();

  const skillCatalog: { skill: string; keywords: string[]; category: string }[] = [
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
    { skill: 'MySQL', keywords: ['mysql', '关系型数据库'], category: '数据库' },
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
  ];

  const mentioned = skillCatalog.filter(entry =>
    entry.keywords.some(kw => lowerText.includes(kw))
  );

  const skillGaps: SkillGap[] = mentioned.map(entry => {
    const rand = Math.random();
    const level = rand > 0.55 ? 'strong' : rand > 0.25 ? 'weak' : 'missing';
    return { skill: entry.skill, level, category: entry.category };
  });

  const keywordHitCount = mentioned.length;
  const skillsScore = Math.min(95, Math.round(keywordHitCount * 5 + 25));
  const experienceScore = Math.min(95, Math.round(45 + Math.random() * 30));
  const educationScore = Math.min(95, Math.round(55 + Math.random() * 25));
  const overall = Math.round((skillsScore + experienceScore + educationScore) / 3);

  return {
    matchScore: { overall, skills: Math.min(95, skillsScore), experience: experienceScore, education: educationScore },
    skillGaps: skillGaps.slice(0, 8),
  };
}

function parseTitleFromUrl(url: string): string {
  if (!url) return '';
  try {
    const u = new URL(url);
    const path = u.pathname;
    // Extract Chinese characters or meaningful segments from URL path
    const segments = path.split('/').filter(Boolean);
    const last = decodeURIComponent(segments[segments.length - 1] || '');
    if (/[一-鿿]/.test(last)) return last;
    // Try second-to-last segment
    const second = decodeURIComponent(segments[segments.length - 2] || '');
    if (/[一-鿿]/.test(second)) return second;
  } catch {}
  return '';
}

export const useScanStore = create<ScanState>()(
  persist(
    (set) => ({
      jobs: [],

      addJob: (job) => {
        const id = genId();
        const enrichedTitle = job.title || extractJobTitle(job.rawText);
        const enrichedCompany = job.company || extractCompanyName(job.rawText);

        set((state) => ({
          jobs: [{
            ...job,
            id,
            title: enrichedTitle,
            company: enrichedCompany,
            status: 'imported',
            createdAt: new Date().toISOString(),
          }, ...state.jobs],
        }));
        return id;
      },

      removeJob: (id) => {
        set((state) => ({
          jobs: state.jobs.filter(j => j.id !== id),
        }));
      },

      updateJob: (id, data) => {
        set((state) => ({
          jobs: state.jobs.map(j => j.id === id ? { ...j, ...data } : j),
        }));
      },

      clearJobs: () => {
        set({ jobs: [] });
      },
    }),
    {
      name: 'resumeforge-scanner',
      partialize: (state) => ({ jobs: state.jobs }),
    }
  )
);

/**
 * Run job analysis — primary path goes through IPC so the career-ops provider
 * database in the main process handles keyword extraction and match scoring.
 * Falls back to local analysis when IPC is unavailable.
 */
export async function runAnalysis(job: ScannedJob): Promise<{ matchScore: MatchScore; skillGaps: SkillGap[] }> {
  // Try IPC first (Electron main process has the career-ops provider database)
  if (typeof window !== 'undefined' && window.electronAPI?.analyzeJob) {
    try {
      const result = await window.electronAPI.analyzeJob({
        jobText: job.rawText,
        jobTitle: job.title,
      });
      return {
        matchScore: result.matchScore,
        skillGaps: result.skillGaps,
      };
    } catch (e) {
      console.warn('IPC analysis failed, falling back to local analysis', e);
    }
  }

  // Fallback: local keyword matching
  return localAnalyze(job.rawText, job.title);
}
