import { authedApi } from './auth'
import { getDB, persistDB } from './db/schema'

/**
 * 登录后全量同步：服务器有数据 → 覆盖本地；本地有数据 → 上传到服务器。
 */
export async function syncAllData(): Promise<void> {
  try {
    const data: any = await authedApi('/api/data/sync')
    if (!data) return
    const hasServerData = data.resumes?.length > 0 || data.deliveries?.length > 0
    if (hasServerData) {
      // ponytail: server is source of truth — wipe local, write server data
      clearLocalData()
      writeServerData(data)
    } else {
      // ponytail: first time on server — upload local data
      await uploadLocalData()
    }
  } catch (e) {
    console.warn('[sync] failed - offline or server error:', (e as Error)?.message)
  }
}

function clearLocalData() {
  const db = getDB()
  for (const t of ['resumes', 'resume_sections', 'job_descriptions', 'chat_sessions', 'chat_messages', 'applications', 'tracking_stats', 'deliveries', 'interviews']) {
    db.run(`DELETE FROM ${t}`)
  }
  persistDB()
}

function writeServerData(data: any) {
  const db = getDB()
  const now = new Date().toISOString()

  for (const row of (data.resumes || [])) {
    db.run('INSERT OR REPLACE INTO resumes (id, title, created_at, updated_at, theme, version, data) VALUES (?,?,?,?,?,?,?)',
      [row.id, row.title, row.created_at, row.updated_at, row.theme, row.version, JSON.stringify(row.data)])
  }
  for (const row of (data.resume_sections || [])) {
    db.run('INSERT OR REPLACE INTO resume_sections (id, resume_id, type, sort_order, content, is_visible) VALUES (?,?,?,?,?,?)',
      [row.id, row.resume_id, row.type, row.sort_order, row.content, row.is_visible])
  }
  for (const row of (data.deliveries || [])) {
    db.run('INSERT OR REPLACE INTO deliveries (id, company, role, url, status, interview_at, offer_at, rejected_at, note, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [row.id, row.company, row.role, row.url, row.status || 'applied', row.interview_at, row.offer_at, row.rejected_at, row.note, row.created_at || now])
  }
  for (const row of (data.interviews || [])) {
    db.run('INSERT OR REPLACE INTO interviews (id, company, role, type, note, review, created_at) VALUES (?,?,?,?,?,?,?)',
      [row.id, row.company, row.role, row.type || 'tech', row.note, row.review, row.created_at || now])
  }
  for (const row of (data.applications || [])) {
    db.run('INSERT OR REPLACE INTO applications (id, company, role, url, status, resume_id, assessment, created_at) VALUES (?,?,?,?,?,?,?,?)',
      [row.id, row.company, row.role, row.url, row.status, row.resume_id, row.assessment, row.created_at || now])
  }
  for (const row of (data.chat_sessions || [])) {
    db.run('INSERT OR REPLACE INTO chat_sessions (id, resume_id, created_at, updated_at) VALUES (?,?,?,?)',
      [row.id, row.resume_id, row.created_at || now, row.updated_at || now])
  }
  for (const row of (data.chat_messages || [])) {
    db.run('INSERT OR REPLACE INTO chat_messages (id, session_id, role, content, created_at) VALUES (?,?,?,?,?)',
      [row.id, row.session_id, row.role, row.content, row.created_at || now])
  }
  for (const row of (data.job_descriptions || [])) {
    db.run('INSERT OR REPLACE INTO job_descriptions (id, raw_text, company, title, parsed_data, created_at, analysis) VALUES (?,?,?,?,?,?,?)',
      [row.id, row.raw_text, row.company, row.title, row.parsed_data, row.created_at || now, row.analysis])
  }
  persistDB()
}

async function uploadLocalData(): Promise<void> {
  const db = getDB()

  const all = (sql: string) => {
    const rows: any[] = []
    const stmt = db.prepare(sql)
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  }

  const resumes = all('SELECT * FROM resumes')
  const sections = all('SELECT * FROM resume_sections')
  const deliveries = all('SELECT * FROM deliveries')
  const interviews = all('SELECT * FROM interviews')
  const applications = all('SELECT * FROM applications')
  const sessions = all('SELECT * FROM chat_sessions')
  const messages = all('SELECT * FROM chat_messages')
  const jds = all('SELECT * FROM job_descriptions')

  await authedApi('/api/data/sync', {
    method: 'PUT',
    body: JSON.stringify({ resumes, sections, deliveries, interviews, applications, sessions, messages, jds }),
  })
}
