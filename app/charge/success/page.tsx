'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { confirmCharge } from '../../lib/billing';

export default function ChargeSuccessPage() {
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(true);
  const [result, setResult] = useState<{
    orderId: string;
    status: string;
    chargedTokens: number;
    balance: number | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function submit() {
      const paymentKey = searchParams.get('paymentKey');
      const orderId = searchParams.get('orderId');
      const amountParam = searchParams.get('amount');
      const amount = amountParam ? Number(amountParam) : NaN;

      if (!paymentKey || !orderId || Number.isNaN(amount)) {
        setError('결제 승인에 필요한 파라미터가 누락되었습니다.');
        setIsSubmitting(false);
        return;
      }

      try {
        const response = await confirmCharge(paymentKey, orderId, amount);
        if (!cancelled) {
          setResult(response);
        }
      } catch (submitError) {
        if (!cancelled) {
          const message =
            submitError instanceof Error ? submitError.message : '결제 승인 중 오류가 발생했습니다.';
          setError(message);
        }
      } finally {
        if (!cancelled) {
          setIsSubmitting(false);
        }
      }
    }

    submit();

    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="rounded-[2rem] border border-violet-100 bg-white/90 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Charge Success</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">결제 승인 결과</h1>

        {isSubmitting && (
          <p className="mt-6 text-sm leading-7 text-zinc-600">결제 승인 API를 호출하고 토큰 적립을 처리하는 중입니다.</p>
        )}

        {error && (
          <div className="mt-6 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <InfoCard label="주문번호" value={result.orderId} />
            <InfoCard label="주문상태" value={result.status} />
            <InfoCard label="지급 토큰" value={`${result.chargedTokens.toLocaleString()} 토큰`} />
            <InfoCard label="현재 잔액" value={result.balance !== null ? `${result.balance.toLocaleString()} 토큰` : '조회 불가'} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/charge"
            className="rounded-2xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-bold text-violet-700 transition hover:border-violet-300 hover:bg-violet-100"
          >
            다시 충전하기
          </Link>
          <Link
            href="/"
            className="rounded-2xl border border-zinc-200 px-5 py-3 text-sm font-bold text-zinc-600 transition hover:border-violet-200 hover:text-violet-700"
          >
            메인으로
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-3 break-all text-lg font-bold text-zinc-900">{value}</p>
    </div>
  );
}
