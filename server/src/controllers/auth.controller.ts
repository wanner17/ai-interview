import type { Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { authService } from '../services/auth.service';
import { AuthError } from '../services/auth.service';
import { parseCookies } from '../lib/http';
import {
  SESSION_COOKIE_NAME,
  clearSessionCookie,
  createSessionCookie,
} from '../lib/session';

class AuthController {
  signUp = async (req: Request, res: Response) => {
    try {
      console.log('[auth][signup][request]', {
        loginId: req.body?.loginId,
        email: req.body?.email ?? null,
        nickname: req.body?.nickname,
      });
      const result = await authService.signUp(req.body);
      res.setHeader('Set-Cookie', createSessionCookie(result.sessionToken));
      return res.status(201).json({
        ok: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      console.error('[auth][signup][error]', error);
      return this.handleError(res, error);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const result = await authService.login(req.body);
      res.setHeader('Set-Cookie', createSessionCookie(result.sessionToken));
      return res.status(200).json({
        ok: true,
        message: result.message,
        user: result.user,
      });
    } catch (error) {
      return this.handleError(res, error);
    }
  };

  logout = async (_req: Request, res: Response) => {
    const result = await authService.logout();
    res.setHeader('Set-Cookie', clearSessionCookie());
    return res.status(200).json(result);
  };

  me = async (req: Request, res: Response) => {
    const cookies = parseCookies(req.headers.cookie);
    const result = await authService.me(cookies[SESSION_COOKIE_NAME]);
    const statusCode = result.ok ? 200 : 401;
    return res.status(statusCode).json(result);
  };

  private handleError(res: Response, error: unknown) {
    if (error instanceof AuthError) {
      return res.status(error.statusCode).json({
        ok: false,
        error: error.message,
      });
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[auth][prisma]', error.code, error.message, error.meta);

      if (error.code === 'P2002') {
        return res.status(409).json({
          ok: false,
          error: '이미 사용 중인 값이 있습니다.',
        });
      }

      if (error.code === 'P2003') {
        return res.status(400).json({
          ok: false,
          error: '참조 무결성 오류가 발생했습니다.',
        });
      }

      return res.status(400).json({
        ok: false,
        error: '데이터베이스 제약 조건에 맞지 않는 값입니다.',
      });
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error('[auth][prisma-validation]', error.message);
      return res.status(400).json({
        ok: false,
        error: '입력값 형식이 올바르지 않습니다.',
      });
    }

    console.error('[auth]', error);
    const message =
      process.env.NODE_ENV !== 'production' && error instanceof Error
        ? error.message
        : '인증 처리 중 오류가 발생했습니다.';

    return res.status(500).json({
      ok: false,
      error: message,
    });
  }
}

export const authController = new AuthController();
