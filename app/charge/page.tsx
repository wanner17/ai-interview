'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { type AuthUser, fetchCurrentUser } from '../lib/auth';
import {
  type ChargePackage,
  createChargeOrder,
  fetchBalance,
  fetchChargePackages,
  getChargeCustomerName,
} from '../lib/billing';

declare global {
  interface Window {
    TossPayments?: (clientKey: string) => {
      payment: (params: { customerKey: string }) => {
        requestPayment: (params: Record<string, unknown>) => Promise<void> | void;
      };
    };
  }
}

const CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || '';
const TOSS_SDK_SRC = 'https://js.tosspayments.com/v2/standard';

export default function ChargePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [packages, setPackages] = useState<ChargePackage[]>([]);
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<ChargePackage['packageId']>('starter');
  const [sdkReady, setSdkReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const user = await fetchCurrentUser();
        if (!user) {
          router.replace('/?auth=login');
          return;
        }

        const [packagesResult, balanceResult] = await Promise.all([
          fetchChargePackages(),
          fetchBalance(),
        ]);

        if (cancelled) {
          return;
        }

        setCurrentUser(user);
        setPackages(packagesResult.packages);
        setBalance(balanceResult.balance);
        if (packagesResult.packages.length > 0) {
          setSelectedPackageId(packagesResult.packages[0].packageId);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : '충전 정보를 불러오지 못했습니다.';
          setPageError(message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const selectedPackage = useMemo(
    () => packages.find((item) => item.packageId === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const handleStartPayment = async () => {
    setPageError(null);

    if (!currentUser) {
      router.replace('/?auth=login');
      return;
    }

    if (!CLIENT_KEY) {
      setPageError('NEXT_PUBLIC_TOSS_CLIENT_KEY 가 설정되지 않았습니다.');
      return;
    }

    if (!sdkReady || !window.TossPayments) {
      setPageError('토스 결제 SDK가 아직 준비되지 않았습니다.');
      return;
    }

    if (!selectedPackage) {
      setPageError('충전 상품을 선택해주세요.');
      return;
    }

    setIsPaying(true);

    try {
      const { order } = await createChargeOrder(selectedPackage.packageId);
      const tossPayments = window.TossPayments(CLIENT_KEY);
      const payment = tossPayments.payment({
        customerKey: order.customerKey,
      });

      await payment.requestPayment({
        method: 'CARD',
        amount: {
          currency: 'KRW',
          value: order.amount,
        },
        orderId: order.orderId,
        orderName: order.orderName,
        successUrl: `${window.location.origin}/charge/success`,
        failUrl: `${window.location.origin}/charge/fail`,
        customerEmail: order.customerEmail ?? undefined,
        customerName: getChargeCustomerName(currentUser),
        card: {
          useEscrow: false,
          flowMode: 'DEFAULT',
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : '결제 요청 중 오류가 발생했습니다.';
      setPageError(message);
      setIsPaying(false);
    }
  };

  return (
    <>
      <Script src={TOSS_SDK_SRC} strategy="afterInteractive" onLoad={() => setSdkReady(true)} />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-violet-500">Token Charge</p>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900">토큰 충전</h1>
          <p className="max-w-2xl text-sm leading-7 text-zinc-600">
            토스페이먼츠 결제창으로 충전 주문을 생성한 뒤, 결제 승인 완료 시 토큰이 지급됩니다.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-violet-100 bg-white/80 p-8 text-sm text-zinc-600 shadow-sm">
            충전 정보를 불러오는 중입니다.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="rounded-3xl border border-violet-100 bg-white/85 p-6 shadow-sm backdrop-blur">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-zinc-900">충전 상품 선택</h2>
                  <p className="mt-1 text-sm text-zinc-500">주문은 서버에서 먼저 생성되고, 성공 URL에서 최종 승인됩니다.</p>
                </div>
                <Link
                  href="/"
                  className="rounded-full border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:border-violet-200 hover:text-violet-700"
                >
                  메인으로
                </Link>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {packages.map((item) => {
                  const isSelected = item.packageId === selectedPackageId;
                  return (
                    <button
                      key={item.packageId}
                      type="button"
                      onClick={() => setSelectedPackageId(item.packageId)}
                      className={`rounded-3xl border p-5 text-left transition ${
                        isSelected
                          ? 'border-violet-500 bg-violet-50 shadow-lg shadow-violet-500/10'
                          : 'border-zinc-200 bg-white hover:border-violet-200 hover:bg-violet-50/60'
                      }`}
                    >
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-500">{item.packageId}</p>
                      <p className="mt-3 text-2xl font-black text-zinc-900">{item.tokenAmount.toLocaleString()} 토큰</p>
                      <p className="mt-2 text-sm text-zinc-500">{item.orderName}</p>
                      <p className="mt-5 text-lg font-bold text-zinc-800">{item.amountKrw.toLocaleString()}원</p>
                    </button>
                  );
                })}
              </div>
            </section>

            <aside className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-900 via-indigo-900 to-sky-900 p-6 text-white shadow-xl shadow-violet-900/10">
              <p className="text-sm font-semibold text-violet-200">결제 요약</p>
              <div className="mt-5 rounded-3xl bg-white/10 p-5 backdrop-blur">
                <p className="text-sm text-violet-100">현재 계정</p>
                <p className="mt-1 text-xl font-bold">{getChargeCustomerName(currentUser)}</p>
                <p className="mt-4 text-sm text-violet-100">현재 보유 토큰</p>
                <p className="mt-1 text-3xl font-black">{(balance ?? currentUser?.tokens ?? 0).toLocaleString()}</p>
              </div>

              <div className="mt-5 rounded-3xl border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-violet-100">선택 상품</p>
                <p className="mt-1 text-lg font-bold">{selectedPackage?.orderName ?? '상품 선택 필요'}</p>
                <p className="mt-4 text-sm text-violet-100">결제 금액</p>
                <p className="mt-1 text-2xl font-black">{selectedPackage ? `${selectedPackage.amountKrw.toLocaleString()}원` : '-'}</p>
                <p className="mt-4 text-sm text-violet-100">지급 토큰</p>
                <p className="mt-1 text-xl font-bold">{selectedPackage ? `+${selectedPackage.tokenAmount.toLocaleString()} 토큰` : '-'}</p>
              </div>

              <button
                type="button"
                onClick={handleStartPayment}
                disabled={isPaying || !sdkReady || !selectedPackage}
                className="mt-6 w-full rounded-2xl bg-white px-5 py-4 text-sm font-black text-violet-900 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isPaying ? '결제창 준비 중...' : '토스 결제창 열기'}
              </button>

              {!sdkReady && (
                <p className="mt-3 text-xs text-violet-100/80">SDK 로딩 중입니다.</p>
              )}
              {pageError && (
                <p className="mt-4 rounded-2xl border border-rose-200/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                  {pageError}
                </p>
              )}
            </aside>
          </div>
        )}
      </div>
    </>
  );
}
