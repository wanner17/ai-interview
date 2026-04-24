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
  cashTransactionId: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
};

const CATEGORY_COLORS: Record<string, string> = {
  개인: 'border-stone-200 bg-stone-50 text-stone-700',
  집단: 'border-stone-200 bg-stone-50 text-stone-700',
  PT: 'border-stone-200 bg-stone-50 text-stone-700',
  토론: 'border-stone-200 bg-stone-50 text-stone-700',
  외국어: 'border-stone-200 bg-stone-50 text-stone-700',
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
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}C`;
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
  const [cashBalance, setCashBalance] = useState<number>(0);
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
        setCashBalance(balanceResult.cashBalance);
        setTransactions(balanceResult.cashTransactions);
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
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-6 sm:px-6 sm:py-8">
      {loading ? (
        <section className="rounded-[16px] border border-stone-200 bg-white p-6">
          <div className="rounded-[16px] bg-stone-50 px-5 py-4 text-sm text-stone-600">마이페이지를 불러오는 중입니다.</div>
        </section>
      ) : error ? (
        <section className="rounded-[16px] border border-stone-200 bg-white p-6">
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        </section>
      ) : (
        <>
          <section className="overflow-hidden rounded-[16px] border border-violet-100/80 bg-white">
            <div className="bg-[linear-gradient(180deg,#faf8ff_0%,#ffffff_100%)] px-5 py-6 sm:px-6">
              <p className="text-[28px] font-bold tracking-[-0.03em] text-zinc-950">MY</p>
              <div className="mt-5 flex items-start gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#18181b_0%,#3f3f46_100%)] text-xl font-bold text-white shadow-[0_8px_18px_rgba(24,24,27,0.14)]">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="text-base font-semibold text-zinc-950">{displayName}</p>
                  <p className="mt-1 text-sm text-stone-500">{currentUser?.loginId}</p>
                  <p className="mt-0.5 text-sm text-stone-500">{currentUser?.email ?? '이메일 정보 없음'}</p>
                </div>
              </div>
            </div>

            <div className="grid border-t border-violet-100/80 md:grid-cols-4">
              <StatCard label="보유 캐시" value={`${cashBalance.toLocaleString()}C`} tone="amber" />
              <StatCard label="보유 토큰" value={`${currentUser?.tokens?.toLocaleString() ?? 0}T`} tone="emerald" />
              <StatCard label="면접 이력" value={`${videos.length}개`} tone="violet" />
              <StatCard label="구매 내역" value={`${purchases.length}개`} tone="sky" />
            </div>
            <div className="border-t border-violet-100/80 bg-violet-50/30 px-4 py-4 sm:px-6">
              <div className="grid gap-2 sm:grid-cols-3">
                <ActionButton href="/charge" title="캐시 충전" meta="유상 캐시 충전" />
                <ActionButton href="/history" title="면접 이력" meta="저장 영상 확인" />
                <ActionButton href="/attendance" title="출석체크" meta="하루 1회 1토큰 받기" />
                <ActionButton href="/market/purchases" title="구매 목록" meta="구매 영상 보기" />
              </div>
            </div>
          </section>

          <section className="rounded-[16px] border border-stone-200 bg-white">
            <SectionBlock title="최근 구매 내역" href="/market/purchases" hrefLabel="전체 보기">
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
                    ctaLabel={purchase.pricePaid === 0 ? '무료' : `${purchase.pricePaid} 사용`}
                  />
                ))
              )}
            </SectionBlock>
          </section>

          <section className="rounded-[16px] border border-stone-200 bg-white">
            <SectionBlock title="최근 면접 이력" href="/history" hrefLabel="전체 보기">
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
            </SectionBlock>
          </section>

          <section className="rounded-[16px] border border-stone-200 bg-white">
            <SectionBlock
              title="최근 캐시 변동"
              href="/charge/history"
              hrefLabel="전체 보기"
              extra={
                <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600">
                  현재 {cashBalance.toLocaleString()}C
                </span>
              }
            >
              {latestTransactions.length === 0 ? (
                <div className="px-5 py-10 text-center text-sm text-stone-400">아직 캐시 변동 내역이 없습니다.</div>
              ) : (
                latestTransactions.map((item) => (
                  <TransactionRow
                    key={item.cashTransactionId}
                    title={item.description || item.transactionType}
                    date={formatDate(item.createdAt)}
                    amount={formatAmount(item.amount)}
                    balanceAfter={item.balanceAfter}
                    positive={item.amount >= 0}
                  />
                ))
              )}
            </SectionBlock>
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
  extra,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-amber-400" />
        <h2 className="ui-section-title">{title}</h2>
        {extra ?? null}
      </div>
      {href && hrefLabel ? (
        <Link href={href} className="text-sm font-medium text-stone-500 transition hover:text-zinc-900">
          {hrefLabel}
        </Link>
      ) : null}
    </div>
  );
}

function SectionBlock({
  title,
  href,
  hrefLabel,
  children,
  extra,
}: {
  title: string;
  href?: string;
  hrefLabel?: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <>
      <div className="border-b border-violet-100/80 bg-violet-50/30 px-5 py-4">
        <SectionHeader title={title} href={href} hrefLabel={hrefLabel} extra={extra} />
      </div>
      <div>{children}</div>
    </>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'amber' | 'emerald' | 'violet' | 'sky';
}) {
  const toneClass =
    tone === 'amber'
      ? 'border-violet-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] text-zinc-700'
      : tone === 'emerald'
        ? 'border-violet-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#f5fff8_100%)] text-zinc-700'
      : tone === 'sky'
        ? 'border-violet-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] text-zinc-700'
        : 'border-violet-100/80 bg-[linear-gradient(180deg,#ffffff_0%,#fbfaff_100%)] text-zinc-700';

  return (
    <div className={`relative px-5 py-5 md:border-r ${toneClass} md:last:border-r-0`}>
      <span className="absolute left-5 top-0 h-[2px] w-10 rounded-full bg-zinc-900/75" />
      <p className="ui-label">{label}</p>
      <p className="ui-number mt-5 text-[28px] sm:text-[30px]">{value}</p>
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
    <div className="px-5 py-10 text-center">
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
      className="group flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 transition hover:bg-stone-50/80 last:border-b-0"
    >
      <div className="min-w-0">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium ${CATEGORY_COLORS[category] ?? 'border-stone-200 bg-stone-50 text-stone-700'}`}
          >
            {category || '기타'}
          </span>
          {trailing ? <span className="text-xs font-medium text-stone-500">{trailing}</span> : null}
        </div>
        <p className="truncate text-[15px] font-medium leading-6 text-zinc-900">{title || '제목 없음'}</p>
        <p className="mt-1 text-xs text-stone-400">{meta}</p>
      </div>
      <span className="shrink-0 text-sm font-medium text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-zinc-700">
        {ctaLabel}
      </span>
    </Link>
  );
}

function TransactionRow({
  title,
  date,
  amount,
  balanceAfter,
  positive,
}: {
  title: string;
  date: string;
  amount: string;
  balanceAfter: number;
  positive: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-stone-200 px-5 py-4 last:border-b-0">
      <div className="min-w-0">
        <p className="truncate text-[15px] font-medium text-zinc-900">{title}</p>
        <p className="mt-1 text-xs text-stone-400">{date}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`text-sm font-semibold ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>{amount}</p>
        <p className="mt-1 text-xs text-stone-400">잔액 {balanceAfter.toLocaleString()}C</p>
      </div>
    </div>
  );
}

function ActionButton({
  href,
  title,
  meta,
}: {
  href: string;
  title: string;
  meta: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-[12px] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <p className="text-[15px] font-medium text-zinc-900">{title}</p>
      <p className="mt-1 text-xs text-stone-500">{meta}</p>
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
      className="rounded-[12px] border border-stone-200 bg-white px-4 py-4 transition hover:border-stone-300 hover:bg-stone-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[15px] font-medium leading-6 text-zinc-900">{title}</p>
          <p className="mt-1 text-sm leading-6 text-stone-500">{description}</p>
        </div>
        <span className="text-sm font-medium text-stone-400">→</span>
      </div>
    </Link>
  );
}
