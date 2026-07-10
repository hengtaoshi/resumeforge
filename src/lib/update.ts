// ponytail: checks GitHub Releases API for newer versions

const REPO = 'hengtaoshi/resumeforge'
const CURRENT_VERSION = '1.0.0'

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  downloadUrl: string
  releaseUrl: string
  releaseNotes?: string
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  const current = CURRENT_VERSION.replace(/^v/, '')
  try {
    const res = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { signal: AbortSignal.timeout(5000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const data = await res.json()
    const latestTag = (data.tag_name || '').replace(/^v/, '')
    if (latestTag === current) return { hasUpdate: false, latestVersion: latestTag, downloadUrl: '', releaseUrl: data.html_url || '' }
    const asset = (data.assets || []).find((a: any) => a.name?.endsWith('.exe') || a.name?.endsWith('.Setup'))
    return { hasUpdate: true, latestVersion: latestTag, downloadUrl: asset?.browser_download_url || data.html_url || '', releaseUrl: data.html_url || '', releaseNotes: data.body || '' }
  } catch {
    // Fallback: list all releases
    try {
      const res = await fetch(`https://api.github.com/repos/${REPO}/releases?per_page=5`, { signal: AbortSignal.timeout(5000) })
      if (!res.ok) return null
      const list = await res.json()
      if (!Array.isArray(list) || !list.length) return null
      const latest = list[0]
      const latestTag = (latest.tag_name || '').replace(/^v/, '')
      if (latestTag === current || !latestTag) return { hasUpdate: false, latestVersion: latestTag, downloadUrl: '', releaseUrl: '' }
      const asset = (latest.assets || []).find((a: any) => a.name?.endsWith('.exe') || a.name?.endsWith('.Setup'))
      return { hasUpdate: true, latestVersion: latestTag, downloadUrl: asset?.browser_download_url || '', releaseUrl: latest.html_url || '', releaseNotes: latest.body || '' }
    } catch {
      return null
    }
  }
}
