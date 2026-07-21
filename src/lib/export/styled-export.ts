/**
 * Styled export — renders resume using JadeAI templates to complete HTML pages.
 *
 * ponytail: uses Tailwind CDN for template class resolution. Embed a static build
 * of Tailwind if offline-only export becomes a requirement.
 */

import { createRoot } from 'react-dom/client'
import { flushSync } from 'react-dom'
import React from 'react'
import { getTemplate } from '@/lib/jadeai/templates'
import { TAILWIND_CSS } from './tailwind-css'
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

const SECTION_TITLE: Record<string, string> = {
  personal: '个人信息', summary: '个人简介', experience: '工作经历',
  education: '教育背景', skills: '专业技能', projects: '项目经历', certifications: '证书',
}

function convertPersonalContent(c: Record<string, any>): PersonalInfoContent {
  return {
    fullName: c.name || '',
    jobTitle: c.title || '',
    email: c.email || '',
    phone: c.phone || '',
    location: c.location || '',
    avatar: '',
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
    title: SECTION_TITLE[s.type] || '',
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

const TAILWIND_INLINE = `<style>${TAILWIND_CSS}</style>`

const PRINT_CSS = `<style>
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  [data-section] { margin-bottom: 3px !important; }
  .space-y-2 > :not([hidden]) ~ :not([hidden]) { margin-top: 2px !important; }
  .space-y-1 > :not([hidden]) ~ :not([hidden]) { margin-top: 1px !important; }
  p { margin: 0 !important; }
}
</style>`

const PAGE_CSS = `
@page { margin: 0; size: A4; }
* { box-sizing: border-box; }
body {
  margin: 0; padding: 0;
  font-family: 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', system-ui, sans-serif;
}
`

function avatarOverlayHTML(avatarUrl: string): string {
  return avatarUrl
    ? `<div style="position:absolute;top:24px;right:24px;z-index:10;width:96px;height:120px;border:1px solid #e5e7eb;box-shadow:0 1px 2px rgba(0,0,0,0.05);overflow:hidden;border-radius:2px"><img src="${escapeHtml(avatarUrl)}" alt="" style="width:100%;height:100%;object-fit:cover" /></div>`
    : ''
}

export function renderStyledHTML(resume: AppResume, templateId: string = 'classic'): string {
  const avatarUrl = resume.sections.find(s => s.type === 'personal')?.content?.avatar || ''
  const jadeResume = convertResume(resume)
  const tpl = getTemplate(templateId)
  if (!tpl) return renderFallbackHTML(resume, avatarUrl)

  let content: string
  try {
    const el = document.createElement('div')
    el.style.display = 'none'
    document.body.appendChild(el)
    const root = createRoot(el)
    flushSync(() => {
      root.render(React.createElement(tpl.component, { resume: jadeResume }))
    })
    content = el.innerHTML
    root.unmount()
    document.body.removeChild(el)
  } catch (err) {
    console.error('styled-export: template render failed, using fallback', err)
    return renderFallbackHTML(resume, avatarUrl)
  }

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${escapeHtml(resume.title || 'Resume')}</title>
<style>${PAGE_CSS}</style>
${TAILWIND_INLINE}
  ${PRINT_CSS}
</head>
<body>
<div style="position:relative;width:210mm;margin:0 auto;min-height:297mm;display:flex;flex-direction:column">
<div style="padding:12px;flex:1;display:flex;flex-direction:column">
${content}
</div>
${avatarOverlayHTML(avatarUrl)}
</div>
</body>
</html>`
}

// ─── Fallback: inline-styled HTML (no Tailwind dependency) ───────────────────
// ponytail: basic A4 layout matching the old export.ts style.
// Replace with Tailwind-inlined version if every template render fails.

function renderFallbackHTML(resume: AppResume, avatarUrl: string = ''): string {
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
.section{margin-bottom:8px;padding-bottom:6px;border-bottom:1px solid #e2e8f0}
.section:last-child{border-bottom:none}
h3{font-size:14px;font-weight:700;color:#1e293b;margin-bottom:12px;letter-spacing:0.5px;text-transform:uppercase}
@media print{body{padding:0}.page{box-shadow:none}}
</style></head>
<body><div class="page" style="position:relative;min-height:297mm">
<h1 style="font-size:22px;color:#0f172a;margin-bottom:4px">${esc(personal.name || '')}</h1>
<h2 style="font-size:14px;color:#64748b;font-weight:400;margin-bottom:20px">${esc(personal.title || '')}</h2>
${sections.map(s => {
  const html = renderSection(s)
  if (!html) return ''
  return `<div class="section"><h3>${labelMap[s.type] || s.type}</h3>${html}</div>`
}).join('')}
${avatarOverlayHTML(avatarUrl)}
</div></body></html>`
}

function escapeHtml(s: unknown): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
