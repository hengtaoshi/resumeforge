import { useState, useEffect, useCallback } from 'react'

export type UpdateStatus =
  | { type: 'idle' }
  | { type: 'checking' }
  | { type: 'available'; version: string; releaseNotes?: string; releaseDate?: string }
  | { type: 'not-available' }
  | { type: 'downloading'; percent: number }
  | { type: 'downloaded'; version: string }
  | { type: 'error'; message: string }

export function useUpdate() {
  const [status, setStatus] = useState<UpdateStatus>({ type: 'idle' })

  useEffect(() => {
    if (!window.electronAPI) return
    const cleanup = window.electronAPI.onUpdateStatus((payload) => {
      switch (payload.status) {
        case 'checking':
          setStatus({ type: 'checking' })
          break
        case 'available':
          setStatus({ type: 'available', version: payload.version ?? '', releaseNotes: payload.releaseNotes, releaseDate: payload.releaseDate })
          break
        case 'not-available':
          setStatus({ type: 'not-available' })
          break
        case 'downloading':
          setStatus({ type: 'downloading', percent: payload.percent ?? 0 })
          break
        case 'downloaded':
          setStatus({ type: 'downloaded', version: payload.version ?? '' })
          break
        case 'error':
          setStatus({ type: 'error', message: payload.message ?? '未知错误' })
          break
      }
    })
    return cleanup
  }, [])

  const check = useCallback(() => window.electronAPI?.checkForUpdates(), [])
  const download = useCallback(() => window.electronAPI?.downloadUpdate(), [])
  const install = useCallback(() => window.electronAPI?.installUpdate(), [])

  return { status, check, download, install }
}
