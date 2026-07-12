import { contextBridge, ipcRenderer } from 'electron'

interface UpdateStatusPayload {
  status: string
  version?: string
  percent?: number
  bytesPerSecond?: number
  transferred?: number
  total?: number
  releaseNotes?: string
  releaseDate?: string
  message?: string
}

contextBridge.exposeInMainWorld('electronAPI', {
  // Window controls
  minimize: () => ipcRenderer.invoke('win-minimize'),
  maximize: () => ipcRenderer.invoke('win-maximize'),
  close: () => ipcRenderer.invoke('win-close'),

  // Resume CRUD
  getResumes: () => ipcRenderer.invoke('db:getResumes'),
  getResume: (id: string) => ipcRenderer.invoke('db:getResume', id),
  saveResume: (data: unknown) => ipcRenderer.invoke('db:saveResume', data),
  deleteResume: (id: string) => ipcRenderer.invoke('db:deleteResume', id),

  // AI
  generateStream: (params: {
    prompt: string
    provider: string
    model?: string
    apiKey?: string
    baseUrl?: string
    system?: string
  }): AsyncIterable<string> => {
    const results: string[] = []
    let resolveNext: ((value: IteratorResult<string>) => void) | null = null
    let done = false
    let error: string | null = null

    const handler = (_event: Electron.IpcRendererEvent, data: { chunk: string; done: boolean; error?: string }) => {
      if (data.error) {
        error = data.error
        done = true
        if (resolveNext) {
          resolveNext({ done: true, value: undefined as unknown as string })
          resolveNext = null
        }
        return
      }

      if (data.chunk) {
        if (resolveNext) {
          resolveNext({ done: false, value: data.chunk })
          resolveNext = null
        } else {
          results.push(data.chunk)
        }
      }

      if (data.done) {
        done = true
        if (resolveNext) {
          resolveNext({ done: true, value: undefined as unknown as string })
          resolveNext = null
        }
      }
    }

    ipcRenderer.on('ai:chunk', handler)
    ipcRenderer.send('ai:start', params)

    const cleanup = () => {
      ipcRenderer.removeListener('ai:chunk', handler)
    }

    return {
      [Symbol.asyncIterator](): AsyncIterator<string> {
        return {
          next: (): Promise<IteratorResult<string>> => {
            if (error) {
              cleanup()
              return Promise.reject(new Error(error))
            }
            if (results.length > 0) {
              return Promise.resolve({ done: false, value: results.shift()! })
            }
            if (done) {
              cleanup()
              return Promise.resolve({ done: true, value: undefined as unknown as string })
            }
            return new Promise((resolve) => {
              resolveNext = resolve
            })
          },
          return: (): Promise<IteratorResult<string>> => {
            cleanup()
            return Promise.resolve({ done: true, value: undefined as unknown as string })
          },
        }
      },
    }
  },

  getProviders: () => ipcRenderer.invoke('ai:providers'),

  // Open URL in system default browser
  openExternal: (url: string) => ipcRenderer.invoke('open-external', url),

  // Test AI connection via main process (avoids CORS from file://)
  testConnection: (opts: { provider: string; apiKey: string; model: string }) =>
    ipcRenderer.invoke('ai:test', opts),

  // Export
  exportPDF: (data: unknown) => ipcRenderer.invoke('export:pdf', data),
  exportDOCX: (data: unknown) => ipcRenderer.invoke('export:docx', data),
  exportTXT: (data: unknown) => ipcRenderer.invoke('export:txt', data),
  exportHTML: (data: unknown) => ipcRenderer.invoke('export:html', data),

  // Scanner (ATS provider integration via IPC)
  scanProviders: () => ipcRenderer.invoke('scan:providers'),
  searchJobs: (params: { provider: string; keyword: string }) =>
    ipcRenderer.invoke('scan:search', params),
  analyzeJob: (params: { jobText: string; jobTitle: string }) =>
    ipcRenderer.invoke('scan:analyze', params),

  // ── App version ────────────────────────────────────────────
  getVersion: () => ipcRenderer.invoke('app:version'),

  // ── Auto-updater ───────────────────────────────────────────
  onUpdateStatus: (callback: (status: UpdateStatusPayload) => void) => {
    const handler = (_event: Electron.IpcRendererEvent, data: UpdateStatusPayload) => callback(data)
    ipcRenderer.on('update-status', handler)
    return () => ipcRenderer.removeListener('update-status', handler)
  },
  checkForUpdates: () => ipcRenderer.invoke('update:check'),
  downloadUpdate: () => ipcRenderer.invoke('update:download'),
  installUpdate: () => ipcRenderer.invoke('update:install'),

  // ── Auth ────────────────────────────────────────────────────
  sendCode: (email: string) => ipcRenderer.invoke('auth:sendCode', email),
  register: (email: string, code: string, password: string) => ipcRenderer.invoke('auth:register', email, code, password),
  login: (email: string, password: string) => ipcRenderer.invoke('auth:login', email, password),
  getUser: () => ipcRenderer.invoke('auth:getUser'),
  isLoggedIn: () => ipcRenderer.invoke('auth:isLoggedIn'),
  logout: () => ipcRenderer.invoke('auth:logout'),
  changePassword: (oldPassword: string, newPassword: string) => ipcRenderer.invoke('auth:changePassword', oldPassword, newPassword),
})
