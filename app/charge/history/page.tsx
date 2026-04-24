'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchCurrentUser } from '../../lib/auth';
import { fetchBalance } from '../../lib/billing';

type BalanceTransaction = {
  cashTransactionId: string;
  transactionType: string;
  amount: number;
  balanceAfter: number;
  description: string | null;
  createdAt: string;
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
  return `${value > 0 ? '+' : ''}${value.toLocaleString()}C`;
}

export default function ChargeHistoryPage() {
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
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

        const balanceResult = await fetchBalance();

        if (cancelled) {
          return;
        }

        setBalance(balanceResult.cashBalance);
        setTransactions(balanceResult.cashTransactions);
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : '캐시 내역을 불러오지 못했습니다.');
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
      <section className="rounded-[24px] border border-stone-200 bg-white p-6 sm:p-8">
        <div className="flex flex-col gap-3 border-b border-stone-100 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-stone-400">Cash History</p>
            <h1 className="mt-3 text-3xl font-black tracking-[-0.04em] text-zinc-950">캐시 전체 내역</h1>
            <p className="mt-2 text-sm text-stone-500">충전과 사용 기록, 각 시점의 캐시 잔액을 확인할 수 있습니다.</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-sm font-semibold text-stone-600">
              현재 {balance.toLocaleString()}C
            </span>
            <Link
              href="/charge"
              className="rounded-full border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-300 hover:text-zinc-900"
            >
              충전하기
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="mt-6 rounded-[16px] bg-stone-50 px-5 py-4 text-sm text-stone-600">캐시 내역을 불러오는 중입니다.</div>
        ) : error ? (
          <div className="mt-6 rounded-[16px] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
        ) : transactions.length === 0 ? (
          <div className="mt-6 rounded-[16px] border border-dashed border-stone-200 bg-stone-50 px-5 py-12 text-center text-sm text-stone-500">
            아직 캐시 변동 내역이 없습니다.
          </div>
        ) : (
          <div className="mt-6 grid gap-3">
            {transactions.map((item) => (
              <div key={item.cashTransactionId} className="rounded-[16px] border border-stone-200 bg-stone-50 px-4 py-4 sm:px-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900">
                      {item.description || item.transactionType}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">{formatDate(item.createdAt)}</p>
                  </div>
                  <div className="shrink-0 text-left sm:text-right">
                    <p className={`text-sm font-bold ${item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatAmount(item.amount)}
                    </p>
                    <p className="mt-1 text-xs text-stone-400">잔액 {item.balanceAfter.toLocaleString()}C</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
