import { BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import path from 'path'
import os from 'os'

interface ResumeData {
  id: string; title: string
  theme: { primary: string; font: string }
  version: string; sections: ResumeSection[]
}
interface ResumeSection {
  id: string; type: string; sortOrder: number
  content: Record<string, any>; isVisible: boolean
}

function esc(s: string): string {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const SECTION_COLORS: Record<string, { bg: string; border: string }> = {
  personal: { bg: '#eff6ff', border: '#bfdbfe' },
  summary: { bg: '#f0fdf4', border: '#bbf7d0' },
  experience: { bg: '#faf5ff', border: '#e9d5ff' },
  education: { bg: '#fefce8', border: '#fde68a' },
  skills: { bg: '#fdf2f8', border: '#fbcfe8' },
  projects: { bg: '#eef2ff', border: '#c7d2fe' },
  certifications: { bg: '#fff7ed', border: '#fed7aa' },
}

const LABELS: Record<string, string> = {
  personal: '个人信息', summary: '个人简介', experience: '工作经历',
  education: '教育背景', skills: '专业技能', projects: '项目/作品经验', certifications: '证书资质',
}

function buildResumeHTML(data: ResumeData): string {
  const personalSection = data.sections.find(s => s.type === 'personal' && s.isVisible)
  const photoHtml = personalSection?.content?.avatar
    ? `<div style="position:absolute;top:0;right:20px;z-index:10"><img src="${esc(personalSection.content.avatar)}" style="width:96px;height:120px;object-fit:cover;border:1px solid #e2e8f0;box-shadow:0 1px 3px rgba(0,0,0,0.1)"/></div>`
    : ''

  const sectionsHTML = data.sections.filter(s => s.isVisible).sort((a, b) => a.sortOrder - b.sortOrder).map(section => {
    const c = SECTION_COLORS[section.type] || { bg: '#f8fafc', border: '#e2e8f0' }
    const label = LABELS[section.type] || section.type
    let content = renderContent(section)
    if (!content) return ''

    return `<div style="margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid #e2e8f0">
      <div style="${section.type === 'personal' ? 'padding-top:40px;' : ''}margin-bottom:${section.type === 'personal' ? '58px' : '12px'}">
        <h4 style="margin:0;font-size:16px;font-weight:700;color:#1e293b;letter-spacing:0.5px">${label}</h4>
      </div>
      ${content}
    </div>`
  }).filter(Boolean).join('\n')

  return `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Noto Sans SC','PingFang SC','Microsoft YaHei',sans-serif;color:#1e293b;background:#fff;font-size:11pt;line-height:1.6;padding:24px}.resume{max-width:700px;margin:0 auto}@media print{body{padding:0}}</style></head>
<body><div class="resume">${photoHtml}${sectionsHTML}</div></body></html>`
}

function renderContent(section: ResumeSection): string {
  const c = section.content
  switch (section.type) {
    case 'personal': {
      const fields = [
        ['姓名', c.name], ['求职意向', c.title], ['邮箱', c.email],
        ['电话', c.phone], ['地址', c.location],
      ].filter(([, v]) => v)
      if (!fields.length) return ''
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">${fields.map(([k, v]) =>
        `<div${k === '地址' ? ' style="grid-column:1/-1"' : ''}><div style="font-size:8pt;color:#94a3b8;margin-bottom:2px">${k}</div><div style="font-size:10pt;color:#1e293b">${esc(v as string)}</div></div>`
      ).join('')}</div>`
    }
    case 'summary':
      return c.text ? `<p style="font-size:10pt;color:#475569;line-height:1.7;white-space:pre-wrap">${esc(c.text)}</p>` : ''
    case 'experience':
      return (c.items || []).map((item: any) => {
        const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ')
        const desc = esc(item.description || '')
        return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px"><div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap">${item.company ? `<span style="font-weight:600;color:#0f172a;font-size:10pt">${esc(item.company)}</span>` : ''}${item.role ? `<span style="font-size:10pt;color:#14b8a6;font-weight:500">${esc(item.role)}</span>` : ''}</div>${dates ? `<span style="font-size:9pt;color:#94a3b8;white-space:nowrap">${esc(dates)}</span>` : ''}</div>${desc ? `<div style="font-size:10pt;color:#475569;margin-top:3px;line-height:1.6;white-space:pre-wrap">${desc}</div>` : ''}</div>`
      }).join('\n')
    case 'education':
      return (c.items || []).map((item: any) => {
        const dates = [item.startDate, item.endDate].filter(Boolean).join(' — ')
        return `<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:4px"><span style="font-weight:600;color:#0f172a;font-size:10pt">${esc(item.school || '')}${item.degree ? ` — ${esc(item.degree)}` : ''}</span>${dates ? `<span style="font-size:9pt;color:#94a3b8">${esc(dates)}</span>` : ''}</div>${item.major ? `<div style="font-size:10pt;color:#475569">${esc(item.major)}</div>` : ''}</div>`
      }).join('\n')
    case 'skills': {
      const tags = c.skills || []
      if (!tags.length) return ''
      return `<div style="display:flex;flex-wrap:wrap;gap:6px">${tags.map((t: string) => `<span style="display:inline-block;padding:2px 10px;font-size:9pt;background:#f1f5f9;color:#334155;border-radius:3px">${esc(t)}</span>`).join('')}</div>`
    }
    case 'projects':
      return (c.items || []).map((item: any) => {
        const tech = esc(item.tech || '')
        const desc = esc(item.description || '')
        return `<div style="margin-bottom:10px"><div style="font-weight:600;color:#0f172a;font-size:10pt">${esc(item.name || '')}${item.role ? ` — ${esc(item.role)}` : ''}</div>${tech ? `<div style="font-size:9pt;color:#64748b;margin-top:2px">${tech}</div>` : ''}${desc ? `<div style="font-size:10pt;color:#475569;margin-top:3px;line-height:1.6;white-space:pre-wrap">${desc}</div>` : ''}</div>`
      }).join('\n')
    case 'certifications':
      return (c.items || []).map((item: any) =>
        `<div style="margin-bottom:4px"><span style="font-weight:600;color:#0f172a;font-size:10pt">${esc(item.name || '')}</span>${item.issuer ? `<span style="font-size:10pt;color:#64748b"> — ${esc(item.issuer)}</span>` : ''}${item.date ? `<span style="font-size:9pt;color:#94a3b8"> (${esc(item.date)})</span>` : ''}</div>`
      ).join('\n')
    default:
      return ''
  }
}

async function doExport(data: ResumeData): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
  try {
    const html = buildResumeHTML(data)
    const result = await dialog.showSaveDialog({
      title: '导出 PDF',
      defaultPath: `${data.title || 'resume'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }

    const win = new BrowserWindow({ show: false, width: 800, height: 1100, webPreferences: { contextIsolation: true, nodeIntegration: false } })
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    win.close()
    const actualPath = writeFileSafe(result.filePath, pdfBuffer)
    return { success: true, filePath: actualPath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

ipcMain.handle('export:pdf', async (_event, data: ResumeData) => doExport(data))

// ── Styled export (receives pre-rendered HTML from renderer) ─────────────────

function writeFileSafe(filePath: string, data: Buffer | string, encoding?: BufferEncoding): string {
  try {
    fs.writeFileSync(filePath, data, encoding as any);
    return filePath;
  } catch (err: any) {
    if (err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') {
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const base = path.basename(filePath, ext);
      const altPath = path.join(dir, `${base}-${Date.now()}${ext}`);
      fs.writeFileSync(altPath, data, encoding as any);
      return altPath;
    }
    throw err;
  }
}

async function doStyledExport(
  html: string,
  format: 'pdf' | 'html',
  suggestedName?: string,
): Promise<{ success: boolean; filePath?: string; error?: string; canceled?: boolean }> {
  try {
    const ext = format === 'pdf' ? 'pdf' : 'html'
    const fileName = suggestedName ? `${suggestedName}.${ext}` : `resume.${ext}`
    const result = await dialog.showSaveDialog({
      title: format === 'pdf' ? '导出 PDF' : '导出 HTML',
      defaultPath: fileName,
      filters: format === 'pdf'
        ? [{ name: 'PDF', extensions: ['pdf'] }]
        : [{ name: 'HTML', extensions: ['html'] }],
    })
    if (result.canceled || !result.filePath) return { success: false, canceled: true }

    if (format === 'html') {
      const actualPath = writeFileSafe(result.filePath, html, 'utf-8');
      return { success: true, filePath: actualPath }
    }

    // PDF — render in headless BrowserWindow
    const tmpFile = path.join(os.tmpdir(), `resumeforge-export-${Date.now()}.html`)
    fs.writeFileSync(tmpFile, html, 'utf-8')
    const win = new BrowserWindow({
      show: false, width: 800, height: 1100,
      webPreferences: { contextIsolation: true, nodeIntegration: false },
    })
    const proxy = process.env.HTTPS_PROXY || process.env.https_proxy || ''
    if (proxy) {
      await win.webContents.session.setProxy({ proxyRules: proxy })
    }
    await win.loadFile(tmpFile)
    const pdfBuffer = await win.webContents.printToPDF({ printBackground: true, pageSize: 'A4' })
    win.close()
    try { fs.unlinkSync(tmpFile) } catch {}
    try { fs.unlinkSync(result.filePath) } catch {}
    const actualPath = writeFileSafe(result.filePath, pdfBuffer);
    return { success: true, filePath: actualPath }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}

ipcMain.handle('export:styled-pdf', async (_event, html: string, suggestedName?: string) => doStyledExport(html, 'pdf', suggestedName))
ipcMain.handle('export:styled-html', async (_event, html: string, suggestedName?: string) => doStyledExport(html, 'html', suggestedName))
