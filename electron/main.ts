import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import path from 'path'
import { autoUpdater } from 'electron-updater'
import { initDB, getDB, persistDB } from './db/schema'
import { registerAIHandlers } from './ipc/ai'
import { registerScannerHandlers } from './scanner'
import { registerAuthHandlers } from './auth'
import './export'

let mainWindow: BrowserWindow | null = null

// ── autoUpdater ──────────────────────────────────────────────
autoUpdater.autoDownload = false
autoUpdater.autoInstallOnAppQuit = false

function sendUpdateStatus(status: string, payload?: unknown) {
  mainWindow?.webContents.send('update-status', { status, ...(payload as Record<string, unknown>) })
}

function setupAutoUpdater() {
  autoUpdater.on('checking-for-update', () => sendUpdateStatus('checking'))

  autoUpdater.on('update-available', (info) => {
    sendUpdateStatus('available', {
      version: info.version,
      releaseNotes: info.releaseNotes,
      releaseDate: info.releaseDate,
    })
  })

  autoUpdater.on('update-not-available', () => sendUpdateStatus('not-available'))

  autoUpdater.on('download-progress', (progress) => {
    sendUpdateStatus('downloading', {
      percent: Math.round(progress.percent),
      bytesPerSecond: progress.bytesPerSecond,
      transferred: progress.transferred,
      total: progress.total,
    })
  })

  autoUpdater.on('update-downloaded', (info) => {
    sendUpdateStatus('downloaded', { version: info.version })
  })

  autoUpdater.on('error', (err) => {
    sendUpdateStatus('error', { message: err?.message ?? String(err) })
  })
}

ipcMain.handle('update:check', () => {
  autoUpdater.checkForUpdates()
})

ipcMain.handle('update:download', () => {
  autoUpdater.downloadUpdate()
})

ipcMain.handle('update:install', () => {
  autoUpdater.quitAndInstall()
})

ipcMain.handle('app:version', () => app.getVersion())

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1680, height: 1000,
    minWidth: 1400, minHeight: 600,
    frame: false, titleBarStyle: 'hidden',
    backgroundColor: '#F8F7F4', show: false,
    icon: path.join(__dirname, '../build/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true, nodeIntegration: false,
    },
  })

  if (!app.isPackaged) {
    const port = process.env.VITE_PORT || '5173'
    mainWindow.loadURL(`http://localhost:${port}`).catch(() => {
      mainWindow?.loadFile(path.join(__dirname, '../dist/index.html'))
    })
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => mainWindow?.show())
}

// Window controls
ipcMain.handle('win-minimize', () => { mainWindow?.minimize(); return true })
ipcMain.handle('win-maximize', () => {
  mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize()
  return true
})
ipcMain.handle('win-close', () => { mainWindow?.close(); return true })

// Open URL in system browser
ipcMain.handle('open-external', (_e, url: string) => {
  if (url?.startsWith('http')) shell.openExternal(url)
  return true
})

// AI test connection via main process (avoids CORS from file://)
ipcMain.handle('ai:test', async (_e, opts: { provider: string; apiKey: string; model: string }) => {
  const urls: Record<string, string> = {
    deepseek: 'https://api.deepseek.com/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions',
    openrouter: 'https://openrouter.ai/api/v1/chat/completions',
    qwen: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    kimi: 'https://api.moonshot.cn/v1/chat/completions',
    minimax: 'https://api.minimaxi.com/v1/chat/completions',
    glm: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    doubao: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
  }
  const url = urls[opts.provider]
  if (!url) throw new Error(`Unsupported provider: ${opts.provider}`)
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${opts.apiKey}` },
    body: JSON.stringify({ model: opts.model, messages: [{ role: 'user', content: 'ok' }], max_tokens: 5, stream: false }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text().catch(() => '')}`)
  return true
})

// ── PDF text extraction — runs in main process to avoid Vite bundling issues ──
ipcMain.handle('pdf:extractText', async (_e, buffer: ArrayBuffer) => {
  const pdfjsLib = require('pdfjs-dist')
  const buf = Buffer.from(buffer)
  const doc = await pdfjsLib.getDocument({ data: new Uint8Array(buf), disableFontFace: true }).promise
  const pages: string[] = []
  const max = Math.min(doc.numPages, 20)
  for (let i = 1; i <= max; i++) {
    try {
      const page = await doc.getPage(i)
      const tc = await page.getTextContent()
      pages.push(tc.items.map((item: any) => item.str).join(' '))
    } catch { pages.push('') }
  }
  try { (doc as any).destroy() } catch {}
  return pages.filter(Boolean).join('\n')
})

// ── Resume CRUD — local only ──
ipcMain.handle('db:getResumes', async () => {
  const db = getDB()
  const stmt = db.prepare('SELECT * FROM resumes ORDER BY updated_at DESC')
  const rows: any[] = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    if (row.data) row.data = JSON.parse(row.data)
    rows.push(row)
  }
  stmt.free()
  return rows
})

ipcMain.handle('db:getResume', async (_e, id: string) => {
  const db = getDB()
  const stmt = db.prepare('SELECT * FROM resumes WHERE id = ?')
  stmt.bind([id])
  let row = null
  if (stmt.step()) {
    row = stmt.getAsObject()
    if (row.data) row.data = JSON.parse(row.data)
  }
  stmt.free()
  return row
})

ipcMain.handle('db:saveResume', async (_e, data: any) => {
  const id = data.id || crypto.randomUUID()
  const now = new Date().toISOString()
  const json = JSON.stringify(data)
  const db = getDB()
  const existing = db.prepare('SELECT id FROM resumes WHERE id = ?')
  existing.bind([id])
  const hasExisting = existing.step()
  existing.free()
  if (hasExisting) {
    db.run('UPDATE resumes SET title=?, updated_at=?, data=? WHERE id=?', [data.title || '未命名简历', now, json, id])
  } else {
    db.run('INSERT INTO resumes (id, title, created_at, updated_at, data) VALUES (?,?,?,?,?)', [id, data.title || '未命名简历', now, now, json])
  }
  persistDB()
  return { id }
})

ipcMain.handle('db:deleteResume', async (_e, id: string) => {
  getDB().run('DELETE FROM resumes WHERE id = ?', [id])
  persistDB()
  return { success: true }
})

app.whenReady().then(async () => {
  // ══ 1. Content Security Policy ══
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data: https:; connect-src 'self' ws: wss: https:;"
        ],
      },
    })
  })

  // ══ 2. 数据库 + IPC ══
  await initDB()
  registerAIHandlers()
  registerScannerHandlers()
  registerAuthHandlers()

  // ══ 3. 窗口 + 更新 ══
  createWindow()
  setupAutoUpdater()
  if (app.isPackaged) {
    autoUpdater.checkForUpdates()
    setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000)
  }
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
