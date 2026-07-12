import { ipcMain } from 'electron'
import { getDB, persistDB } from './db/schema'

export function registerTrackingHandlers() {
  // ── Get all stats ──
  ipcMain.handle('tracking:getStats', () => {
    const db = getDB()
    const stats: Record<string, string> = {}
    const stmt = db.prepare('SELECT key, value FROM tracking_stats')
    while (stmt.step()) {
      const row = stmt.getAsObject() as any
      stats[row.key] = row.value
    }
    stmt.free()
    // Count deliveries / interviews directly from their tables
    const deliveryCount = db.exec('SELECT COUNT(*) as c FROM deliveries')[0]?.values[0]?.[0] || 0
    const interviewCount = db.exec('SELECT COUNT(*) as c FROM interviews')[0]?.values[0]?.[0] || 0
    return {
      atsScore: stats.latest_ats_score ? Number(stats.latest_ats_score) : null,
      deliveryCount: Number(deliveryCount),
      interviewCount: Number(interviewCount),
    }
  })

  // ── Save ATS score ──
  ipcMain.handle('tracking:saveATS', (_e, score: number) => {
    const db = getDB()
    const now = new Date().toISOString()
    db.run(
      'INSERT OR REPLACE INTO tracking_stats (key, value, updated_at) VALUES (?, ?, ?)',
      ['latest_ats_score', String(score), now],
    )
    persistDB()
    return { ok: true }
  })

  // ── Deliveries ──
  ipcMain.handle('tracking:addDelivery', (_e, data: { company: string; role: string; url?: string }) => {
    const db = getDB()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO deliveries (id, company, role, url, created_at) VALUES (?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.url || null, now],
    )
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getDeliveries', () => {
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, url, created_at FROM deliveries ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:deleteDelivery', (_e, id: string) => {
    getDB().run('DELETE FROM deliveries WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })

  // ── Interviews ──
  ipcMain.handle('tracking:addInterview', (_e, data: { company: string; role: string; type?: string; note?: string }) => {
    const db = getDB()
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    db.run(
      'INSERT INTO interviews (id, company, role, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.type || 'tech', data.note || null, now],
    )
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getInterviews', () => {
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, type, note, created_at FROM interviews ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:deleteInterview', (_e, id: string) => {
    getDB().run('DELETE FROM interviews WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })
}
