'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { PrivacyVideoPlayer, type BlurMode, type VoicePitch } from '@/app/components/PrivacyVideoPlayer';

type MarketVideoDetail = {
  id: string;
  title: string;
  description: string | null;
  hashtags: string | null;
  category: string;
  price: number;
  blurMode: string;
  voicePitch: string;
  videoUrl?: string;
  createdAt: string;
  seller: { userId: string; nickname: string };
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700', 집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700', 토론: 'bg-green-100 text-green-700', 외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) { return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); }

export default function MarketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<MarketVideoDetail | null>(null);
  const [canWatch, setCanWatch] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [purchasedBlurMode, setPurchasedBlurMode] = useState<string | null>(null);
  const [purchasedVoicePitch, setPurchasedVoicePitch] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const loadVideo = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/market/${params.id}`, { credentials: 'include' });
    if (res.status === 401) { router.replace('/?auth=login'); return; }
    const data = await res.json();
    if (!data.ok) { setLoading(false); return; }
    setVideo(data.video);
    setCanWatch(data.canWatch);
    setHasPurchased(data.hasPurchased);
    setIsSeller(data.isSeller);
    setPurchasedBlurMode(data.purchasedBlurMode ?? null);
    setPurchasedVoicePitch(data.purchasedVoicePitch ?? null);
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { loadVideo(); }, [loadVideo]);

  const handlePurchase = async () => {
    if (!video) return;
    setPurchasing(true); setPurchaseError(null);
    const res = await fetch(`/api/market/${video.id}/purchase`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (!data.ok) { setPurchaseError(data.error); setPurchasing(false); return; }
    await loadVideo();
    setPurchasing(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  if (!video) return <div className="flex items-center justify-center min-h-screen text-gray-400">영상을 찾을 수 없습니다.</div>;

  const tags = video.hashtags ? JSON.parse(video.hashtags) as string[] : [];
  const blurMode = (hasPurchased && purchasedBlurMode ? purchasedBlurMode : video.blurMode ?? 'none') as BlurMode;
  const voicePitch = (hasPurchased && purchasedVoicePitch ? purchasedVoicePitch : video.voicePitch ?? 'normal') as VoicePitch;

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/market" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
          면접 마켓
        </Link>
      </div>

      <div className="flex flex-col gap-6">
        {/* 영상 플레이어 */}
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-gray-900 shadow-sm relative">
          {canWatch ? (
            <>
              <PrivacyVideoPlayer src={video.videoUrl!} blurMode={blurMode} voicePitch={voicePitch} />
              {/* 프라이버시 안내 배지 */}
              {(blurMode !== 'none' || voicePitch !== 'normal') && (
                <div className="absolute top-3 right-3 flex gap-1.5 pointer-events-none">
                  {(blurMode === 'face' || blurMode === 'both') && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🫥 얼굴 블러</span>}
                  {(blurMode === 'background' || blurMode === 'both') && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🌫️ 배경 블러</span>}
                  {voicePitch !== 'normal' && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🔊 음성 변조</span>}
                </div>
              )}
            </>
          ) : (
            <div className="aspect-video flex flex-col items-center justify-center gap-4 bg-gray-900">
              <div className="rounded-full bg-gray-800 p-5">
                <svg className="h-10 w-10 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
              </div>
              <p className="text-gray-400 text-sm">구매 후 영상을 시청할 수 있습니다</p>
            </div>
          )}
        </div>

        {/* 메타 정보 + 구매 */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* 좌: 상세 정보 */}
          <div className="flex-1 flex flex-col gap-4">
            <div className="flex items-start gap-3 flex-wrap">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_COLORS[video.category] ?? 'bg-gray-100 text-gray-600'}`}>{video.category}면접</span>
              {(blurMode === 'face' || blurMode === 'both') && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">🫥 얼굴 블러</span>}
              {(blurMode === 'background' || blurMode === 'both') && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">🌫️ 배경 블러</span>}
              {voicePitch !== 'normal' && <span className="text-xs px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full font-medium">🔊 음성 변조</span>}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
            {video.description && <p className="text-sm text-gray-600 leading-relaxed">{video.description}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => <span key={i} className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full font-medium">#{tag}</span>)}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{video.seller.nickname[0]}</div>
              <span>{video.seller.nickname}</span>
              <span>·</span>
              <span>{formatDate(video.createdAt)}</span>
            </div>
          </div>

          {/* 우: 구매 카드 */}
          {!isSeller && (
            <div className="lg:w-64 rounded-2xl border border-gray-200 bg-white p-5 flex flex-col gap-4 h-fit shadow-sm">
              <div className="text-center">
                {video.price === 0
                  ? <p className="text-2xl font-black text-emerald-500">무료</p>
                  : <><p className="text-2xl font-black text-gray-900">{video.price}<span className="text-base font-semibold text-gray-400 ml-1">토큰</span></p><p className="text-xs text-gray-400 mt-0.5">판매자 수익 {Math.floor(video.price * 0.9)}T</p></>
                }
              </div>
              {canWatch ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 py-2.5 text-center text-sm font-semibold text-emerald-700">
                  {hasPurchased ? '✓ 구매 완료' : '✓ 내 영상'}
                </div>
              ) : (
                <>
                  <button
                    onClick={handlePurchase} disabled={purchasing}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 hover:-translate-y-0.5 hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}
                  >
                    {purchasing ? '구매 중...' : video.price === 0 ? '무료로 받기' : `${video.price}T로 구매하기`}
                  </button>
                  {purchaseError && <p className="text-xs text-rose-500 text-center">{purchaseError}</p>}
                  <p className="text-xs text-gray-400 text-center">구매 후 즉시 시청 가능합니다</p>
                </>
              )}
            </div>
          )}
          {isSeller && (
            <div className="lg:w-64 rounded-2xl border border-gray-200 bg-gray-50 p-5 flex flex-col gap-2 h-fit">
              <p className="text-sm font-semibold text-gray-600">내가 등록한 영상</p>
              <Link href={`/history/${video.id}`} className="text-xs text-violet-600 hover:underline">판매 설정 변경하기 →</Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
