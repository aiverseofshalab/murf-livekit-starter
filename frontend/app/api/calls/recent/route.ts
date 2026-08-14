import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

interface CallRecordRow {
  call_id: string;
  user_id: string;
  channel: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  outcome: string | null;
  success_reason: string | null;
  failure_reason: string | null;
}

export async function GET() {
  try {
    const db = getDb();
    const rows = db
      .prepare(
        `
        SELECT call_id, user_id, channel, started_at, ended_at,
               duration_seconds, outcome, success_reason, failure_reason
        FROM call_records
        ORDER BY id DESC
        LIMIT 20
      `
      )
      .all() as unknown as CallRecordRow[];

    // Map rows to safe sanitized items
    const recentCalls = rows.map((r) => ({
      call_id: r.call_id,
      user_id: r.user_id === 'console-user' ? 'Browser User' : 'Caller',
      channel: r.channel || 'browser',
      started_at: r.started_at,
      ended_at: r.ended_at,
      duration_seconds: r.duration_seconds || 0,
      outcome: r.outcome || 'ongoing',
      reason: r.outcome === 'successful' ? r.success_reason : r.failure_reason,
    }));

    return NextResponse.json(recentCalls);
  } catch (error) {
    console.error('API /api/calls/recent GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recent calls from database.' },
      { status: 500 }
    );
  }
}
