import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const res = await fetch(`${BACKEND_URL}/videos/my`, {
    headers: {
      cookie: request.headers.get('cookie') ?? '',
    },
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
