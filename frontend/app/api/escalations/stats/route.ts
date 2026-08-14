import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const total = Number(
      (db.prepare('SELECT COUNT(*) as c FROM escalation_requests').get() as { c: number })?.c ?? 0
    );
    const open = Number(
      (
        db.prepare("SELECT COUNT(*) as c FROM escalation_requests WHERE status = 'open'").get() as {
          c: number;
        }
      )?.c ?? 0
    );
    const urgent = Number(
      (
        db
          .prepare(
            "SELECT COUNT(*) as c FROM escalation_requests WHERE urgency IN ('high', 'emergency')"
          )
          .get() as { c: number }
      )?.c ?? 0
    );
    const resolved = Number(
      (
        db
          .prepare("SELECT COUNT(*) as c FROM escalation_requests WHERE status = 'resolved'")
          .get() as { c: number }
      )?.c ?? 0
    );

    return NextResponse.json({
      total,
      open,
      urgent,
      resolved,
    });
  } catch (error) {
    console.error('API /api/escalations/stats GET error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate escalation statistics.' },
      { status: 500 }
    );
  }
}
