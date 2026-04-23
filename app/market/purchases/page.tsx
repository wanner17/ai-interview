'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type PurchaseItem = {
  id: string;
  pricePaid: number;
  createdAt: string;
  video: {
    id: string;
    title: string;
    category: string;
    blurMode: string;
    voicePitch: string;
    seller: { nickname: string };
  };
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700', 집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700', 토론: 'bg-green-100 text-green-700', 외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function PurchasesPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/my-purchases', { credentials: 'include' });
      if (res.status === 401) { router.replace('/?auth=login'); return; }
      const data = await res.json();
      if (data.ok) setPurchases(data.purchases);
      setLoading(false);
    }
    load();
  }, [router]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-6">
        <Link href="/market" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/></svg>
          면접 마켓
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">내 구매 목록</h1>
        <p className="text-gray-400 mt-1 text-sm">구매한 면접 영상을 다시 볼 수 있습니다</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24"><div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-200 border-t-violet-600"/></div>
      ) : purchases.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-20 text-center">
          <p className="text-gray-400 text-sm mb-3">아직 구매한 영상이 없습니다.</p>
          <Link href="/market" className="text-sm text-violet-600 hover:underline font-semibold">마켓 둘러보기 →</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {purchases.map(p => {
            const v = p.video;
            return (
              <Link key={p.id} href={`/market/${v.id}`}
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-5 py-4 hover:border-violet-300 hover:shadow-sm transition-all">
                <div className="w-12 h-12 rounded-xl bg-gray-900 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[v.category]??'bg-gray-100 text-gray-600'}`}>{v.category}</span>
                    {(v.blurMode==='face'||v.blurMode==='both')&&<span className="text-xs text-amber-500 font-medium">🫥 얼굴 블러</span>}
                    {(v.blurMode==='background'||v.blurMode==='both')&&<span className="text-xs text-amber-500 font-medium">🌫️ 배경 블러</span>}
                    {v.voicePitch!=='normal'&&<span className="text-xs text-amber-500 font-medium">🔊 음성 변조</span>}
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                  <p className="text-xs text-gray-400">{v.seller.nickname} · {formatDate(p.createdAt)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900">{p.pricePaid === 0 ? '무료' : `${p.pricePaid}T`}</p>
                  <p className="text-xs text-violet-500 font-medium mt-0.5">시청하기 →</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
