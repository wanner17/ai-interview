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
    seller?: { nickname?: string | null } | null;
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
  개인: 'bg-stone-100 text-stone-700',
  집단: 'bg-slate-100 text-slate-700',
  PT: 'bg-amber-100/80 text-amber-800',
  토론: 'bg-emerald-100/80 text-emerald-800',
  외국어: 'bg-rose-100/80 text-rose-800',
};

function formatDate(iso: string) {
  if (!iso) {
    return '날짜 정보 없음';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return '날짜 정보 없음';
  }

  return date.toLocaleDateString('ko-KR', {
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

function normalizePurchases(input: unknown): PurchaseItem[] {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
    .map((item) => {
      const rawVideo = item.video;
      const video = rawVideo && typeof rawVideo === 'object' ? (rawVideo as Record<string, unknown>) : {};
      const seller = video.seller && typeof video.seller === 'object'
        ? (video.seller as Record<string, unknown>)
        : null;

      return {
        id: typeof item.id === 'string' ? item.id : '',
        pricePaid:
          typeof item.pricePaid === 'number'
            ? item.pricePaid
            : typeof item.pricePaid === 'string'
              ? Number(item.pricePaid) || 0
              : 0,
        createdAt: typeof item.createdAt === 'string' ? item.createdAt : '',
        video: {
          id: typeof video.id === 'string' ? video.id : '',
          title: typeof video.title === 'string' ? video.title : '제목 없음',
          category: typeof video.category === 'string' ? video.category : '기타',
          seller: seller
            ? {
                nickname: typeof seller.nickname === 'string' ? seller.nickname : null,
              }
            : null,
        },
      };
    })
    .filter((item) => item.id && item.video.id);
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
        setPurchases(normalizePurchases(purchasesData.purchases));
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
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:gap-8 lg:py-12">
      {loading ? (
        <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-8">
          <div className="rounded-[16px] bg-stone-50 px-5 py-4 text-sm text-stone-600">마이페이지를 불러오는 중입니다.</div>
        </section>
      ) : error ? (
        <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-8">
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[24px] border border-stone-200 bg-white">
            <div className="grid gap-8 px-6 py-7 sm:px-8 sm:py-8 xl:grid-cols-[1.15fr_0.9fr] xl:gap-8 xl:px-10 xl:py-10">
              <div className="min-w-0">
                <p className="ui-kicker">My Page</p>
                <div className="mt-6 flex items-start gap-5">
                  <span className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-[20px] bg-zinc-900 text-[30px] font-black text-white">
                    {displayName.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h1 className="ui-title truncate text-[34px] sm:text-[40px]">
                      {displayName}
                    </h1>
                    <p className="mt-2 truncate text-sm text-stone-500">{currentUser?.email ?? currentUser?.loginId}</p>
                    <p className="ui-copy mt-5 max-w-xl">
                      계정 정보와 최근 활동을 한 곳에서 확인할 수 있습니다.
                    </p>
                  </div>
                </div>

                <div className="mt-8 grid gap-3 sm:grid-cols-3">
                  <StatCard label="보유 토큰" value={`${balance.toLocaleString()}T`} tone="amber" />
                  <StatCard label="면접 이력" value={`${videos.length}개`} tone="violet" />
                  <StatCard label="구매 내역" value={`${purchases.length}개`} tone="sky" />
                </div>
              </div>

              <div className="grid gap-4">
                <section className="rounded-[20px] border border-stone-200 bg-stone-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="ui-kicker">Current Balance</p>
                      <p className="ui-number mt-4 text-[38px]">{balance.toLocaleString()}T</p>
                    </div>
                    <div className="rounded-full border border-stone-300 bg-white px-3 py-1 text-xs font-semibold text-stone-600">
                      사용 가능
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-stone-500">
                    토큰 사용 내역은 아래에서 확인할 수 있습니다.
                  </p>
                </section>

                <section className="rounded-[20px] border border-stone-200 bg-white p-5">
                  <SectionHeader title="바로가기" />
                  <div className="mt-4 grid gap-3">
                    <QuickLink href="/charge" title="토큰 충전" description="토큰 잔액을 충전합니다." />
                    <QuickLink href="/history" title="면접 이력" description="저장한 영상과 리포트를 봅니다." />
                    <QuickLink href="/market/purchases" title="구매 목록" description="구매한 영상을 다시 확인합니다." />
                  </div>
                </section>
              </div>
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1fr_0.92fr]">
            <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-7">
              <SectionHeader title="최근 면접 이력" href="/history" hrefLabel="전체 보기" />
              <div className="mt-5 grid gap-3">
                {latestVideos.length === 0 ? (
                  <EmptyBlock message="아직 저장된 면접 영상이 없습니다." linkHref="/" linkLabel="면접 시작하기" />
                ) : (
                  latestVideos.map((video) => (
                    <ActivityLink
                      key={video.id}
                      href={`/history/${video.id}`}
                      category={video.category}
                      title={video.title}
                      meta={formatDate(video.createdAt)}
                      ctaLabel="상세"
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-7">
              <SectionHeader title="최근 구매 내역" href="/market/purchases" hrefLabel="전체 보기" />
              <div className="mt-5 grid gap-3">
                {latestPurchases.length === 0 ? (
                  <EmptyBlock message="아직 구매한 영상이 없습니다." linkHref="/market" linkLabel="마켓 둘러보기" />
                ) : (
                  latestPurchases.map((purchase) => (
                    <ActivityLink
                      key={purchase.id}
                      href={`/market/${purchase.video.id}`}
                      category={purchase.video.category}
                      title={purchase.video.title}
                      meta={`${purchase.video.seller?.nickname || '판매자'} · ${formatDate(purchase.createdAt)}`}
                      ctaLabel="보기"
                      trailing={purchase.pricePaid === 0 ? '무료' : `${purchase.pricePaid}T`}
                    />
                  ))
                )}
              </div>
            </section>

            <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-7">
              <div className="flex items-start justify-between gap-4 border-b border-stone-100 pb-4">
                <SectionHeader title="최근 토큰 변동" href="/charge/history" hrefLabel="전체 보기" />
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-semibold text-stone-600">
                  현재 {balance.toLocaleString()}T
                </span>
              </div>

              <div className="mt-5 grid gap-3">
                {latestTransactions.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-stone-200 px-4 py-10 text-center text-sm text-stone-400">
                    아직 토큰 변동 내역이 없습니다.
                  </div>
                ) : (
                  latestTransactions.map((item) => (
                    <div
                      key={item.tokenTransactionId}
                      className="rounded-[16px] border border-stone-200 bg-stone-50 px-4 py-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-zinc-900">
                            {item.description || item.transactionType}
                          </p>
                          <p className="mt-1 text-xs text-stone-400">{formatDate(item.createdAt)}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className={`text-sm font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {formatAmount(item.amount)}
                          </p>
                          <p className="mt-1 text-xs text-stone-400">잔액 {item.balanceAfter.toLocaleString()}T</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </section>
        </>
      )}
    </main>
  );
}

function SectionHeader({
  title,
  href,
  hrefLabel,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="ui-section-title">{title}</h2>
      {href && hrefLabel ? (
        <Link href={href} className="text-sm font-medium text-stone-500 transition hover:text-zinc-900">
          {hrefLabel}
        </Link>
      ) : null}
    </div>
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
      ? 'border-stone-200 bg-stone-50 text-zinc-700'
      : tone === 'sky'
        ? 'border-stone-200 bg-stone-50 text-zinc-700'
        : 'border-stone-200 bg-stone-50 text-zinc-700';

  return (
    <div className={`rounded-[16px] border px-5 py-5 ${toneClass}`}>
      <p className="ui-label">{label}</p>
      <p className="ui-number mt-4 text-[28px] sm:text-[30px]">{value}</p>
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
    <div className="rounded-[16px] border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center">
      <p className="text-sm text-stone-400">{message}</p>
      <Link href={linkHref} className="mt-3 inline-flex text-sm font-medium text-stone-700 hover:text-zinc-900">
        {linkLabel}
      </Link>
    </div>
  );
}

function ActivityLink({
  href,
  category,
  title,
  meta,
  ctaLabel,
  trailing,
}: {
  href: string;
  category: string;
  title: string;
  meta: string;
  ctaLabel: string;
  trailing?: string;
}) {
  return (
    <Link
      href={href}
      className="group block rounded-[16px] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CATEGORY_COLORS[category] ?? 'bg-zinc-100 text-zinc-600'}`}
            >
              {category || '기타'}
            </span>
            {trailing ? <span className="text-xs font-medium text-stone-500">{trailing}</span> : null}
          </div>
          <p className="text-[15px] font-semibold leading-6 text-zinc-900">{title || '제목 없음'}</p>
          <p className="mt-1 text-xs text-stone-400">{meta}</p>
        </div>
        <span className="shrink-0 text-sm font-medium text-stone-400 transition group-hover:text-zinc-700">
          {ctaLabel}
        </span>
      </div>
    </Link>
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
      className="rounded-[16px] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-semibold leading-6 text-zinc-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
        </div>
        <span className="text-sm font-medium text-stone-400">→</span>
      </div>
    </Link>
  );
}
