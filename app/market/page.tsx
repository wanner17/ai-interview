'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type MarketVideo = {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  category: string;
  price: number;
  blurMode: string;
  voicePitch: string;
  createdAt: string;
  seller: { userId: string; nickname: string };
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700',
  집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700',
  토론: 'bg-green-100 text-green-700',
  외국어: 'bg-rose-100 text-rose-700',
};

const CATEGORIES = ['전체', '개인', '집단', 'PT', '토론', '외국어'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

export default function MarketPage() {
  const router = useRouter();
  const [videos, setVideos] = useState<MarketVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState('전체');
  const [query, setQuery] = useState('');
  const [inputVal, setInputVal] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const qs = new URLSearchParams();
        if (category !== '전체') qs.set('category', category);
        if (query) qs.set('q', query);
        const res = await fetch(`/api/market?${qs.toString()}`, { credentials: 'include' });
        if (res.status === 401) { router.replace('/?auth=login'); return; }
        const data = await res.json();
        if (!data.ok) {
          throw new Error(data.error || '마켓 목록을 불러오지 못했습니다.');
        }
        setVideos(data.videos);
      } catch (error) {
        setVideos([]);
        setError(error instanceof Error ? error.message : '마켓 목록을 불러오지 못했습니다.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [category, query, router]);

  const privacyBadges = (v: MarketVideo) => {
    const badges = [];
    if (v.blurMode === 'face' || v.blurMode === 'both') badges.push({ label: '얼굴 블러', icon: '🫥' });
    if (v.blurMode === 'background' || v.blurMode === 'both') badges.push({ label: '배경 블러', icon: '🌫️' });
    if (v.voicePitch !== 'normal') badges.push({ label: '음성 변조', icon: '🔊' });
    return badges;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* 헤더 */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 tracking-tight">면접 마켓</h1>
        <p className="text-gray-400 mt-1">실제 합격자들의 면접 영상을 구매하고 나만의 전략을 세워보세요</p>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex gap-2 flex-1">
          <input
            value={inputVal} onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && setQuery(inputVal)}
            placeholder="제목, 설명, 해시태그 검색"
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-violet-400 transition-colors"
          />
          <button
            onClick={() => setQuery(inputVal)}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}
          >
            검색
          </button>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all
                ${category === cat ? 'bg-violet-600 border-violet-600 text-white' : 'bg-white border-gray-200 text-gray-600 hover:border-violet-300'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* 내 구매목록 링크 */}
      <div className="flex justify-end mb-4">
        <Link href="/market/purchases" className="flex items-center gap-1.5 text-sm text-violet-600 hover:text-violet-800 font-semibold transition-colors">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
          내 구매 목록
        </Link>
      </div>

      {/* 영상 그리드 */}
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"/>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">
          {error}
        </div>
      ) : videos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400 text-sm">등록된 영상이 없습니다.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map(v => {
            const tags = v.hashtags ? JSON.parse(v.hashtags) as string[] : [];
            const badges = privacyBadges(v);
            return (
              <Link key={v.id} href={`/market/${v.id}`}
                className="group rounded-2xl border border-gray-200 bg-white hover:border-violet-300 hover:shadow-md transition-all overflow-hidden">
                {/* 썸네일 플레이스홀더 */}
                <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                  <svg className="w-12 h-12 text-gray-600" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                  <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[v.category] ?? 'bg-gray-100 text-gray-600'}`}>{v.category}</span>
                  </div>
                  <div className="absolute top-2 right-2">
                    {v.price === 0
                      ? <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-emerald-400 text-white">무료</span>
                      : <span className="rounded-full px-2 py-0.5 text-xs font-bold bg-violet-600 text-white">{v.price}T</span>}
                  </div>
                </div>

                <div className="p-4">
                  <p className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 mb-1">{v.title}</p>
                  {v.description && <p className="text-xs text-gray-400 line-clamp-2 mb-2">{v.description}</p>}

                  {/* 프라이버시 배지 */}
                  {badges.length > 0 && (
                    <div className="flex gap-1 mb-2 flex-wrap">
                      {badges.map((b, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-amber-50 text-amber-600 rounded font-medium">{b.icon} {b.label}</span>
                      ))}
                    </div>
                  )}

                  {/* 해시태그 */}
                  {tags.length > 0 && (
                    <div className="flex gap-1 flex-wrap mb-3">
                      {tags.slice(0, 4).map((tag, i) => (
                        <span key={i} className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-500 rounded font-medium">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{v.seller.nickname}</span>
                    <span>{formatDate(v.createdAt)}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
