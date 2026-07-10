import { app, BrowserWindow, ipcMain, shell, session } from 'electron'
import path from 'path'
import { initDB, getDB, persistDB } from './db/schema'
import { registerAIHandlers } from './ipc/ai'
import { registerScannerHandlers } from './scanner'
import './export'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800,
    minWidth: 960, minHeight: 600,
    frame: false, titleBarStyle: 'hidden',
    backgroundColor: '#F8F7F4', show: false,
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

// Resume CRUD — full JSON persistence (including sections)
ipcMain.handle('db:getResumes', () => {
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

ipcMain.handle('db:getResume', (_e, id: string) => {
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

ipcMain.handle('db:saveResume', (_e, data: any) => {
  const db = getDB()
  const id = data.id || crypto.randomUUID()
  const now = new Date().toISOString()
  const json = JSON.stringify(data)

  const existing = db.prepare('SELECT id FROM resumes WHERE id = ?')
  existing.bind([id])
  const hasExisting = existing.step()
  existing.free()

  if (hasExisting) {
    db.run('UPDATE resumes SET title=?, updated_at=?, data=? WHERE id=?',
      [data.title || '未命名简历', now, json, id])
  } else {
    db.run('INSERT INTO resumes (id, title, created_at, updated_at, data) VALUES (?,?,?,?,?)',
      [id, data.title || '未命名简历', now, now, json])
  }
  persistDB()
  return { id }
})

ipcMain.handle('db:deleteResume', (_e, id: string) => {
  getDB().run('DELETE FROM resumes WHERE id = ?', [id])
  persistDB()
  return { success: true }
})

app.whenReady().then(async () => {
  // Content Security Policy — allow Vite dev server inline scripts + HMR WebSocket
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

  await initDB()
  registerAIHandlers()
  registerScannerHandlers()
  createWindow()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })
