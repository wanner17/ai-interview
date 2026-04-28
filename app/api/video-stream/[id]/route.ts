import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const range = request.headers.get('range');

  const fetchHeaders: Record<string, string> = {
    cookie: request.headers.get('cookie') ?? '',
  };
  if (range) fetchHeaders['range'] = range;

  const backendRes = await fetch(`${BACKEND_URL}/videos/stream/${id}`, {
    headers: fetchHeaders,
  });

  if (!backendRes.ok && backendRes.status !== 206) {
    return NextResponse.json({ ok: false, error: '스트리밍 오류' }, { status: backendRes.status });
  }

  const resHeaders = new Headers();
  const contentType = backendRes.headers.get('content-type');
  const contentLength = backendRes.headers.get('content-length');
  const contentRange = backendRes.headers.get('content-range');
  const acceptRanges = backendRes.headers.get('accept-ranges');
  if (contentType) resHeaders.set('Content-Type', contentType);
  if (contentLength) resHeaders.set('Content-Length', contentLength);
  if (contentRange) resHeaders.set('Content-Range', contentRange);
  resHeaders.set('Accept-Ranges', acceptRanges ?? 'bytes');
  resHeaders.set('Cache-Control', 'no-store, private');

  return new NextResponse(backendRes.body, { status: backendRes.status, headers: resHeaders });
}
