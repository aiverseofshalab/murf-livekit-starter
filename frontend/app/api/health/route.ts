import { NextResponse } from 'next/server';

export const revalidate = 0;

export async function GET() {
  try {
    return NextResponse.json({
      status: 'ok',
      service: 'MEDISATHI',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  } catch (error) {
    console.error('Health check API error:', error);
    return NextResponse.json({ status: 'error', message: 'Health check failed' }, { status: 500 });
  }
}
