import { DatabaseSync } from 'node:sqlite';
import path from 'path';

export interface EscalationRecord {
  id: number;
  reference_id: string;
  user_id: string;
  name: string;
  reason: string;
  summary: string;
  what_was_checked: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  language: string;
  preferred_follow_up: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  updated_at: string;
}

export function getDb() {
  const dbPath =
    process.env.MEDISATHI_MEMORY_DB ||
    path.resolve(process.cwd(), '../backend/data/medisathi_memory.db');

  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS escalation_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference_id TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL,
      name TEXT DEFAULT '',
      reason TEXT NOT NULL,
      summary TEXT NOT NULL,
      what_was_checked TEXT DEFAULT '',
      urgency TEXT DEFAULT 'medium',
      language TEXT DEFAULT 'English',
      preferred_follow_up TEXT DEFAULT '',
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);
  return db;
}
