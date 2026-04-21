import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    const res = await fetch(`${BACKEND_URL}/videos/${id}/purchase`, {
      method: 'POST',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    const raw = await res.text();

    try {
      const data = raw ? JSON.parse(raw) : {};
      return NextResponse.json(data, { status: res.status });
    } catch {
      return NextResponse.json(
        {
          ok: false,
          error: raw || '백엔드가 JSON이 아닌 응답을 반환했습니다.',
        },
        { status: res.status || 500 },
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : '구매 요청에 실패했습니다.',
      },
      { status: 500 },
    );
  }
}
