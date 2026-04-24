import { randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { billingRepository } from '../repositories/billing.repository';
import { userRepository } from '../repositories/user.repository';
import type {
  ChargePackage,
  ChargePackageId,
  ConfirmChargeRequest,
  CreateChargeOrderRequest,
  TossConfirmRequest,
  TossPayment,
  TossWebhookPayload,
} from '../types/billing.type';

const TOSS_API_BASE_URL = 'https://api.tosspayments.com/v1/payments';
const PAYMENT_PROVIDER = 'TOSS_PAYMENTS';
const ORDER_TYPE_CHARGE = 'CASH_CHARGE';
const STATUS_PENDING = 'PENDING';
const STATUS_PAID = 'PAID';
const STATUS_FAILED = 'FAILED';
const STATUS_CANCELED = 'CANCELED';
const STATUS_READY = 'READY';

const CHARGE_PACKAGES: Record<ChargePackageId, ChargePackage> = {
  starter: {
    packageId: 'starter',
    amountKrw: 5500,
    cashAmount: 50,
    orderName: '캐시 50 충전',
  },
  standard: {
    packageId: 'standard',
    amountKrw: 11000,
    cashAmount: 110,
    orderName: '캐시 110 충전',
  },
  pro: {
    packageId: 'pro',
    amountKrw: 33000,
    cashAmount: 350,
    orderName: '캐시 350 충전',
  },
};

class BillingError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

function getTossSecretKey() {
  const secretKey = process.env.TOSS_SECRET_KEY;
  if (!secretKey) {
    throw new BillingError('TOSS_SECRET_KEY 가 설정되지 않았습니다.', 500);
  }
  return secretKey;
}

function toTossAuthHeader(secretKey: string) {
  return `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
}

function parseDateTime(value?: string | null) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

class BillingService {
  getChargePackages() {
    return Object.values(CHARGE_PACKAGES);
  }

  private getChargePackage(packageId: ChargePackageId) {
    const chargePackage = CHARGE_PACKAGES[packageId];
    if (!chargePackage) {
      throw new BillingError('유효하지 않은 충전 상품입니다.');
    }
    return chargePackage;
  }

  async createChargeOrder(userId: string, payload: CreateChargeOrderRequest) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BillingError('사용자를 찾을 수 없습니다.', 404);
    }

    const chargePackage = this.getChargePackage(payload.packageId);
    const orderId = `charge_${randomUUID()}`;

    const order = await billingRepository.createPaymentOrder({
      orderId,
      userId,
      provider: PAYMENT_PROVIDER,
      orderType: ORDER_TYPE_CHARGE,
      status: STATUS_PENDING,
      orderName: chargePackage.orderName,
      amountKrw: chargePackage.amountKrw,
      cashAmount: chargePackage.cashAmount,
      rawPayload: {
        packageId: chargePackage.packageId,
      },
    });

    return {
      ok: true as const,
      order: {
        orderId: order.orderId,
        orderName: order.orderName,
        amount: order.amountKrw,
        cashAmount: order.cashAmount,
        customerKey: user.userId,
        customerName: user.userName || user.nickname,
        customerEmail: user.email,
      },
      packages: this.getChargePackages(),
    };
  }

  async getBalance(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new BillingError('사용자를 찾을 수 없습니다.', 404);
    }

    const [cashTransactions, tokenTransactions] = await Promise.all([
      billingRepository.listCashTransactions(userId),
      billingRepository.listTokenTransactions(userId),
    ]);

    return {
      ok: true as const,
      cashBalance: user.cash,
      tokenBalance: user.tokens,
      cashTransactions: cashTransactions.map((transaction) => ({
        cashTransactionId: transaction.cashTransactionId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
      })),
      tokenTransactions: tokenTransactions.map((transaction) => ({
        tokenTransactionId: transaction.tokenTransactionId,
        transactionType: transaction.transactionType,
        amount: transaction.amount,
        balanceAfter: transaction.balanceAfter,
        description: transaction.description,
        createdAt: transaction.createdAt.toISOString(),
      })),
    };
  }

  async getOrder(userId: string, orderId: string) {
    const order = await billingRepository.findPaymentOrderByOrderId(orderId);
    if (!order || order.userId !== userId) {
      throw new BillingError('주문을 찾을 수 없습니다.', 404);
    }

    return {
      ok: true as const,
      order: {
        orderId: order.orderId,
        status: order.status,
        amount: order.amountKrw,
        cashAmount: order.cashAmount,
        orderName: order.orderName,
        paymentKey: order.paymentKey,
        approvedAt: order.approvedAt?.toISOString() ?? null,
        requestedAt: order.requestedAt.toISOString(),
        failedAt: order.failedAt?.toISOString() ?? null,
        canceledAt: order.canceledAt?.toISOString() ?? null,
      },
    };
  }

  private async confirmTossPayment(request: TossConfirmRequest) {
    const response = await fetch(`${TOSS_API_BASE_URL}/confirm`, {
      method: 'POST',
      headers: {
        Authorization: toTossAuthHeader(getTossSecretKey()),
        'Content-Type': 'application/json',
        'Idempotency-Key': `confirm_${request.orderId}`,
      },
      body: JSON.stringify(request),
    });

    const data = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const message =
        typeof data.message === 'string'
          ? data.message
          : '토스 결제 승인 요청이 실패했습니다.';

      throw new BillingError(message, response.status >= 400 && response.status < 500 ? 400 : 502);
    }

    return data as unknown as TossPayment;
  }

  private async finalizeChargeFromPayment(payment: TossPayment, webhookEventType?: string | null) {
    const existingByPaymentKey = await billingRepository.findPaymentOrderByPaymentKey(payment.paymentKey);
    if (existingByPaymentKey?.status === STATUS_PAID) {
      return {
        ok: true as const,
        orderId: existingByPaymentKey.orderId,
        status: existingByPaymentKey.status,
        chargedCash: existingByPaymentKey.cashAmount,
        cashBalance: null,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const order = await billingRepository.findPaymentOrderByOrderId(payment.orderId, tx);
      if (!order) {
        throw new BillingError('주문 정보를 찾을 수 없습니다.', 404);
      }

      if (order.status === STATUS_PAID) {
        const user = await userRepository.findById(order.userId);
        return {
          orderId: order.orderId,
          status: order.status,
          chargedCash: order.cashAmount,
          cashBalance: user?.cash ?? null,
        };
      }

      if (payment.totalAmount !== order.amountKrw) {
        throw new BillingError('결제 금액이 주문 금액과 일치하지 않습니다.');
      }

      if (payment.status !== 'DONE') {
        const mappedStatus = payment.status === STATUS_READY ? STATUS_READY : payment.status;
        const updatedOrder = await billingRepository.updatePaymentOrderStatus(
          order.orderId,
          {
            status: mappedStatus,
            paymentKey: payment.paymentKey,
            method: payment.method ?? null,
            approvedAt: parseDateTime(payment.approvedAt),
            requestedAt: parseDateTime(payment.requestedAt),
            lastWebhookEvent: webhookEventType ?? null,
            rawPayload: payment as unknown as Prisma.InputJsonValue,
          },
          tx,
        );

        return {
          orderId: updatedOrder.orderId,
          status: updatedOrder.status,
          chargedCash: 0,
          cashBalance: null,
        };
      }

      const updatedUser = await billingRepository.incrementUserCash(order.userId, order.cashAmount, tx);
      const updatedOrder = await billingRepository.updatePaymentOrderStatus(
        order.orderId,
        {
          status: STATUS_PAID,
          paymentKey: payment.paymentKey,
          method: payment.method ?? null,
          approvedAt: parseDateTime(payment.approvedAt),
          requestedAt: parseDateTime(payment.requestedAt),
          lastWebhookEvent: webhookEventType ?? null,
          rawPayload: payment as unknown as Prisma.InputJsonValue,
        },
        tx,
      );

      await billingRepository.createCashTransaction(
        {
          userId: order.userId,
          paymentOrderId: updatedOrder.paymentOrderId,
          transactionType: 'CHARGE',
          amount: order.cashAmount,
          balanceAfter: updatedUser.cash,
          description: `${order.orderName}`,
        },
        tx,
      );

      return {
        orderId: updatedOrder.orderId,
        status: updatedOrder.status,
        chargedCash: order.cashAmount,
        cashBalance: updatedUser.cash,
      };
    });

    return {
      ok: true as const,
      ...result,
    };
  }

  async confirmCharge(userId: string, payload: ConfirmChargeRequest) {
    const order = await billingRepository.findPaymentOrderByOrderId(payload.orderId);
    if (!order || order.userId !== userId) {
      throw new BillingError('주문을 찾을 수 없습니다.', 404);
    }

    if (order.status === STATUS_PAID) {
      const user = await userRepository.findById(userId);
      return {
        ok: true as const,
        orderId: order.orderId,
        status: order.status,
        chargedCash: order.cashAmount,
        cashBalance: user?.cash ?? null,
      };
    }

    if (order.amountKrw !== payload.amount) {
      throw new BillingError('주문 금액이 일치하지 않습니다.');
    }

    try {
      const payment = await this.confirmTossPayment(payload);
      return this.finalizeChargeFromPayment(payment);
    } catch (error) {
      if (error instanceof BillingError) {
        await billingRepository.markPaymentOrderFailed(
          payload.orderId,
          'CONFIRM_FAILED',
          error.message,
          {
            paymentKey: payload.paymentKey,
            orderId: payload.orderId,
            amount: payload.amount,
          },
        );
      }
      throw error;
    }
  }

  async handleTossWebhook(payload: TossWebhookPayload) {
    if (payload.eventType !== 'PAYMENT_STATUS_CHANGED' || !payload.data) {
      return {
        ok: true as const,
        ignored: true,
      };
    }

    const payment = payload.data;
    const order = await billingRepository.findPaymentOrderByOrderId(payment.orderId);
    if (!order) {
      return {
        ok: true as const,
        ignored: true,
      };
    }

    if (payment.status === 'DONE' || payment.status === STATUS_READY) {
      return this.finalizeChargeFromPayment(payment, payload.eventType);
    }

    if (payment.status === 'CANCELED') {
      await billingRepository.updatePaymentOrderStatus(order.orderId, {
        status: STATUS_CANCELED,
        paymentKey: payment.paymentKey,
        method: payment.method ?? null,
        canceledAt: new Date(),
        lastWebhookEvent: payload.eventType ?? null,
        rawPayload: payment as unknown as Prisma.InputJsonValue,
      });
      return {
        ok: true as const,
        orderId: order.orderId,
        status: STATUS_CANCELED,
      };
    }

    if (payment.status === 'ABORTED' || payment.status === 'EXPIRED') {
      await billingRepository.markPaymentOrderFailed(
        order.orderId,
        payment.status,
        `토스 웹훅 상태: ${payment.status}`,
        payment as unknown as Prisma.InputJsonValue,
      );
      return {
        ok: true as const,
        orderId: order.orderId,
        status: STATUS_FAILED,
      };
    }

    await billingRepository.updatePaymentOrderStatus(order.orderId, {
      status: payment.status,
      paymentKey: payment.paymentKey,
      method: payment.method ?? null,
      lastWebhookEvent: payload.eventType ?? null,
      rawPayload: payment as unknown as Prisma.InputJsonValue,
    });

    return {
      ok: true as const,
      orderId: order.orderId,
      status: payment.status,
    };
  }
}

export const billingService = new BillingService();
export { BillingError };
