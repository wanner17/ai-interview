import type { Prisma, PrismaClient } from '@prisma/client';
import { prisma } from '../lib/prisma';

type PrismaExecutor = PrismaClient | Prisma.TransactionClient;

class BillingRepository {
  private getClient(executor?: PrismaExecutor) {
    return executor ?? prisma;
  }

  async createPaymentOrder(
    data: {
      orderId: string;
      userId: string;
      provider: string;
      orderType: string;
      status: string;
      orderName: string;
      amountKrw: number;
      cashAmount: number;
      rawPayload?: Prisma.InputJsonValue;
    },
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).paymentOrder.create({ data });
  }

  async findPaymentOrderByOrderId(orderId: string, executor?: PrismaExecutor) {
    return this.getClient(executor).paymentOrder.findUnique({
      where: { orderId },
    });
  }

  async findPaymentOrderByPaymentKey(paymentKey: string, executor?: PrismaExecutor) {
    return this.getClient(executor).paymentOrder.findUnique({
      where: { paymentKey },
    });
  }

  async markPaymentOrderFailed(
    orderId: string,
    failureCode: string | null,
    failureMessage: string | null,
    rawPayload?: Prisma.InputJsonValue,
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).paymentOrder.update({
      where: { orderId },
      data: {
        status: 'FAILED',
        failedAt: new Date(),
        failureCode: failureCode ?? undefined,
        failureMessage: failureMessage ?? undefined,
        rawPayload,
      },
    });
  }

  async updatePaymentOrderStatus(
    orderId: string,
    data: {
      status: string;
      paymentKey?: string | null;
      method?: string | null;
      approvedAt?: Date | null;
      requestedAt?: Date | null;
      canceledAt?: Date | null;
      lastWebhookEvent?: string | null;
      rawPayload?: Prisma.InputJsonValue;
    },
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).paymentOrder.update({
      where: { orderId },
      data: {
        status: data.status,
        paymentKey: data.paymentKey ?? undefined,
        method: data.method ?? undefined,
        approvedAt: data.approvedAt ?? undefined,
        requestedAt: data.requestedAt ?? undefined,
        canceledAt: data.canceledAt ?? undefined,
        lastWebhookEvent: data.lastWebhookEvent ?? undefined,
        rawPayload: data.rawPayload,
      },
    });
  }

  async incrementUserCash(
    userId: string,
    amount: number,
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).user.update({
      where: { userId },
      data: {
        cash: {
          increment: amount,
        },
      },
    });
  }

  async incrementUserTokens(
    userId: string,
    amount: number,
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).user.update({
      where: { userId },
      data: {
        tokens: {
          increment: amount,
        },
      },
    });
  }

  async createTokenTransaction(
    data: {
      userId: string;
      transactionType: string;
      amount: number;
      balanceAfter: number;
      description?: string;
    },
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).tokenTransaction.create({
      data: {
        userId: data.userId,
        transactionType: data.transactionType,
        amount: data.amount,
        balanceAfter: data.balanceAfter,
        description: data.description,
      },
    });
  }

  async createCashTransaction(
    data: {
      userId: string;
      paymentOrderId?: string | null;
      transactionType: string;
      amount: number;
      balanceAfter: number;
      description?: string;
    },
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).cashTransaction.create({
      data: {
        userId: data.userId,
        paymentOrderId: data.paymentOrderId ?? undefined,
        transactionType: data.transactionType,
        amount: data.amount,
        balanceAfter: data.balanceAfter,
        description: data.description,
      },
    });
  }

  async listCashTransactions(userId: string, executor?: PrismaExecutor) {
    return this.getClient(executor).cashTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async listTokenTransactions(userId: string, executor?: PrismaExecutor) {
    return this.getClient(executor).tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  async listTokenTransactionsByTypeAndRange(
    userId: string,
    transactionType: string,
    startAt: Date,
    endAt: Date,
    executor?: PrismaExecutor,
  ) {
    return this.getClient(executor).tokenTransaction.findMany({
      where: {
        userId,
        transactionType,
        createdAt: {
          gte: startAt,
          lt: endAt,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }
}

export const billingRepository = new BillingRepository();
