import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reference_id: string }> }
) {
  try {
    const { reference_id } = await params;
    const refIdClean = reference_id.trim().toUpperCase();

    const db = getDb();
    const record = db
      .prepare('SELECT * FROM escalation_requests WHERE reference_id = ?')
      .get(refIdClean);

    if (!record) {
      return NextResponse.json(
        { found: false, error: `Escalation request ${refIdClean} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({ found: true, ...record });
  } catch (error) {
    console.error('API /api/escalations/[reference_id] GET error:', error);
    return NextResponse.json({ error: 'Database lookup error.' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ reference_id: string }> }
) {
  try {
    const { reference_id } = await params;
    const body = await request.json();
    const status = body.status?.toString().toLowerCase().trim();

    if (!status || !['open', 'in_progress', 'resolved'].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status value. Must be 'open', 'in_progress', or 'resolved'." },
        { status: 400 }
      );
    }

    const refIdClean = reference_id.trim().toUpperCase();
    const now = new Date().toISOString();
    const db = getDb();

    const result = db
      .prepare(
        `
        UPDATE escalation_requests
        SET status = ?, updated_at = ?
        WHERE reference_id = ?
      `
      )
      .run(status, now, refIdClean);

    if (result.changes === 0) {
      return NextResponse.json(
        { error: `Escalation request ${refIdClean} not found.` },
        { status: 404 }
      );
    }

    const updatedRecord = db
      .prepare('SELECT * FROM escalation_requests WHERE reference_id = ?')
      .get(refIdClean);

    return NextResponse.json({
      success: true,
      message: `Status updated to ${status}.`,
      record: updatedRecord,
    });
  } catch (error) {
    console.error('API /api/escalations/[reference_id] PATCH error:', error);
    return NextResponse.json(
      { error: 'Failed to update escalation request status.' },
      { status: 500 }
    );
  }
}
