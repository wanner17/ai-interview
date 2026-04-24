'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
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
  clipStart?: number | null;
  clipEnd?: number | null;
  videoUrl?: string;
  viewCount: number;
  createdAt: string;
  seller: { userId: string; nickname: string };
};

type Review = {
  id: string;
  userId: string;
  nickname: string;
  rating: number;
  body: string;
  createdAt: string;
};

function fmtDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700', 집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700', 토론: 'bg-green-100 text-green-700', 외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) { return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }); }

function StarRow({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
          className={`text-xl leading-none transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer'} ${(hover || value) >= star ? 'text-amber-400' : 'text-gray-300'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function MarketDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [video, setVideo] = useState<MarketVideoDetail | null>(null);
  const [canWatch, setCanWatch] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const [purchasedBlurMode, setPurchasedBlurMode] = useState<string | null>(null);
  const [purchasedVoicePitch, setPurchasedVoicePitch] = useState<string | null>(null);
  const [purchasedClipStart, setPurchasedClipStart] = useState<number | null>(null);
  const [purchasedClipEnd, setPurchasedClipEnd] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const viewIncremented = useRef(false);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [myReview, setMyReview] = useState<Review | null>(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState(false);

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
    setPurchasedClipStart(data.purchasedClipStart ?? null);
    setPurchasedClipEnd(data.purchasedClipEnd ?? null);
    setLoading(false);
  }, [params.id, router]);

  const loadReviews = useCallback(async () => {
    const res = await fetch(`/api/market/${params.id}/reviews`, { credentials: 'include' });
    const data = await res.json();
    if (!data.ok) return;
    setReviews(data.reviews);
    setAvgRating(data.avgRating);
    if (data.myReview) {
      setMyReview(data.myReview);
      setReviewRating(data.myReview.rating);
      setReviewBody(data.myReview.body);
    }
  }, [params.id]);

  useEffect(() => { loadVideo(); }, [loadVideo]);
  useEffect(() => { loadReviews(); }, [loadReviews]);
  useEffect(() => {
    if (viewIncremented.current) return;
    viewIncremented.current = true;
    fetch(`/api/market/${params.id}/view`, { method: 'POST' }).catch(() => {});
  }, [params.id]);

  const handlePurchase = async () => {
    if (!video) return;
    setPurchasing(true); setPurchaseError(null);
    const res = await fetch(`/api/market/${video.id}/purchase`, { method: 'POST', credentials: 'include' });
    const data = await res.json();
    if (!data.ok) { setPurchaseError(data.error); setPurchasing(false); return; }
    await loadVideo();
    setPurchasing(false);
  };

  const handleSubmitReview = async () => {
    if (!reviewRating) { setReviewError('별점을 선택해주세요.'); return; }
    if (!reviewBody.trim()) { setReviewError('댓글 내용을 입력해주세요.'); return; }
    setReviewSubmitting(true); setReviewError(null);
    const res = await fetch(`/api/market/${params.id}/reviews`, {
      method: 'POST', credentials: 'include',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rating: reviewRating, body: reviewBody.trim() }),
    });
    const data = await res.json();
    if (!data.ok) { setReviewError(data.error); setReviewSubmitting(false); return; }
    setEditingReview(false);
    await loadReviews();
    setReviewSubmitting(false);
  };

  const handleDeleteReview = async () => {
    if (!myReview) return;
    if (!confirm('리뷰를 삭제하시겠습니까?')) return;
    await fetch(`/api/market/${params.id}/reviews/${myReview.id}`, { method: 'DELETE', credentials: 'include' });
    setMyReview(null);
    setReviewRating(5);
    setReviewBody('');
    setEditingReview(false);
    await loadReviews();
  };

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600" /></div>;
  if (!video) return <div className="flex items-center justify-center min-h-screen text-gray-400">영상을 찾을 수 없습니다.</div>;

  const tags = video.hashtags ? JSON.parse(video.hashtags) as string[] : [];
  const blurMode = (hasPurchased && purchasedBlurMode ? purchasedBlurMode : video.blurMode ?? 'none') as BlurMode;
  const voicePitch = (hasPurchased && purchasedVoicePitch ? purchasedVoicePitch : video.voicePitch ?? 'normal') as VoicePitch;

  const canWriteReview = hasPurchased && !isSeller;
  const showReviewForm = canWriteReview && (!myReview || editingReview);

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
              <PrivacyVideoPlayer
                src={video.videoUrl!}
                blurMode={blurMode}
                voicePitch={voicePitch}
                clipStart={(hasPurchased ? purchasedClipStart : video.clipStart) ?? undefined}
                clipEnd={(hasPurchased ? purchasedClipEnd : video.clipEnd) ?? undefined}
              />
              {(() => {
                const cs = (hasPurchased ? purchasedClipStart : video.clipStart);
                const ce = (hasPurchased ? purchasedClipEnd : video.clipEnd);
                return (blurMode !== 'none' || voicePitch !== 'normal' || (cs != null && ce != null)) && (
                  <div className="absolute top-3 right-3 flex gap-1.5 pointer-events-none flex-wrap justify-end">
                    {(blurMode === 'face' || blurMode === 'both') && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🫥 얼굴 블러</span>}
                    {(blurMode === 'background' || blurMode === 'both') && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🌫️ 배경 블러</span>}
                    {voicePitch !== 'normal' && <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">🔊 음성 변조</span>}
                    {cs != null && ce != null && (
                      <span className="text-xs px-2 py-1 bg-black/60 text-white rounded-full font-medium">✂️ {fmtDuration(ce - cs)} 구간</span>
                    )}
                  </div>
                );
              })()}
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
              {(() => {
                const cs = (hasPurchased ? purchasedClipStart : video.clipStart);
                const ce = (hasPurchased ? purchasedClipEnd : video.clipEnd);
                return cs != null && ce != null && (
                  <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">✂️ {fmtDuration(ce - cs)} 구간 판매</span>
                );
              })()}
            </div>
            <h1 className="text-xl font-bold text-gray-900">{video.title}</h1>
            {avgRating !== null && (
              <div className="flex items-center gap-2">
                <StarRow value={Math.round(avgRating)} readonly />
                <span className="text-sm font-semibold text-amber-500">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({reviews.length}개 리뷰)</span>
              </div>
            )}
            {video.description && <p className="text-sm text-gray-600 leading-relaxed">{video.description}</p>}
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag, i) => <span key={i} className="text-xs px-2 py-1 bg-violet-50 text-violet-600 rounded-full font-medium">#{tag}</span>)}
              </div>
            )}
            <div className="flex items-center gap-2 text-sm text-gray-400 flex-wrap">
              <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{video.seller.nickname[0]}</div>
              <span>{video.seller.nickname}</span>
              <span>·</span>
              <span>{formatDate(video.createdAt)}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
                {(video.viewCount ?? 0).toLocaleString()}
              </span>
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

        {/* 리뷰 섹션 */}
        <div className="border-t border-gray-100 pt-6 flex flex-col gap-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">
              리뷰 {reviews.length > 0 && <span className="text-gray-400 font-normal text-sm ml-1">{reviews.length}개</span>}
            </h2>
            {canWriteReview && myReview && !editingReview && (
              <button onClick={() => setEditingReview(true)} className="text-xs text-violet-600 hover:underline">수정하기</button>
            )}
          </div>

          {/* 리뷰 작성 폼 (구매자만) */}
          {showReviewForm && (
            <div className="rounded-2xl border border-violet-100 bg-violet-50/40 p-4 flex flex-col gap-3">
              <p className="text-sm font-semibold text-gray-700">{myReview ? '리뷰 수정' : '리뷰 작성'}</p>
              <div className="flex items-center gap-2">
                <StarRow value={reviewRating} onChange={setReviewRating} />
                <span className="text-sm text-gray-500">{reviewRating}점</span>
              </div>
              <textarea
                value={reviewBody}
                onChange={e => setReviewBody(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="이 영상에 대한 솔직한 리뷰를 남겨주세요."
                className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{reviewBody.length}/500</span>
                <div className="flex gap-2">
                  {editingReview && (
                    <button onClick={() => { setEditingReview(false); setReviewBody(myReview?.body ?? ''); setReviewRating(myReview?.rating ?? 5); }} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">취소</button>
                  )}
                  <button
                    onClick={handleSubmitReview} disabled={reviewSubmitting}
                    className="px-4 py-1.5 text-xs rounded-lg text-white font-semibold disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg,#7c3aed,#6366f1)' }}
                  >
                    {reviewSubmitting ? '저장 중...' : '저장'}
                  </button>
                </div>
              </div>
              {reviewError && <p className="text-xs text-rose-500">{reviewError}</p>}
            </div>
          )}

          {canWriteReview && !myReview && !showReviewForm && (
            <p className="text-xs text-gray-400">구매한 영상에만 리뷰를 작성할 수 있습니다.</p>
          )}

          {/* 리뷰 목록 */}
          {reviews.length === 0 ? (
            <p className="text-sm text-gray-400">아직 리뷰가 없습니다. 첫 번째 리뷰를 남겨보세요!</p>
          ) : (
            <div className="flex flex-col gap-3">
              {reviews.map(r => (
                <div key={r.id} className="rounded-xl border border-gray-100 bg-white p-4 flex flex-col gap-1.5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">{r.nickname[0]}</div>
                      <span className="text-sm font-medium text-gray-700">{r.nickname}</span>
                      <StarRow value={r.rating} readonly />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                      {myReview?.id === r.id && (
                        <button onClick={handleDeleteReview} className="text-xs text-rose-400 hover:text-rose-600">삭제</button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{r.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
