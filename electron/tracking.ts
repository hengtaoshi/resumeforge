import { ipcMain } from 'electron'
import { getDB, persistDB } from './db/schema'

export function registerTrackingHandlers() {
  ipcMain.handle('tracking:getStats', () => {
    const db = getDB()
    const stats: Record<string, string> = {}
    const stmt = db.prepare('SELECT key, value FROM tracking_stats')
    while (stmt.step()) {
      const row = stmt.getAsObject() as any
      stats[row.key] = row.value
    }
    stmt.free()
    const deliveryCount = db.exec('SELECT COUNT(*) as c FROM deliveries')[0]?.values[0]?.[0] || 0
    const interviewCount = db.exec('SELECT COUNT(*) as c FROM interviews')[0]?.values[0]?.[0] || 0
    return {
      atsScore: stats.latest_ats_score ? Number(stats.latest_ats_score) : null,
      deliveryCount: Number(deliveryCount),
      interviewCount: Number(interviewCount),
    }
  })

  ipcMain.handle('tracking:saveATS', (_e, score: number) => {
    const db = getDB()
    const now = new Date().toISOString()
    db.run('INSERT OR REPLACE INTO tracking_stats (key, value, updated_at) VALUES (?, ?, ?)', ['latest_ats_score', String(score), now])
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:addDelivery', async (_e, data: { company: string; role: string; url?: string; note?: string }) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const db = getDB()
    db.run('INSERT INTO deliveries (id, company, role, url, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.url || null, data.note || null, now])
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getDeliveries', async () => {
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, url, status, interview_at, offer_at, rejected_at, note, created_at FROM deliveries ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:updateDelivery', async (_e, id: string, data: { company?: string; role?: string; url?: string | null; note?: string | null }) => {
    const db = getDB()
    const sets: string[] = []; const vals: any[] = []
    const COL_MAP: Record<string, string> = { company: 'company', role: 'role', url: 'url', note: 'note' }
    for (const [k, v] of Object.entries({ company: data.company, role: data.role, url: data.url, note: data.note })) {
      if (v !== undefined && COL_MAP[k]) { sets.push(`${COL_MAP[k]} = ?`); vals.push(v) }
    }
    if (sets.length > 0) { vals.push(id); db.run(`UPDATE deliveries SET ${sets.join(', ')} WHERE id = ?`, vals); persistDB() }
    return { ok: true }
  })

  ipcMain.handle('tracking:updateStatus', async (_e, id: string, status: string) => {
    const db = getDB()
    const now = new Date().toISOString()
    const tsCol = status === 'interviewing' ? 'interview_at' : status === 'offer' ? 'offer_at' : status === 'rejected' ? 'rejected_at' : null
    if (tsCol) { db.run(`UPDATE deliveries SET status = ?, ${tsCol} = ? WHERE id = ?`, [status, now, id]) }
    else { db.run('UPDATE deliveries SET status = ? WHERE id = ?', [status, id]) }
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:deleteDelivery', async (_e, id: string) => {
    getDB().run('DELETE FROM deliveries WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:addInterview', async (_e, data: { company: string; role: string; type?: string; note?: string }) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const db = getDB()
    db.run('INSERT INTO interviews (id, company, role, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.type || 'tech', data.note || null, now])
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getInterviews', async () => {
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, type, note, review, created_at FROM interviews ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:saveReview', async (_e, id: string, review: string) => {
    getDB().run('UPDATE interviews SET review = ? WHERE id = ?', [review, id])
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:deleteInterview', async (_e, id: string) => {
    getDB().run('DELETE FROM interviews WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })
}
