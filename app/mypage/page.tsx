'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { type AuthUser, fetchCurrentUser } from '../lib/auth';
import { fetchBalance } from '../lib/billing';

type InterviewVideo = {
  id: string;
  title: string;
  category: string;
  videoUrl: string;
  createdAt: string;
};

type PurchaseItem = {
  id: string;
  pricePaid: number;
  createdAt: string;
  video: {
    id: string;
    title: string;
    category: string;
    seller: { nickname: string };
  };
};

type BalanceTransaction = {
  tokenTransactionId: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'bg-violet-100 text-violet-700',
  집단: 'bg-blue-100 text-blue-700',
  PT: 'bg-amber-100 text-amber-700',
  토론: 'bg-green-100 text-green-700',
  외국어: 'bg-rose-100 text-rose-700',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatAmount(value: number) {
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}T`;
}

export default function MyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [videos, setVideos] = useState<InterviewVideo[]>([]);
  const [purchases, setPurchases] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const user = await fetchCurrentUser();
        if (!user) {
          router.replace('/?auth=login');
          return;
        }

        const [balanceResult, videosRes, purchasesRes] = await Promise.all([
          fetchBalance(),
          fetch('/api/my-interviews', { credentials: 'include' }),
          fetch('/api/my-purchases', { credentials: 'include' }),
        ]);

        if (videosRes.status === 401 || purchasesRes.status === 401) {
          router.replace('/?auth=login');
          return;
        }

        const [videosData, purchasesData] = await Promise.all([videosRes.json(), purchasesRes.json()]);

        if (!videosData.ok) {
          throw new Error(videosData.error || '면접 이력을 불러오지 못했습니다.');
        }

        if (!purchasesData.ok) {
          throw new Error(purchasesData.error || '구매 목록을 불러오지 못했습니다.');
        }

        if (cancelled) {
          return;
        }

        setCurrentUser(user);
        setBalance(balanceResult.balance);
        setTransactions(balanceResult.transactions);
        setVideos(videosData.videos);
        setPurchases(purchasesData.purchases);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '마이페이지를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const latestVideos = useMemo(() => videos.slice(0, 3), [videos]);
  const latestPurchases = useMemo(() => purchases.slice(0, 3), [purchases]);
  const latestTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const displayName = currentUser?.nickname || currentUser?.userName || currentUser?.loginId || '회원';

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6">
      <section className="overflow-hidden rounded-3xl border border-violet-100 bg-white shadow-sm">
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-sky-500 px-6 py-8 text-white">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-100">My Page</p>
          <h1 className="mt-2 text-3xl font-black tracking-tight">내 정보와 활동 한눈에 보기</h1>
          <p className="mt-2 text-sm text-violet-100">
            보유 토큰, 최근 면접 기록, 구매 내역을 한 페이지에서 확인할 수 있습니다.
          </p>
        </div>

        <div className="px-6 py-6">
          {loading ? (
            <div className="rounded-2xl bg-violet-50 px-5 py-4 text-sm text-zinc-600">마이페이지를 불러오는 중입니다.</div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
                <div className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">회원 정보</p>
                  <div className="mt-4 flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-lg font-bold text-white">
                      {displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <p className="text-lg font-bold text-zinc-900">{displayName}</p>
                      <p className="text-sm text-zinc-500">{currentUser?.email ?? currentUser?.loginId}</p>
                    </div>
                  </div>
                </div>

                <StatCard label="보유 토큰" value={`${balance.toLocaleString()}T`} tone="amber" />
                <StatCard label="면접 이력" value={`${videos.length}개`} tone="violet" />
                <StatCard label="구매 내역" value={`${purchases.length}개`} tone="sky" />
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
                <section className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">최근 면접 이력</h2>
                      <p className="mt-1 text-sm text-zinc-500">최근 저장한 면접 영상입니다.</p>
                    </div>
                    <Link href="/history" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                      전체 보기
                    </Link>
                  </div>

                  {latestVideos.length === 0 ? (
                    <EmptyBlock
                      message="아직 저장된 면접 영상이 없습니다."
                      linkHref="/"
                      linkLabel="면접 시작하기"
                    />
                  ) : (
                    <div className="space-y-3">
                      {latestVideos.map((video) => (
                        <Link
                          key={video.id}
                          href={`/history/${video.id}`}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/60"
                        >
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[video.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                                {video.category}
                              </span>
                            </div>
                            <p className="truncate text-sm font-semibold text-zinc-900">{video.title}</p>
                            <p className="mt-1 text-xs text-zinc-400">{formatDate(video.createdAt)}</p>
                          </div>
                          <span className="text-sm font-medium text-violet-600">상세</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">최근 구매 내역</h2>
                      <p className="mt-1 text-sm text-zinc-500">구매한 면접 영상을 빠르게 확인합니다.</p>
                    </div>
                    <Link href="/market/purchases" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                      전체 보기
                    </Link>
                  </div>

                  {latestPurchases.length === 0 ? (
                    <EmptyBlock
                      message="아직 구매한 영상이 없습니다."
                      linkHref="/market"
                      linkLabel="마켓 둘러보기"
                    />
                  ) : (
                    <div className="space-y-3">
                      {latestPurchases.map((purchase) => (
                        <Link
                          key={purchase.id}
                          href={`/market/${purchase.video.id}`}
                          className="flex items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 transition hover:border-violet-200 hover:bg-violet-50/60"
                        >
                          <div className="min-w-0">
                            <div className="mb-1 flex items-center gap-2">
                              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[purchase.video.category] ?? 'bg-zinc-100 text-zinc-600'}`}>
                                {purchase.video.category}
                              </span>
                              <span className="text-xs font-semibold text-amber-600">
                                {purchase.pricePaid === 0 ? '무료' : `${purchase.pricePaid}T`}
                              </span>
                            </div>
                            <p className="truncate text-sm font-semibold text-zinc-900">{purchase.video.title}</p>
                            <p className="mt-1 text-xs text-zinc-400">
                              {purchase.video.seller.nickname} · {formatDate(purchase.createdAt)}
                            </p>
                          </div>
                          <span className="text-sm font-medium text-violet-600">보기</span>
                        </Link>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <section className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <h2 className="text-lg font-bold text-zinc-900">빠른 이동</h2>
                  <p className="mt-1 text-sm text-zinc-500">자주 쓰는 기능으로 바로 이동합니다.</p>
                  <div className="mt-4 grid gap-3">
                    <QuickLink href="/charge" title="토큰 충전" description="토스 결제로 토큰을 충전합니다." />
                    <QuickLink href="/history" title="면접 이력" description="저장된 면접 영상과 리포트를 확인합니다." />
                    <QuickLink href="/market/purchases" title="구매 목록" description="구매한 면접 영상을 다시 봅니다." />
                  </div>
                </section>

                <section className="rounded-3xl border border-zinc-200 bg-white p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-zinc-900">최근 토큰 변동</h2>
                      <p className="mt-1 text-sm text-zinc-500">충전과 사용 내역을 확인하세요.</p>
                    </div>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                      현재 {balance.toLocaleString()}T
                    </span>
                  </div>

                  {latestTransactions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400">
                      아직 토큰 변동 내역이 없습니다.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {latestTransactions.map((item) => (
                        <div key={item.tokenTransactionId} className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-900">
                              {item.description || item.transactionType}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">{formatDate(item.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatAmount(item.amount)}
                            </p>
                            <p className="mt-1 text-xs text-zinc-400">잔액 {item.balanceAfter.toLocaleString()}T</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'amber' | 'violet' | 'sky';
}) {
  const toneClass =
    tone === 'amber'
      ? 'from-amber-50 to-white text-amber-700 border-amber-100'
      : tone === 'sky'
        ? 'from-sky-50 to-white text-sky-700 border-sky-100'
        : 'from-violet-50 to-white text-violet-700 border-violet-100';

  return (
    <div className={`rounded-3xl border bg-gradient-to-br p-5 ${toneClass}`}>
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</p>
      <p className="mt-4 text-2xl font-black text-zinc-900">{value}</p>
    </div>
  );
}

function EmptyBlock({
  message,
  linkHref,
  linkLabel,
}: {
  message: string;
  linkHref: string;
  linkLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center">
      <p className="text-sm text-zinc-400">{message}</p>
      <Link href={linkHref} className="mt-3 inline-flex text-sm font-semibold text-violet-600 hover:text-violet-700">
        {linkLabel}
      </Link>
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-2xl border border-zinc-200 px-4 py-4 transition hover:border-violet-200 hover:bg-violet-50/60"
    >
      <p className="text-sm font-semibold text-zinc-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
    </Link>
  );
}
