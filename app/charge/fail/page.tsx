'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function ChargeFailPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get('code');
  const message = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-16 sm:px-6">
      <div className="rounded-[2rem] border border-rose-100 bg-white/90 p-8 shadow-sm backdrop-blur">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-rose-500">Charge Failed</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-zinc-900">결제가 완료되지 않았습니다</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-600">
          결제창에서 오류가 발생했거나 사용자가 결제를 중단했습니다. 에러 코드를 확인한 뒤 다시 시도하세요.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InfoCard label="에러 코드" value={code || '없음'} />
          <InfoCard label="주문번호" value={orderId || '없음'} />
        </div>

        <div className="mt-4 rounded-3xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">
          {message || '결제 요청이 취소되었거나 실패했습니다.'}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/charge"
            className="rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-bold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
          >
            다시 시도하기
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
