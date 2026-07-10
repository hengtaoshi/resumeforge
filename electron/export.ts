import { BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'

/* ------------------------------------------------------------------ */
/*  Types                                                             */
/* ------------------------------------------------------------------ */

interface ResumeData {
  id: string
  title: string
  theme: { primary: string; font: string }
  version: string
  sections: ResumeSection[]
}

interface ResumeSection {
  id: string
  type: string
  sortOrder: number
  content: Record<string, any>
  isVisible: boolean
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function esc(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function safeHostname(url: string): string {
  try {
    const normalized = url.startsWith('http://') || url.startsWith('https://') ? url : `https://${url}`
    return new URL(normalized).hostname
  } catch {
    return url
  }
}

/* ------------------------------------------------------------------ */
/*  HTML template builder (clean ATS-friendly layout)                 */
/* ------------------------------------------------------------------ */

function buildResumeHTML(data: ResumeData): string {
  const primary = data.theme?.primary || '#14b8a6'
  const font = data.theme?.font || "'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

  const visibleSections = data.sections
    .filter((s) => s.isVisible)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  const sectionsHTML = visibleSections
    .map((section) => {
      switch (section.type) {
        case 'personal':
          return renderPersonal(section.content)
        case 'summary':
          return renderSummary(section.content)
        case 'experience':
          return renderExperience(section.content)
        case 'education':
          return renderEducation(section.content)
        case 'skills':
          return renderSkills(section.content)
        case 'projects':
          return renderProjects(section.content)
        case 'certifications':
          return renderCertifications(section.content)
        default:
          return ''
      }
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: ${font};
    color: #1e293b;
    background: #fff;
    font-size: 11pt;
    line-height: 1.5;
    padding: 48px 56px;
  }
  .resume { max-width: 700px; margin: 0 auto; }

  /* Header */
  .header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid ${primary}; }
  .header .name { font-size: 24pt; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
  .header .title { font-size: 12pt; color: ${primary}; font-weight: 500; margin-bottom: 8px; }
  .header .contact { font-size: 9pt; color: #64748b; }
  .header .contact span { margin: 0 6px; }

  /* Section */
  .section { margin-bottom: 18px; }
  .section-title {
    font-size: 12pt; font-weight: 600; color: #0f172a;
    padding-bottom: 4px; margin-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  .section:last-child { margin-bottom: 0; }

  /* Summary */
  .summary-text { font-size: 10pt; color: #334155; line-height: 1.7; white-space: pre-wrap; }

  /* Entries (experience, education, projects, certifications) */
  .entry { margin-bottom: 10px; }
  .entry-header { display: flex; justify-content: space-between; align-items: baseline; }
  .entry-left { display: flex; align-items: baseline; gap: 6px; flex-wrap: wrap; }
  .entry-name { font-size: 11pt; font-weight: 600; color: #0f172a; }
  .entry-sub { font-size: 10pt; color: ${primary}; font-weight: 500; }
  .entry-date { font-size: 9pt; color: #94a3b8; white-space: nowrap; }
  .entry-desc { font-size: 10pt; color: #475569; margin-top: 3px; line-height: 1.6; white-space: pre-wrap; }

  /* Skills */
  .skills-wrap { display: flex; flex-wrap: wrap; gap: 6px; }
  .skill-tag {
    display: inline-block; padding: 2px 10px; font-size: 9pt;
    background: #f1f5f9; color: #334155; border-radius: 3px;
  }

  /* Project link */
  .project-link { font-size: 9pt; color: ${primary}; }

  /* Misc */
  .text-muted { font-size: 10pt; color: #64748b; }

  @media print {
    body { padding: 0; }
    .section { page-break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="resume">
${sectionsHTML}
</div>
</body>
</html>`
}

/* ------------------------------------------------------------------ */
/*  Section renderers                                                 */
/* ------------------------------------------------------------------ */

function renderPersonal(c: Record<string, any>): string {
  const name = esc(c.name || '')
  const title = esc(c.title || '')
  const email = esc(c.email || '')
  const phone = esc(c.phone || '')
  const location = esc(c.location || '')

  const contactParts = [email, phone, location].filter(Boolean)
  const contactHTML = contactParts.length
    ? `<div class="contact">${contactParts.map((p) => `<span>${p}</span>`).join('')}</div>`
    : ''

  return `<div class="header">
    ${name ? `<div class="name">${name}</div>` : ''}
    ${title ? `<div class="title">${title}</div>` : ''}
    ${contactHTML}
  </div>`
}

function renderSummary(c: Record<string, any>): string {
  const text = c.text || ''
  if (!text) return ''
  return `<div class="section">
    <div class="section-title">个人简介</div>
    <div class="summary-text">${esc(text)}</div>
  </div>`
}

function renderExperience(c: Record<string, any>): string {
  const items: any[] = c.items || []
  if (!items.length) return ''
  const rows = items
    .map((item) => {
      const company = esc(item.company || '')
      const role = esc(item.role || '')
      const start = esc(item.startDate || '')
      const end = esc(item.endDate || '')
      const desc = esc(item.description || '')
      const dateStr = [start, end].filter(Boolean).join(' - ')
      return `<div class="entry">
        <div class="entry-header">
          <div class="entry-left">
            ${company ? `<span class="entry-name">${company}</span>` : ''}
            ${role ? `<span class="entry-sub">${role}</span>` : ''}
          </div>
          ${dateStr ? `<div class="entry-date">${dateStr}</div>` : ''}
        </div>
        ${desc ? `<div class="entry-desc">${desc}</div>` : ''}
      </div>`
    })
    .join('\n')
  return `<div class="section"><div class="section-title">工作经历</div>${rows}</div>`
}

function renderEducation(c: Record<string, any>): string {
  const items: any[] = c.items || []
  if (!items.length) return ''
  const rows = items
    .map((item) => {
      const school = esc(item.school || '')
      const degree = esc(item.degree || '')
      const field = esc(item.field || '')
      const start = esc(item.startDate || '')
      const end = esc(item.endDate || '')
      const dateStr = [start, end].filter(Boolean).join(' - ')
      return `<div class="entry">
        <div class="entry-header">
          <div class="entry-left">
            ${school ? `<span class="entry-name">${school}</span>` : ''}
            ${degree ? `<span class="entry-sub">${degree}</span>` : ''}
          </div>
          ${dateStr ? `<div class="entry-date">${dateStr}</div>` : ''}
        </div>
        ${field ? `<div class="entry-desc">${field}</div>` : ''}
      </div>`
    })
    .join('\n')
  return `<div class="section"><div class="section-title">教育背景</div>${rows}</div>`
}

function renderSkills(c: Record<string, any>): string {
  const tags: string[] = c.tags || []
  if (!tags.length) return ''
  const chips = tags.map((t) => `<span class="skill-tag">${esc(t)}</span>`).join('')
  return `<div class="section"><div class="section-title">专业技能</div><div class="skills-wrap">${chips}</div></div>`
}

function renderProjects(c: Record<string, any>): string {
  const items: any[] = c.items || []
  if (!items.length) return ''
  const rows = items
    .map((item) => {
      const name = esc(item.name || '')
      const url = esc(item.url || '')
      const tech = esc(item.technologies || '')
      const desc = esc(item.description || '')
      return `<div class="entry">
        <div class="entry-header">
          <div class="entry-left">
            ${name ? `<span class="entry-name">${name}</span>` : ''}
            ${url ? `<span class="project-link">${url}</span>` : ''}
          </div>
        </div>
        ${tech ? `<div class="entry-desc" style="color:#64748b;font-size:9pt;">${tech}</div>` : ''}
        ${desc ? `<div class="entry-desc">${desc}</div>` : ''}
      </div>`
    })
    .join('\n')
  return `<div class="section"><div class="section-title">项目/作品经验</div>${rows}</div>`
}

function renderCertifications(c: Record<string, any>): string {
  const items: any[] = c.items || []
  if (!items.length) return ''
  const rows = items
    .map((item) => {
      const name = esc(item.name || '')
      const issuer = esc(item.issuer || '')
      const date = esc(item.date || '')
      return `<div class="entry">
        <div class="entry-header">
          <div class="entry-left">
            ${name ? `<span class="entry-name">${name}</span>` : ''}
            ${issuer ? `<span class="text-muted">${issuer}</span>` : ''}
          </div>
          ${date ? `<div class="entry-date">${date}</div>` : ''}
        </div>
      </div>`
    })
    .join('\n')
  return `<div class="section"><div class="section-title">证书资质</div>${rows}</div>`
}

/* ------------------------------------------------------------------ */
/*  Plain-text builder                                                */
/* ------------------------------------------------------------------ */

function buildTXT(data: ResumeData): string {
  const lines: string[] = []

  const personal = data.sections.find((s) => s.type === 'personal' && s.isVisible)
  if (personal) {
    const c = personal.content
    if (c.name) lines.push(`姓名: ${c.name}`)
    if (c.title) lines.push(`职位: ${c.title}`)
    if (c.email) lines.push(`邮箱: ${c.email}`)
    if (c.phone) lines.push(`电话: ${c.phone}`)
    if (c.location) lines.push(`所在地: ${c.location}`)
    lines.push('')
  }

  const visibleSections = data.sections
    .filter((s) => s.isVisible && s.type !== 'personal')
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (const section of visibleSections) {
    switch (section.type) {
      case 'summary':
        if (section.content.text) {
          lines.push('【个人简介】')
          lines.push(section.content.text)
          lines.push('')
        }
        break
      case 'experience': {
        const items: any[] = section.content.items || []
        if (items.length) {
          lines.push('【工作经历】')
          for (const item of items) {
            const parts = [item.company, item.role].filter(Boolean)
            const dates = [item.startDate, item.endDate].filter(Boolean).join(' - ')
            if (parts.length) lines.push(parts.join(' - '))
            if (dates) lines.push(`  时间: ${dates}`)
            if (item.description) lines.push(`  描述: ${item.description}`)
          }
          lines.push('')
        }
        break
      }
      case 'education': {
        const items: any[] = section.content.items || []
        if (items.length) {
          lines.push('【教育背景】')
          for (const item of items) {
            const parts = [item.school, item.degree, item.field].filter(Boolean)
            const dates = [item.startDate, item.endDate].filter(Boolean).join(' - ')
            if (parts.length) lines.push(parts.join(' - '))
            if (dates) lines.push(`  时间: ${dates}`)
          }
          lines.push('')
        }
        break
      }
      case 'skills': {
        const tags: string[] = section.content.tags || []
        if (tags.length) {
          lines.push('【专业技能】')
          lines.push(tags.join('、'))
          lines.push('')
        }
        break
      }
      case 'projects': {
        const items: any[] = section.content.items || []
        if (items.length) {
          lines.push('【项目/作品经验】')
          for (const item of items) {
            if (item.name) lines.push(`项目: ${item.name}`)
            if (item.description) lines.push(`  描述: ${item.description}`)
            if (item.technologies) lines.push(`  技术: ${item.technologies}`)
          }
          lines.push('')
        }
        break
      }
      case 'certifications': {
        const items: any[] = section.content.items || []
        if (items.length) {
          lines.push('【证书资质】')
          for (const item of items) {
            const parts = [item.name, item.issuer].filter(Boolean)
            if (parts.length) lines.push(parts.join(' - '))
            if (item.date) lines.push(`  日期: ${item.date}`)
          }
          lines.push('')
        }
        break
      }
    }
  }

  return lines.join('\n')
}

/* ------------------------------------------------------------------ */
/*  Career-Ops HTML template (ATS-optimized layout from career-ops)   */
/* ------------------------------------------------------------------ */

function buildCareerOpsHTML(data: ResumeData): string {
  const templatePath = path.join(__dirname, '../resources/career-ops-cv-template.html')
  let template: string
  try {
    template = fs.readFileSync(templatePath, 'utf-8')
  } catch {
    // Fall back to the standard template if career-ops template is missing
    return buildResumeHTML(data)
  }

  const personal = data.sections.find((s) => s.type === 'personal' && s.isVisible)
  const summary = data.sections.find((s) => s.type === 'summary' && s.isVisible)
  const skills = data.sections.find((s) => s.type === 'skills' && s.isVisible)
  const experience = data.sections.find((s) => s.type === 'experience' && s.isVisible)
  const education = data.sections.find((s) => s.type === 'education' && s.isVisible)
  const projects = data.sections.find((s) => s.type === 'projects' && s.isVisible)
  const certifications = data.sections.find((s) => s.type === 'certifications' && s.isVisible)

  const pc = personal?.content || {}
  const name = esc(pc.name || data.title || '')

  // --- Competencies (from skills section as tags) ---
  const skillsTags: string[] = skills?.content?.tags || []
  const competenciesHTML = skillsTags
    .map((t: string) => `<span class="competency-tag">${esc(t)}</span>`)
    .join('\n          ')

  // --- Experience ---
  const expItems: any[] = experience?.content?.items || []
  const experienceHTML = expItems
    .map((item: any) => {
      const company = esc(item.company || '')
      const role = esc(item.role || '')
      const start = esc(item.startDate || '')
      const end = esc(item.endDate || '')
      const desc = esc(item.description || '')
      const dateStr = [start, end].filter(Boolean).join(' — ')
      const bullets = desc
        ? `<ul>${desc.split('\n').filter(Boolean).map((l: string) => `<li>${esc(l.trim())}</li>`).join('\n          ')}</ul>`
        : ''
      return `<div class="job">
          <div class="job-header">
            <div class="job-company">${company}${role ? ` — ${role}` : ''}</div>
            ${dateStr ? `<div class="job-period">${dateStr}</div>` : ''}
          </div>
          ${bullets}
        </div>`
    })
    .join('\n        ')

  // --- Projects ---
  const projItems: any[] = projects?.content?.items || []
  const projectsHTML = projItems
    .map((item: any) => {
      const projName = esc(item.name || '')
      const projDesc = esc(item.description || '')
      const tech = esc(item.technologies || '')
      return `<div class="project">
          <div class="project-title">${projName}</div>
          <div class="project-desc">${projDesc}</div>
          ${tech ? `<div class="project-tech">${tech}</div>` : ''}
        </div>`
    })
    .join('\n        ')

  // --- Education ---
  const eduItems: any[] = education?.content?.items || []
  const educationHTML = eduItems
    .map((item: any) => {
      const school = esc(item.school || '')
      const degree = esc(item.degree || '')
      const field = esc(item.field || '')
      const start = esc(item.startDate || '')
      const end = esc(item.endDate || '')
      const dateStr = [start, end].filter(Boolean).join(' — ')
      return `<div class="edu-item">
          <div class="edu-header">
            <div class="edu-title">${degree}${field ? `, ${field}` : ''}${school ? ` — <span class="edu-org">${school}</span>` : ''}</div>
            ${dateStr ? `<div class="edu-year">${dateStr}</div>` : ''}
          </div>
        </div>`
    })
    .join('\n        ')

  // --- Certifications ---
  const certItems: any[] = certifications?.content?.items || []
  const certificationsHTML = certItems
    .map((item: any) => {
      const certName = esc(item.name || '')
      const issuer = esc(item.issuer || '')
      const date = esc(item.date || '')
      return `<div class="cert-item">
          <div class="cert-title">${certName}</div>
          ${issuer ? `<div class="cert-org">${issuer}</div>` : ''}
          ${date ? `<div class="cert-year">${date}</div>` : ''}
        </div>`
    })
    .join('\n        ')

  // --- Skills (grid format) ---
  const skillsHTML = skillsTags
    .map((t: string) => `<span class="skill-item">${esc(t)}</span>`)
    .join('\n          ')

  // --- Contact info ---
  const phone = esc(pc.phone || '')
  const email = esc(pc.email || '')
  const location = esc(pc.location || '')
  const linkedinUrl = esc(pc.linkedin || '')
  const linkedinDisplay = pc.linkedin ? safeHostname(pc.linkedin) : ''
  const portfolioUrl = esc(pc.website || '')
  const portfolioDisplay = pc.website ? safeHostname(pc.website) : ''

  // Replace all placeholders
  template = template
    .replace(/\{\{LANG\}\}/g, 'zh-CN')
    .replace(/\{\{NAME\}\}/g, name)
    .replace(/\{\{PAGE_WIDTH\}\}/g, '700px')
    .replace(/\{\{PHOTO\}\}/g, '')
    .replace(/\{\{PHONE\}\}/g, phone)
    .replace(/\{\{EMAIL\}\}/g, email)
    .replace(/\{\{LINKEDIN_URL\}\}/g, linkedinUrl)
    .replace(/\{\{LINKEDIN_DISPLAY\}\}/g, linkedinDisplay)
    .replace(/\{\{PORTFOLIO_URL\}\}/g, portfolioUrl)
    .replace(/\{\{PORTFOLIO_DISPLAY\}\}/g, portfolioDisplay)
    .replace(/\{\{LOCATION\}\}/g, location)
    .replace(/\{\{SECTION_SUMMARY\}\}/g, summary?.content?.text ? 'Professional Summary' : '')
    .replace(/\{\{SUMMARY_TEXT\}\}/g, esc(summary?.content?.text || ''))
    .replace(/\{\{SECTION_COMPETENCIES\}\}/g, 'Core Competencies')
    .replace(/\{\{COMPETENCIES\}\}/g, competenciesHTML)
    .replace(/\{\{SECTION_EXPERIENCE\}\}/g, 'Experience')
    .replace(/\{\{EXPERIENCE\}\}/g, experienceHTML)
    .replace(/\{\{SECTION_PROJECTS\}\}/g, projItems.length ? 'Projects' : '')
    .replace(/\{\{PROJECTS\}\}/g, projectsHTML)
    .replace(/\{\{SECTION_EDUCATION\}\}/g, 'Education')
    .replace(/\{\{EDUCATION\}\}/g, educationHTML)
    .replace(/\{\{SECTION_CERTIFICATIONS\}\}/g, certItems.length ? 'Certifications' : '')
    .replace(/\{\{CERTIFICATIONS\}\}/g, certificationsHTML)
    .replace(/\{\{SECTION_SKILLS\}\}/g, 'Skills')
    .replace(/\{\{SKILLS\}\}/g, skillsHTML)

  return template
}

/* ------------------------------------------------------------------ */
/*  IPC handler registration                                          */
/* ------------------------------------------------------------------ */

function doExport(data: ResumeData): { html: string; txt: string } {
  return { html: buildResumeHTML(data), txt: buildTXT(data) }
}

ipcMain.handle('export:pdf', async (_event, data: ResumeData) => {
  try {
    const { html } = doExport(data)
    const win = new BrowserWindow({
      show: false,
      width: 800,
      height: 1100,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    })

    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

    const pdfBuffer = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
    })

    win.close()

    const result = await dialog.showSaveDialog({
      title: '导出 PDF',
      defaultPath: `${data.title || 'resume'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, pdfBuffer)
      return { success: true, filePath: result.filePath }
    }
    return { success: false, canceled: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('export:docx', async (_event, data: ResumeData) => {
  try {
    const { html } = doExport(data)
    const result = await dialog.showSaveDialog({
      title: '导出 DOCX',
      defaultPath: `${data.title || 'resume'}.docx`,
      filters: [{ name: 'Word Document', extensions: ['docx'] }],
    })

    if (!result.canceled && result.filePath) {
      // Word can open HTML files saved with .docx extension
      fs.writeFileSync(result.filePath, html, 'utf-8')
      return { success: true, filePath: result.filePath }
    }
    return { success: false, canceled: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('export:txt', async (_event, data: ResumeData) => {
  try {
    const { txt } = doExport(data)
    const result = await dialog.showSaveDialog({
      title: '导出 TXT',
      defaultPath: `${data.title || 'resume'}.txt`,
      filters: [{ name: 'Text File', extensions: ['txt'] }],
    })

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, txt, 'utf-8')
      return { success: true, filePath: result.filePath }
    }
    return { success: false, canceled: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})

ipcMain.handle('export:html', async (_event, data: ResumeData) => {
  try {
    const { html } = doExport(data)
    const result = await dialog.showSaveDialog({
      title: '导出 HTML',
      defaultPath: `${data.title || 'resume'}.html`,
      filters: [{ name: 'HTML', extensions: ['html'] }],
    })

    if (!result.canceled && result.filePath) {
      fs.writeFileSync(result.filePath, html, 'utf-8')
      return { success: true, filePath: result.filePath }
    }
    return { success: false, canceled: true }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
})
