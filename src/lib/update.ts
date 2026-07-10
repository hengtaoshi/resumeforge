// ponytail: checks GitHub Releases API for newer versions

const REPO = 'hengtaoshi/resumeforge'
const CURRENT_VERSION = '1.1.0'

export interface UpdateInfo {
  hasUpdate: boolean
  latestVersion: string
  downloadUrl: string
  releaseUrl: string
  releaseNotes?: string
}

export async function checkForUpdate(): Promise<UpdateInfo | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/releases/latest`,
      { signal: AbortSignal.timeout(8000) },
    )
    if (!res.ok) return null

    const data = await res.json()
    const latestTag = (data.tag_name || '').replace(/^v/, '')
    const current = CURRENT_VERSION.replace(/^v/, '')

    if (latestTag === current) {
      return {
        hasUpdate: false,
        latestVersion: latestTag,
        downloadUrl: '',
        releaseUrl: data.html_url || '',
      }
    }

    const asset = (data.assets || []).find(
      (a: any) => a.name?.endsWith('.exe'),
    )

    return {
      hasUpdate: true,
      latestVersion: latestTag,
      downloadUrl: asset?.browser_download_url || '',
      releaseUrl: data.html_url || '',
      releaseNotes: data.body || '',
    }
  } catch {
    return null
  }
}
