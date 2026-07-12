import { ipcMain, safeStorage } from 'electron'
import { existsSync, readFileSync, writeFileSync, unlinkSync } from 'fs'
import { app } from 'electron'
import https from 'https'
import http from 'http'
import net from 'net'
import tls from 'tls'

const API_BASE = process.env.RF_API_URL || 'https://api.hengtaoyuan.asia'
const TOKEN_PATH = app.getPath('userData') + '/auth-token.enc'
const PROXY = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || ''

interface StoredTokens {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

function loadTokens(): StoredTokens | null {
  try {
    if (!existsSync(TOKEN_PATH)) return null
    const raw = readFileSync(TOKEN_PATH)
    const decrypted = safeStorage.isEncryptionAvailable()
      ? safeStorage.decryptString(raw)
      : raw.toString()
    return JSON.parse(decrypted)
  } catch { return null }
}

function saveTokens(t: StoredTokens | null) {
  if (!t) { try { unlinkSync(TOKEN_PATH) } catch {}; return }
  const raw = JSON.stringify(t)
  const data = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(raw)
    : Buffer.from(raw, 'utf-8')
  writeFileSync(TOKEN_PATH, data)
}

// ── HTTPS request: direct first, fallback to proxy tunnel ──
function httpsRequest(url: string, opts: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; body: any }> {
  const u = new URL(url)
  const isHttps = u.protocol === 'https:'
  const port = Number(u.port) || (isHttps ? 443 : 80)

  const doDirect = (): Promise<{ status: number; body: any }> => new Promise((resolve, reject) => {
    const mod = isHttps ? https : http
    const body = opts.body || ''
    const req = mod.request({
      hostname: u.hostname, port, path: u.pathname + u.search,
      method: opts.method || 'GET',
      headers: { ...opts.headers, Host: u.hostname, 'Content-Length': Buffer.byteLength(body) },
      timeout: 10000,
    })
    const chunks: Buffer[] = []
    req.on('response', (resp: any) => {
      resp.on('data', (c: Buffer) => chunks.push(c))
      resp.on('end', () => {
        const raw = Buffer.concat(chunks).toString()
        try { resolve({ status: resp.statusCode || 500, body: JSON.parse(raw) }) }
        catch { resolve({ status: resp.statusCode || 500, body: raw }) }
      })
    })
    req.on('error', reject)
    req.on('timeout', () => { req.destroy(); reject(new Error('direct timeout')) })
    if (body) req.write(body)
    req.end()
  })

  const doTunnel = (): Promise<{ status: number; body: any }> => tunnelThroughProxy(u, port, isHttps, opts)

  // Direct first, fallback to proxy tunnel
  return doDirect().catch(() => {
    if (PROXY) return doTunnel()
    throw new Error('connection failed')
  })
}

function tunnelThroughProxy(u: URL, port: number, _isHttps: boolean, opts: { method?: string; headers?: Record<string, string>; body?: string }): Promise<{ status: number; body: any }> {
  const proxyUrl = new URL(PROXY)
  return new Promise((resolve, reject) => {
    const socket = net.connect(Number(proxyUrl.port) || 7897, proxyUrl.hostname, () => {
      socket.write(`CONNECT ${u.hostname}:${port} HTTP/1.1\r\nHost: ${u.hostname}:${port}\r\n\r\n`)
    })
    let buf = ''
    socket.on('data', (chunk) => {
      buf += chunk.toString()
      if (!buf.includes('\r\n\r\n')) return
      const head = buf.substring(0, buf.indexOf('\r\n\r\n'))
      if (!head.includes('200')) { socket.destroy(); reject(new Error(`Proxy CONNECT failed: ${head}`)); return }
      const tlsSocket = tls.connect({ socket, servername: u.hostname })
      const body = opts.body || ''
      tlsSocket.write(
        `${opts.method || 'GET'} ${u.pathname + u.search} HTTP/1.1\r\n` +
        Object.entries({ ...opts.headers, Host: u.hostname }).map(([k, v]) => `${k}: ${v}`).join('\r\n') +
        `\r\nContent-Length: ${Buffer.byteLength(body)}\r\n\r\n${body}`
      )
      let respBuf = ''
      tlsSocket.on('data', (c) => { respBuf += c.toString() })
      tlsSocket.on('end', () => {
        const m = respBuf.match(/HTTP\/\d\.\d\s+(\d+).*?\r\n\r\n([\s\S]*)/)
        if (!m) { resolve({ status: 0, body: respBuf }); return }
        try { resolve({ status: parseInt(m[1]), body: JSON.parse(m[2]) }) }
        catch { resolve({ status: parseInt(m[1]), body: m[2] }) }
      })
      tlsSocket.on('error', (e) => { socket.destroy(); reject(e) })
    })
    socket.on('error', reject)
    socket.setTimeout(15000, () => { socket.destroy(); reject(new Error('timeout')) })
  })
}

async function api(path: string, opts: { method?: string; body?: string; headers?: Record<string, string> } = {}): Promise<any> {
  const tokens = loadTokens()
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  if (tokens) headers['Authorization'] = `Bearer ${tokens.accessToken}`
  const { status, body } = await httpsRequest(`${API_BASE}${path}`, { ...opts, headers })
  if (status >= 400) throw new Error(body?.error || `HTTP ${status}`)
  return body
}

async function authedApi(path: string, opts: { method?: string; body?: string; headers?: Record<string, string> } = {}): Promise<any> {
  const tokens = loadTokens()
  if (!tokens) throw new Error('not logged in')
  if (Date.now() > tokens.expiresAt - 60_000) {
    const refreshBody = await api('/api/auth/refresh', { method: 'POST', headers: { 'Authorization': `Bearer ${tokens.refreshToken}` } })
    saveTokens({ accessToken: refreshBody.accessToken, refreshToken: refreshBody.refreshToken, expiresAt: Date.now() + 14 * 60 * 1000 })
  }
  const t = loadTokens()!
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(opts.headers || {}) }
  headers['Authorization'] = `Bearer ${t.accessToken}`
  const { status, body } = await httpsRequest(`${API_BASE}${path}`, { ...opts, headers })
  if (status >= 400) throw new Error(body?.error || `HTTP ${status}`)
  return body
}

export function registerAuthHandlers() {
  ipcMain.handle('auth:sendCode', async (_e, email: string) => {
    await api('/api/auth/send-code', { method: 'POST', body: JSON.stringify({ email }) })
  })
  ipcMain.handle('auth:register', async (_e, email: string, code: string, password: string) => {
    const body = await api('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, code, password }) })
    saveTokens({ accessToken: body.accessToken, refreshToken: body.refreshToken, expiresAt: Date.now() + 14 * 60 * 1000 })
    return body.user
  })
  ipcMain.handle('auth:login', async (_e, email: string, password: string) => {
    const body = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) })
    saveTokens({ accessToken: body.accessToken, refreshToken: body.refreshToken, expiresAt: Date.now() + 14 * 60 * 1000 })
    return body.user
  })
  ipcMain.handle('auth:getUser', async () => {
    try { return await authedApi('/api/auth/me') } catch { return null }
  })
  ipcMain.handle('auth:isLoggedIn', () => loadTokens() !== null)
  ipcMain.handle('auth:logout', async () => {
    try { await authedApi('/api/auth/logout', { method: 'POST' }) } catch {}
    saveTokens(null)
  })

  ipcMain.handle('auth:changePassword', async (_e, oldPassword: string, newPassword: string) => {
    await authedApi('/api/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ oldPassword, newPassword }),
    })
  })
}
