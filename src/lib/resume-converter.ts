import type { Resume as EditorResume } from '@/types/resume'
import type {
  Resume as TemplateResume,
  ResumeSection as TemplateSection,
  PersonalInfoContent,
  SummaryContent,
  WorkExperienceContent,
  EducationContent,
  SkillsContent,
  ProjectsContent,
  CertificationsContent,
} from '@/lib/jadeai/templates/resume-types'

const SECTION_TYPE_MAP: Record<string, string> = {
  personal: 'personal_info',
  summary: 'summary',
  experience: 'work_experience',
  education: 'education',
  skills: 'skills',
  projects: 'projects',
  certifications: 'certifications',
}

const SECTION_TITLE_MAP: Record<string, string> = {
  personal: '个人信息',
  summary: '个人简介',
  experience: '工作经历',
  education: '教育背景',
  skills: '专业技能',
  projects: '项目/作品经验',
  certifications: '证书资质',
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function mapPersonalContent(content: Record<string, any>): PersonalInfoContent {
  return {
    fullName: content.name || '',
    jobTitle: content.title || '',
    email: content.email || '',
    phone: content.phone || '',
    location: content.location || '',
    avatar: '',
    website: content.website || '',
    linkedin: content.linkedin || '',
    github: content.github || '',
  }
}

function mapSummaryContent(content: Record<string, any>): SummaryContent {
  return { text: content.summary || '' }
}

function mapExperienceContent(content: Record<string, any>): WorkExperienceContent {
  const items = (content.items || []).map((item: any) => ({
    id: item.id || genId(),
    company: item.company || '',
    position: item.role || '',
    location: item.location || '',
    startDate: item.startDate || '',
    endDate: item.endDate || null,
    current: item.current ?? (!item.endDate && !!item.startDate),
    description: item.description || '',
    technologies: item.technologies || [],
    highlights: item.highlights || [],
  }))
  return { items }
}

function mapEducationContent(content: Record<string, any>): EducationContent {
  const items = (content.items || []).map((item: any) => ({
    id: item.id || genId(),
    institution: item.school || '',
    degree: item.degree || '',
    field: item.major || '',
    location: item.location || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    gpa: item.gpa || '',
    highlights: item.highlights || [],
  }))
  return { items }
}

function mapSkillsContent(content: Record<string, any>): SkillsContent {
  const skills = content.skills || []
  return {
    categories: skills.length > 0
      ? [{ id: genId(), name: '专业技能', skills }]
      : content.categories || [],
  }
}

function mapProjectsContent(content: Record<string, any>): ProjectsContent {
  const items = (content.items || []).map((item: any) => ({
    id: item.id || genId(),
    name: item.name || '',
    url: item.link || item.url || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    description: item.description || '',
    technologies: item.tech ? [item.tech] : (item.technologies || []),
    highlights: item.highlights || [],
  }))
  return { items }
}

function mapCertificationsContent(content: Record<string, any>): CertificationsContent {
  const items = (content.items || []).map((item: any) => ({
    id: item.id || genId(),
    name: item.name || '',
    issuer: item.issuer || '',
    date: item.date || '',
    url: item.url || '',
  }))
  return { items }
}

const CONTENT_MAPPERS: Record<string, (content: Record<string, any>) => any> = {
  personal: mapPersonalContent,
  summary: mapSummaryContent,
  experience: mapExperienceContent,
  education: mapEducationContent,
  skills: mapSkillsContent,
  projects: mapProjectsContent,
  certifications: mapCertificationsContent,
}

export function convertResumeForTemplate(editorResume: EditorResume): TemplateResume {
  const sections: TemplateSection[] = editorResume.sections
    .filter((s) => s.isVisible)
    .map((s) => {
      const templateType = SECTION_TYPE_MAP[s.type] || s.type
      const mapper = CONTENT_MAPPERS[s.type]
      return {
        id: s.id,
        type: templateType,
        title: SECTION_TITLE_MAP[s.type] || '',
        sortOrder: s.sortOrder,
        visible: true,
        content: mapper ? mapper(s.content) : (s.content as any),
      }
    })
    .sort((a, b) => a.sortOrder - b.sortOrder)

  return {
    id: editorResume.id,
    title: editorResume.title,
    template: editorResume.template || 'classic',
    sections,
    language: editorResume.language || 'zh',
  }
}
