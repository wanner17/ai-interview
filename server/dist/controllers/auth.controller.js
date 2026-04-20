"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = void 0;
const client_1 = require("@prisma/client");
const auth_service_1 = require("../services/auth.service");
const auth_service_2 = require("../services/auth.service");
const http_1 = require("../lib/http");
const session_1 = require("../lib/session");
class AuthController {
    signUp = async (req, res) => {
        try {
            console.log('[auth][signup][request]', {
                loginId: req.body?.loginId,
                email: req.body?.email ?? null,
                nickname: req.body?.nickname,
            });
            const result = await auth_service_1.authService.signUp(req.body);
            res.setHeader('Set-Cookie', (0, session_1.createSessionCookie)(result.sessionToken));
            return res.status(201).json({
                ok: true,
                message: result.message,
                user: result.user,
            });
        }
        catch (error) {
            console.error('[auth][signup][error]', error);
            return this.handleError(res, error);
        }
    };
    login = async (req, res) => {
        try {
            const result = await auth_service_1.authService.login(req.body);
            res.setHeader('Set-Cookie', (0, session_1.createSessionCookie)(result.sessionToken));
            return res.status(200).json({
                ok: true,
                message: result.message,
                user: result.user,
            });
        }
        catch (error) {
            return this.handleError(res, error);
        }
    };
    logout = async (_req, res) => {
        const result = await auth_service_1.authService.logout();
        res.setHeader('Set-Cookie', (0, session_1.clearSessionCookie)());
        return res.status(200).json(result);
    };
    me = async (req, res) => {
        const cookies = (0, http_1.parseCookies)(req.headers.cookie);
        const result = await auth_service_1.authService.me(cookies[session_1.SESSION_COOKIE_NAME]);
        const statusCode = result.ok ? 200 : 401;
        return res.status(statusCode).json(result);
    };
    handleError(res, error) {
        if (error instanceof auth_service_2.AuthError) {
            return res.status(error.statusCode).json({
                ok: false,
                error: error.message,
            });
        }
        if (error instanceof client_1.Prisma.PrismaClientKnownRequestError) {
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
        if (error instanceof client_1.Prisma.PrismaClientValidationError) {
            console.error('[auth][prisma-validation]', error.message);
            return res.status(400).json({
                ok: false,
                error: '입력값 형식이 올바르지 않습니다.',
            });
        }
        console.error('[auth]', error);
        const message = process.env.NODE_ENV !== 'production' && error instanceof Error
            ? error.message
            : '인증 처리 중 오류가 발생했습니다.';
        return res.status(500).json({
            ok: false,
            error: message,
        });
    }
}
exports.authController = new AuthController();
