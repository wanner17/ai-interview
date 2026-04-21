import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { parseCookies } from '../lib/http';
import { SESSION_COOKIE_NAME, verifySessionToken } from '../lib/session';
import { BillingError, billingService } from '../services/billing.service';

class BillingController {
  private requireUserId(req: Request) {
    const cookies = parseCookies(req.headers.cookie);
    const session = verifySessionToken(cookies[SESSION_COOKIE_NAME]);
    if (!session?.userId) {
      throw new BillingError('로그인이 필요합니다.', 401);
    }
    return session.userId;
  }

  getPackages = async (_req: Request, res: Response) => {
    return res.status(200).json({
      ok: true,
      packages: billingService.getChargePackages(),
    });
  };

  createChargeOrder = async (req: Request, res: Response) => {
    try {
      const userId = this.requireUserId(req);
      const result = await billingService.createChargeOrder(userId, req.body);
      return res.status(201).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  confirmCharge = async (req: Request, res: Response) => {
    try {
      const userId = this.requireUserId(req);
      const result = await billingService.confirmCharge(userId, req.body);
      return res.status(200).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getBalance = async (req: Request, res: Response) => {
    try {
      const userId = this.requireUserId(req);
      const result = await billingService.getBalance(userId);
      return res.status(200).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  getOrder = async (req: Request, res: Response) => {
    try {
      const userId = this.requireUserId(req);
      const result = await billingService.getOrder(userId, req.params.orderId);
      return res.status(200).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  handleTossWebhook = async (req: Request, res: Response) => {
    try {
      const result = await billingService.handleTossWebhook(req.body);
      return res.status(200).json(result);
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof BillingError) {
      return res.status(error.statusCode).json({
        ok: false,
        error: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return res.status(409).json({
          ok: false,
          error: '중복된 결제 식별자입니다.',
        });
      }

      return res.status(400).json({
        ok: false,
        error: '결제 데이터베이스 처리 중 오류가 발생했습니다.',
      });
    }

    console.error('[billing]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : '결제 처리 중 오류가 발생했습니다.';

    return res.status(500).json({
      ok: false,
      error: message,
    });
  }
}

export const billingController = new BillingController();
