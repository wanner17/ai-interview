import { type AuthUser } from './auth';

const API_BASE = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.error || payload.message || '요청 처리에 실패했습니다.');
  }
  return payload;
}

export type ChargePackage = {
  packageId: 'starter' | 'standard' | 'pro';
  amountKrw: number;
  cashAmount: number;
  orderName: string;
};

export type ChargeOrder = {
  orderId: string;
  orderName: string;
  amount: number;
  cashAmount: number;
  customerKey: string;
  customerName: string;
  customerEmail: string | null;
};

export async function fetchChargePackages() {
  const response = await fetch(`${API_BASE}/billing/packages`, {
    credentials: 'include',
  });
  const data = await parseResponse(response);
  return data as { ok: true; packages: ChargePackage[] };
}

export async function createChargeOrder(packageId: ChargePackage['packageId']) {
  const response = await fetch(`${API_BASE}/billing/orders/charge`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ packageId }),
  });

  const data = await parseResponse(response);
  return data as { ok: true; order: ChargeOrder; packages: ChargePackage[] };
}

export async function confirmCharge(paymentKey: string, orderId: string, amount: number) {
  const response = await fetch(`${API_BASE}/billing/orders/confirm`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });

  const data = await parseResponse(response);
  return data as {
    ok: true;
    orderId: string;
    status: string;
    chargedCash: number;
    cashBalance: number | null;
  };
}

export async function fetchBalance() {
  const response = await fetch(`${API_BASE}/billing/balance`, {
    credentials: 'include',
  });
  const data = await parseResponse(response);
  return data as {
    ok: true;
    cashBalance: number;
    tokenBalance: number;
    cashTransactions: Array<{
      cashTransactionId: string;
      transactionType: string;
      amount: number;
      balanceAfter: number;
      description: string | null;
      createdAt: string;
    }>;
    tokenTransactions: Array<{
      tokenTransactionId: string;
      transactionType: string;
      amount: number;
      balanceAfter: number;
      description: string | null;
      createdAt: string;
    }>;
  };
}

export function getChargeCustomerName(user: AuthUser | null) {
  return user?.userName || user?.nickname || user?.loginId || '회원';
}
