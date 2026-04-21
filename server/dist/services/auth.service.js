"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthError = exports.authService = void 0;
const crypto_1 = require("crypto");
const user_repository_1 = require("../repositories/user.repository");
const billing_repository_1 = require("../repositories/billing.repository");
const session_1 = require("../lib/session");
const ACTIVE_USER_STATUS = 'ACTIVE';
const DEFAULT_USER_ROLE = 'USER';
class AuthError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AuthError = AuthError;
class AuthService {
    async signUp(payload) {
        const loginId = payload.loginId.trim().toLowerCase();
        const email = payload.email.trim().toLowerCase();
        const nickname = payload.nickname.trim();
        const userName = payload.userName?.trim() || null;
        const password = payload.password;
        if (!loginId || !email || !nickname || !password) {
            throw new AuthError('아이디, 이메일, 닉네임, 비밀번호는 필수입니다.');
        }
        if (loginId.length < 4 || loginId.length > 50) {
            throw new AuthError('아이디는 4자 이상 50자 이하여야 합니다.');
        }
        if (nickname.length < 2 || nickname.length > 50) {
            throw new AuthError('닉네임은 2자 이상 50자 이하여야 합니다.');
        }
        if (password.length < 8) {
            throw new AuthError('비밀번호는 8자 이상이어야 합니다.');
        }
        const [existingLoginId, existingNickname, existingEmail] = await Promise.all([
            user_repository_1.userRepository.findByLoginId(loginId),
            user_repository_1.userRepository.findByNickname(nickname),
            user_repository_1.userRepository.findByEmail(email),
        ]);
        if (existingLoginId) {
            throw new AuthError('이미 사용 중인 아이디입니다.', 409);
        }
        if (existingNickname) {
            throw new AuthError('이미 사용 중인 닉네임입니다.', 409);
        }
        if (existingEmail) {
            throw new AuthError('이미 사용 중인 이메일입니다.', 409);
        }
        const passwordHash = await (0, session_1.hashPassword)(password);
        const user = await user_repository_1.userRepository.createUser({
            userId: (0, crypto_1.randomUUID)(),
            loginId,
            email,
            passwordHash,
            nickname,
            tokens: 10,
            userName: userName ?? undefined,
            userRole: DEFAULT_USER_ROLE,
            userStatus: ACTIVE_USER_STATUS,
        });
        await billing_repository_1.billingRepository.createTokenTransaction({
            userId: user.userId,
            transactionType: 'CHARGE',
            amount: 10,
            balanceAfter: 10,
            description: '회원가입 축하 토큰',
        });
        const sessionToken = (0, session_1.createSessionToken)(user.userId);
        return {
            ok: true,
            message: '회원가입이 완료되었습니다.',
            user: user_repository_1.userRepository.toSafeUser(user),
            sessionToken,
        };
    }
    async login(payload) {
        const identifier = payload.identifier.trim();
        const password = payload.password;
        if (!identifier || !password) {
            throw new AuthError('아이디 또는 이메일과 비밀번호를 입력해주세요.');
        }
        const user = await user_repository_1.userRepository.findByIdentifier(identifier);
        if (!user) {
            throw new AuthError('로그인 정보가 올바르지 않습니다.', 401);
        }
        if (user.userStatus !== ACTIVE_USER_STATUS) {
            throw new AuthError('비활성화된 계정입니다. 관리자에게 문의해주세요.', 403);
        }
        const isPasswordValid = await (0, session_1.verifyPassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            throw new AuthError('로그인 정보가 올바르지 않습니다.', 401);
        }
        const updatedUser = await user_repository_1.userRepository.updateLastLoginAt(user.userId);
        const sessionToken = (0, session_1.createSessionToken)(updatedUser.userId);
        return {
            ok: true,
            message: '로그인되었습니다.',
            user: user_repository_1.userRepository.toSafeUser(updatedUser),
            sessionToken,
        };
    }
    async logout() {
        return {
            ok: true,
            message: '로그아웃되었습니다.',
        };
    }
    async me(sessionToken) {
        const session = (0, session_1.verifySessionToken)(sessionToken);
        if (!session) {
            return {
                ok: false,
                user: null,
            };
        }
        const user = await user_repository_1.userRepository.findById(session.userId);
        if (!user || user.userStatus !== ACTIVE_USER_STATUS) {
            return {
                ok: false,
                user: null,
            };
        }
        return {
            ok: true,
            user: user_repository_1.userRepository.toSafeUser(user),
        };
    }
}
exports.authService = new AuthService();
