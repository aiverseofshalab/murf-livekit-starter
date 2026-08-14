import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const total = Number(
      (db.prepare('SELECT COUNT(*) as c FROM call_records').get() as { c: number })?.c ?? 0
    );
    const successful = Number(
      (
        db.prepare("SELECT COUNT(*) as c FROM call_records WHERE outcome = 'successful'").get() as {
          c: number;
        }
      )?.c ?? 0
    );
    const failed = Number(
      (
        db.prepare("SELECT COUNT(*) as c FROM call_records WHERE outcome = 'failed'").get() as {
          c: number;
        }
      )?.c ?? 0
    );

    const successRate = total > 0 ? Number(((successful / total) * 100).toFixed(1)) : 0;

    return NextResponse.json({
      total_calls: total,
      successful_calls: successful,
      failed_calls: failed,
      success_rate: successRate,
    });
  } catch (error) {
    console.error('API /api/analytics GET error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate call analytics from database.' },
      { status: 500 }
    );
  }
}
