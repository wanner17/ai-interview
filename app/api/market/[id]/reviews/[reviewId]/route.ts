import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function DELETE(request: NextRequest, ctx: { params: Promise<{ id: string; reviewId: string }> }) {
  try {
    const { id, reviewId } = await ctx.params;
    const res = await fetch(`${BACKEND_URL}/videos/market/${id}/reviews/${reviewId}`, {
      method: 'DELETE',
      headers: { cookie: request.headers.get('cookie') ?? '' },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : '리뷰 삭제 실패' }, { status: 500 });
  }
}
