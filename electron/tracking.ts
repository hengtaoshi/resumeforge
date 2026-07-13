import { ipcMain } from 'electron'
import { getDB, persistDB } from './db/schema'
import { authedApi } from './auth'

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
    db.run('INSERT OR REPLACE INTO tracking_stats (key, value, updated_at) VALUES (?, ?, ?)', ['latest_ats_score', String(score), now])
    persistDB()
    return { ok: true }
  })

  // ── Deliveries ──
  ipcMain.handle('tracking:addDelivery', async (_e, data: { company: string; role: string; url?: string; note?: string }) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    try { await authedApi('/api/data/deliveries', { method: 'POST', body: JSON.stringify({ ...data, id, created_at: now }) }) } catch {}
    const db = getDB()
    db.run('INSERT INTO deliveries (id, company, role, url, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.url || null, data.note || null, now])
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getDeliveries', async () => {
    try {
      const remote: any = await authedApi('/api/data/deliveries')
      if (remote?.length !== undefined) {
        const db = getDB()
        db.run('DELETE FROM deliveries')
        for (const r of remote) {
          db.run('INSERT OR REPLACE INTO deliveries (id, company, role, url, status, interview_at, offer_at, rejected_at, note, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [r.id, r.company, r.role, r.url, r.status || 'applied', r.interview_at, r.offer_at, r.rejected_at, r.note, r.created_at])
        }
        persistDB()
        return remote
      }
    } catch { /* offline */ }
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, url, status, interview_at, offer_at, rejected_at, note, created_at FROM deliveries ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:updateDelivery', async (_e, id: string, data: { company?: string; role?: string; url?: string | null; note?: string | null }) => {
    try { await authedApi(`/api/data/deliveries/${id}`, { method: 'PATCH', body: JSON.stringify(data) }) } catch {}
    const db = getDB()
    const sets: string[] = []; const vals: any[] = []
    const COL_MAP: Record<string, string> = { company: 'company', role: 'role', url: 'url', note: 'note' }
    for (const [k, v] of Object.entries({ company: data.company, role: data.role, url: data.url, note: data.note })) {
      if (v !== undefined && COL_MAP[k]) { sets.push(`${COL_MAP[k]} = ?`); vals.push(v) }
    }
    if (sets.length > 0) { vals.push(id); db.run(`UPDATE deliveries SET ${sets.join(', ')} WHERE id = ?`, vals); persistDB() }
    return { ok: true }
  })

  // ponytail: single updateStatus handler — all status transitions go through this
  ipcMain.handle('tracking:updateStatus', async (_e, id: string, status: string) => {
    try { await authedApi(`/api/data/deliveries/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }) } catch {}
    const db = getDB()
    const now = new Date().toISOString()
    const tsCol = status === 'interviewing' ? 'interview_at' : status === 'offer' ? 'offer_at' : status === 'rejected' ? 'rejected_at' : null
    if (tsCol) { db.run(`UPDATE deliveries SET status = ?, ${tsCol} = ? WHERE id = ?`, [status, now, id]) }
    else { db.run('UPDATE deliveries SET status = ? WHERE id = ?', [status, id]) }
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:deleteDelivery', async (_e, id: string) => {
    try { await authedApi(`/api/data/deliveries/${id}`, { method: 'DELETE' }) } catch {}
    getDB().run('DELETE FROM deliveries WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })

  // ── Interviews ──
  ipcMain.handle('tracking:addInterview', async (_e, data: { company: string; role: string; type?: string; note?: string }) => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    try { await authedApi('/api/data/interviews', { method: 'POST', body: JSON.stringify({ ...data, id, created_at: now }) }) } catch {}
    const db = getDB()
    db.run('INSERT INTO interviews (id, company, role, type, note, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [id, data.company, data.role, data.type || 'tech', data.note || null, now])
    persistDB()
    return { id }
  })

  ipcMain.handle('tracking:getInterviews', async () => {
    try {
      const remote: any = await authedApi('/api/data/interviews')
      if (remote?.length !== undefined) {
        const db = getDB()
        db.run('DELETE FROM interviews')
        for (const r of remote) {
          db.run('INSERT OR REPLACE INTO interviews (id, company, role, type, note, review, created_at) VALUES (?,?,?,?,?,?,?)',
            [r.id, r.company, r.role, r.type || 'tech', r.note, r.review, r.created_at])
        }
        persistDB()
        return remote
      }
    } catch { /* offline */ }
    const db = getDB()
    const rows: any[] = []
    const stmt = db.prepare('SELECT id, company, role, type, note, review, created_at FROM interviews ORDER BY created_at DESC')
    while (stmt.step()) rows.push(stmt.getAsObject())
    stmt.free()
    return rows
  })

  ipcMain.handle('tracking:saveReview', async (_e, id: string, review: string) => {
    try { await authedApi(`/api/data/interviews/${id}/review`, { method: 'PATCH', body: JSON.stringify({ review }) }) } catch {}
    getDB().run('UPDATE interviews SET review = ? WHERE id = ?', [review, id])
    persistDB()
    return { ok: true }
  })

  ipcMain.handle('tracking:deleteInterview', async (_e, id: string) => {
    try { await authedApi(`/api/data/interviews/${id}`, { method: 'DELETE' }) } catch {}
    getDB().run('DELETE FROM interviews WHERE id = ?', [id])
    persistDB()
    return { ok: true }
  })
}
