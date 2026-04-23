import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const res = await fetch(`${BACKEND_URL}/videos/market/${id}/reviews`, {
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : '리뷰 조회 실패' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/videos/market/${id}/reviews`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: request.headers.get('cookie') ?? '' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : '리뷰 작성 실패' }, { status: 500 });
  }
}
