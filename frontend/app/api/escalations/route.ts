import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('user_id');

    const db = getDb();
    let query = 'SELECT * FROM escalation_requests';
    const params: string[] = [];
    const conditions: string[] = [];

    if (userId) {
      conditions.push('user_id = ?');
      params.push(userId);
    }
    if (status) {
      conditions.push('status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY id DESC';

    const records = db.prepare(query).all(...params);
    return NextResponse.json(records);
  } catch (error) {
    console.error('API /api/escalations GET error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalation requests from database.' },
      { status: 500 }
    );
  }
}
