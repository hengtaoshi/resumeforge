/**
 * Styled export — renders resume using JadeAI templates to complete HTML pages.
 *
 * ponytail: uses Tailwind CDN for template class resolution. Embed a static build
 * of Tailwind if offline-only export becomes a requirement.
 */

import { createRoot } from 'react-dom/client'
import React from 'react'
import { getTemplate } from '@/lib/jadeai/templates'
import type { Resume as AppResume, ResumeSection as AppSection } from '@/types/resume'
import type {
  Resume as JadeResume,
  ResumeSection as JadeSection,
  PersonalInfoContent,
  WorkExperienceItem,
  EducationItem,
  SkillCategory,
  ProjectItem,
  CertificationItem,
} from '@/lib/jadeai/templates/resume-types'

// ─── Converter: App Resume → JadeAI Resume ──────────────────────────────────

function toJadeaiSectionType(t: string): string {
  const map: Record<string, string> = {
    personal: 'personal_info',
    summary: 'summary',
    experience: 'work_experience',
    education: 'education',
    skills: 'skills',
    projects: 'projects',
    certifications: 'certifications',
  }
  return map[t] || t
}

function convertPersonalContent(c: Record<string, any>): PersonalInfoContent {
  return {
    fullName: c.name || '',
    jobTitle: c.title || '',
    email: c.email || '',
    phone: c.phone || '',
    location: c.location || '',
    avatar: c.avatar || '',
  }
}

function convertExperienceItems(items: any[]): WorkExperienceItem[] {
  return (items || []).map((item: any) => ({
    id: item.id || '',
    company: item.company || '',
    position: item.role || '',
    startDate: item.startDate || '',
    endDate: item.endDate || null,
    current: !item.endDate,
    description: item.description || '',
    technologies: [],
    highlights: [],
    location: undefined,
  }))
}

function convertEducationItems(items: any[]): EducationItem[] {
  return (items || []).map((item: any) => ({
    id: item.id || '',
    institution: item.school || '',
    degree: item.degree || '',
    field: item.major || '',
    startDate: item.startDate || '',
    endDate: item.endDate || '',
    highlights: [],
    location: undefined,
    gpa: undefined,
  }))
}

function convertSkillsContent(c: Record<string, any>): { categories: SkillCategory[] } {
  const skills: string[] = c.skills || []
  if (!skills.length) return { categories: [] }
  return {
    categories: [{ id: 'main', name: '专业技能', skills }],
  }
}

function convertProjectItems(items: any[]): ProjectItem[] {
  return (items || []).map((item: any) => ({
    id: item.id || '',
    name: item.name || '',
    description: item.description || '',
    technologies: item.tech ? [item.tech] : [],
    highlights: [],
    url: item.link || undefined,
    startDate: item.startDate || undefined,
    endDate: item.endDate || undefined,
  }))
}

function convertCertItems(items: any[]): CertificationItem[] {
  return (items || []).map((item: any) => ({
    id: item.id || '',
    name: item.name || '',
    issuer: item.issuer || '',
    date: item.date || '',
    url: undefined,
  }))
}

function convertSectionContent(section: AppSection): any {
  const c = section.content
  switch (section.type) {
    case 'personal':
      return convertPersonalContent(c)
    case 'summary':
      return { text: c.summary || c.text || '' }
    case 'experience':
      return { items: convertExperienceItems(c.items) }
    case 'education':
      return { items: convertEducationItems(c.items) }
    case 'skills':
      return convertSkillsContent(c)
    case 'projects':
      return { items: convertProjectItems(c.items) }
    case 'certifications':
      return { items: convertCertItems(c.items) }
    default:
      return c
  }
}

function convertSection(s: AppSection): JadeSection {
  return {
    id: s.id,
    type: toJadeaiSectionType(s.type),
    title: '',
    sortOrder: s.sortOrder,
    visible: s.isVisible,
    content: convertSectionContent(s),
  }
}

export function convertResume(r: AppResume): JadeResume {
  return {
    id: r.id,
    title: r.title,
    template: r.template || 'classic',
    sections: r.sections.map(convertSection),
    language: r.language || 'zh-CN',
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
  }
}

// ─── HTML rendering ──────────────────────────────────────────────────────────

const TAILWIND_CDN = '<script src="https://cdn.tailwindcss.com"></script>'

const PAGE_CSS = `
@page { margin: 0; size: A4; }
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .no-print { display: none !important; }
}
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
  background: #e5e7eb;
}
`

export function renderStyledHTML(resume: AppResume, templateId: string = 'classic'): string {
  const jadeResume = convertResume(resume)
  const tpl = getTemplate(templateId)
  if (!tpl) return renderFallbackHTML(resume)

  let content: string
  try {
    const el = document.createElement('div')
    el.style.display = 'none'
    document.body.appendChild(el)
    const root = createRoot(el)
    root.render(React.createElement(tpl.component, { resume: jadeResume }))
    // 同步提取 HTML（createRoot.render 在当前微任务中同步提交 DOM）
    content = el.innerHTML
    root.unmount()
    document.body.removeChild(el)
  } catch (err) {
    console.error('styled-export: template render failed, using fallback', err)
    return renderFallbackHTML(resume)
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(resume.title || 'Resume')}</title>
<style>${PAGE_CSS}</style>
${TAILWIND_CDN}
</head>
<body>
<div class="flex justify-center py-8 no-print">
  <div class="shadow-xl" style="width:210mm;min-height:297mm;background:#fff;overflow:hidden">
    ${content}
  </div>
</div>
</body>
</html>`
}

// ─── Fallback: inline-styled HTML (no Tailwind dependency) ───────────────────
// ponytail: basic A4 layout matching the old export.ts style.
// Replace with Tailwind-inlined version if every template render fails.

function renderFallbackHTML(resume: AppResume): string {
  const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const sections = [...resume.sections].filter(s => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder)
  const personal = sections.find(s => s.type === 'personal')?.content || {}

  const renderSection = (s: AppSection) => {
    const c = s.content
    switch (s.type) {
      case 'personal':
        return (() => {
          const rows: [string, any][] = [['姓名', c.name], ['求职意向', c.title], ['邮箱', c.email], ['电话', c.phone], ['地址', c.location]]
          const filled = rows.filter(([, v]) => v)
          if (!filled.length) return ''
          return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">${filled.map(([k, v]) => `<div><div style="font-size:9pt;color:#64748b">${k}</div><div style="font-size:10pt">${esc(v)}</div></div>`).join('')}</div>`
        })()
      case 'summary':
        return c.summary ? `<p style="font-size:10pt;color:#334155;line-height:1.8;white-space:pre-wrap">${esc(c.summary)}</p>` : ''
      case 'experience':
        return (c.items || []).map((item: any) => {
          const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ')
          return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;font-weight:600">${esc(item.company)}${item.role ? ` — ${esc(item.role)}` : ''}${dates ? `<span style="font-weight:400;font-size:9pt;color:#94a3b8">${esc(dates)}</span>` : ''}</div>${item.description ? `<div style="font-size:10pt;color:#475569;margin-top:4px;white-space:pre-wrap">${esc(item.description)}</div>` : ''}</div>`
        }).join('')
      case 'education':
        return (c.items || []).map((item: any) => {
          const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ')
          return `<div style="margin-bottom:6px"><div style="display:flex;justify-content:space-between;font-weight:600">${esc(item.school)}${item.degree ? ` — ${esc(item.degree)}` : ''}${dates ? `<span style="font-weight:400;font-size:9pt;color:#94a3b8">${esc(dates)}</span>` : ''}</div>${item.major ? `<div style="font-size:10pt;color:#475569">${esc(item.major)}</div>` : ''}</div>`
        }).join('')
      case 'skills':
        return `<div style="display:flex;flex-wrap:wrap;gap:6px">${(c.skills || []).map((t: string) => `<span style="display:inline-block;padding:3px 10px;font-size:9pt;background:#f1f5f9;color:#334155;border-radius:4px">${esc(t)}</span>`).join('')}</div>`
      case 'projects':
        return (c.items || []).map((item: any) => `<div style="margin-bottom:8px"><div style="font-weight:600">${esc(item.name)}${item.role ? ` — ${esc(item.role)}` : ''}</div>${item.tech ? `<div style="font-size:9pt;color:#64748b">${esc(item.tech)}</div>` : ''}${item.description ? `<div style="font-size:10pt;color:#475569;margin-top:2px">${esc(item.description)}</div>` : ''}</div>`).join('')
      case 'certifications':
        return (c.items || []).map((item: any) => `<div style="margin-bottom:4px"><span style="font-weight:600">${esc(item.name)}</span>${item.issuer ? `<span style="color:#64748b"> — ${esc(item.issuer)}</span>` : ''}${item.date ? `<span style="font-size:9pt;color:#94a3b8"> (${esc(item.date)})</span>` : ''}</div>`).join('')
      default:
        return ''
    }
  }

  const labelMap: Record<string, string> = {
    personal: '个人信息', summary: '个人简介', experience: '工作经历',
    education: '教育背景', skills: '专业技能', projects: '项目经历', certifications: '证书',
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${esc(resume.title || 'Resume')}</title>
<style>
@page { margin: 0; size: A4; }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;background:#e5e7eb;padding:40px}
.page{max-width:700px;margin:0 auto;background:#fff;padding:40px;box-shadow:0 4px 24px rgba(0,0,0,0.1)}
.section{margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #e2e8f0}
.section:last-child{border-bottom:none}
h3{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase}
@media print{body{padding:0}.page{box-shadow:none}}
</style></head>
<body><div class="page">
<h1 style="font-size:22px;color:#0f172a;margin-bottom:4px">${esc(personal.name || '')}</h1>
<h2 style="font-size:14px;color:#64748b;font-weight:400;margin-bottom:20px">${esc(personal.title || '')}</h2>
${sections.map(s => {
  const html = renderSection(s)
  if (!html) return ''
  return `<div class="section"><h3>${labelMap[s.type] || s.type}</h3>${html}</div>`
}).join('')}
</div></body></html>`
}

function escapeHtml(s: unknown): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
