'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type InterviewVideo = {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  createdAt: string;
};

const CATEGORY_LABELS: Record<string, string> = {
  개인: '개인 면접',
  집단: '집단 면접',
  PT: 'PT 면접',
  토론: '토론 면접',
  외국어: '외국어 면접',
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700',
  집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700',
  토론: 'bg-green-100 text-green-700',
  외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function HistoryPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<InterviewVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeVideo, setActiveVideo] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/my-interviews', { credentials: 'include' });
        if (res.status === 401) {
          router.replace('/?auth=login');
          return;
        }
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);
        setVideos(data.videos);
      } catch (e) {
        setError(e instanceof Error ? e.message : '불러오기에 실패했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [router]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">면접 이력</h1>
        <p className="mt-1 text-sm text-gray-500">저장한 면접 영상을 다시 확인해보세요.</p>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" />
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 py-24 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-50">
            <svg className="h-8 w-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M12 18.75H4.5a2.25 2.25 0 01-2.25-2.25V7.5A2.25 2.25 0 014.5 5.25H12a2.25 2.25 0 012.25 2.25v9a2.25 2.25 0 01-2.25 2.25z" />
            </svg>
          </div>
          <p className="text-base font-medium text-gray-700">저장된 면접 영상이 없습니다</p>
          <p className="mt-1 text-sm text-gray-400">면접 시작 시 영상 저장을 활성화해보세요.</p>
          <Link
            href="/"
            className="mt-6 rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-violet-700"
          >
            면접 시작하기
          </Link>
        </div>
      )}

      {!loading && !error && videos.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <div
              key={v.id}
              className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
            >
              {/* Video thumbnail / player */}
              <div className="relative aspect-video bg-gray-900">
                {activeVideo === v.id ? (
                  <video
                    ref={videoRef}
                    src={v.videoUrl}
                    controls
                    autoPlay
                    className="h-full w-full object-contain"
                    onEnded={() => setActiveVideo(null)}
                  />
                ) : (
                  <button
                    type="button"
                    className="absolute inset-0 flex items-center justify-center"
                    onClick={() => setActiveVideo(v.id)}
                  >
                    <video
                      src={`${v.videoUrl}#t=0.1`}
                      className="h-full w-full object-contain opacity-60"
                      preload="metadata"
                      muted
                    />
                    <span className="absolute flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-lg transition group-hover:scale-105">
                      <svg className="h-6 w-6 translate-x-0.5 text-violet-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                  </button>
                )}
              </div>

              {/* Meta */}
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[v.category] ?? 'bg-gray-100 text-gray-600'}`}>
                    {CATEGORY_LABELS[v.category] ?? v.category}
                  </span>
                </div>
                <p className="line-clamp-2 text-sm font-medium text-gray-800">{v.title}</p>
                <p className="mt-auto pt-1 text-xs text-gray-400">{formatDate(v.createdAt)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
