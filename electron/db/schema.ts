import initSqlJs, { Database as SqlJsDb } from 'sql.js'
import fs from 'fs'
import path from 'path'
import { app } from 'electron'

let db: SqlJsDb | null = null
let dbPath: string = ''

export async function initDB(): Promise<void> {
  const SQL = await initSqlJs()
  dbPath = path.join(app.getPath('userData'), 'resumeforge.db')

  try {
    const buffer = fs.readFileSync(dbPath)
    db = new SQL.Database(buffer)
  } catch {
    db = new SQL.Database()
  }

  db.run('PRAGMA journal_mode=WAL')
  db.run('PRAGMA foreign_keys=ON')

  db.run(`
    CREATE TABLE IF NOT EXISTS resumes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '未命名简历',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      theme TEXT NOT NULL DEFAULT '{"primary":"#14b8a6","font":"noto-sans-sc"}',
      version TEXT,
      data TEXT NOT NULL DEFAULT 'general'
    );

    CREATE TABLE IF NOT EXISTS resume_sections (
      id TEXT PRIMARY KEY,
      resume_id TEXT NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      content TEXT NOT NULL DEFAULT '{}',
      is_visible INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS job_descriptions (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      company TEXT,
      title TEXT,
      parsed_data TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      analysis TEXT
    );

    CREATE TABLE IF NOT EXISTS chat_sessions (
      id TEXT PRIMARY KEY,
      resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      session_id TEXT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      url TEXT,
      status TEXT NOT NULL DEFAULT 'discovered',
      resume_id TEXT REFERENCES resumes(id) ON DELETE SET NULL,
      assessment TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tracking_stats (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      url TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS interviews (
      id TEXT PRIMARY KEY,
      company TEXT NOT NULL,
      role TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'tech',
      note TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sections_resume ON resume_sections(resume_id);
    CREATE INDEX IF NOT EXISTS idx_chat_session ON chat_messages(session_id);
  `)

  saveDB()
}

function saveDB(): void {
  if (!db || !dbPath) return
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

export function getDB(): SqlJsDb {
  if (!db) throw new Error('Database not initialized. Call initDB() first.')
  return db
}

export function persistDB(): void {
  saveDB()
}
