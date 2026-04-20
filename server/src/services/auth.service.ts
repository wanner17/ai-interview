import type { LoginRequest, SignUpRequest } from '../types/auth.type';
import { randomUUID } from 'crypto';
import { userRepository } from '../repositories/user.repository';
import { createSessionToken, hashPassword, verifyPassword, verifySessionToken } from '../lib/session';

const ACTIVE_USER_STATUS = 'ACTIVE';
const DEFAULT_USER_ROLE = 'USER';

class AuthError extends Error {
  statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

class AuthService {
  async signUp(payload: SignUpRequest) {
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
      userRepository.findByLoginId(loginId),
      userRepository.findByNickname(nickname),
      userRepository.findByEmail(email),
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

    const passwordHash = await hashPassword(password);
    const user = await userRepository.createUser({
      userId: randomUUID(),
      loginId,
      email,
      passwordHash,
      nickname,
      tokens: 0,
      userName: userName ?? undefined,
      userRole: DEFAULT_USER_ROLE,
      userStatus: ACTIVE_USER_STATUS,
    });
    const sessionToken = createSessionToken(user.userId);

    return {
      ok: true as const,
      message: '회원가입이 완료되었습니다.',
      user: userRepository.toSafeUser(user),
      sessionToken,
    };
  }

  async login(payload: LoginRequest) {
    const identifier = payload.identifier.trim();
    const password = payload.password;

    if (!identifier || !password) {
      throw new AuthError('아이디 또는 이메일과 비밀번호를 입력해주세요.');
    }

    const user = await userRepository.findByIdentifier(identifier);
    if (!user) {
      throw new AuthError('로그인 정보가 올바르지 않습니다.', 401);
    }

    if (user.userStatus !== ACTIVE_USER_STATUS) {
      throw new AuthError('비활성화된 계정입니다. 관리자에게 문의해주세요.', 403);
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthError('로그인 정보가 올바르지 않습니다.', 401);
    }

    const updatedUser = await userRepository.updateLastLoginAt(user.userId);
    const sessionToken = createSessionToken(updatedUser.userId);

    return {
      ok: true as const,
      message: '로그인되었습니다.',
      user: userRepository.toSafeUser(updatedUser),
      sessionToken,
    };
  }

  async logout() {
    return {
      ok: true as const,
      message: '로그아웃되었습니다.',
    };
  }

  async me(sessionToken?: string | null) {
    const session = verifySessionToken(sessionToken);
    if (!session) {
      return {
        ok: false as const,
        user: null,
      };
    }

    const user = await userRepository.findById(session.userId);
    if (!user || user.userStatus !== ACTIVE_USER_STATUS) {
      return {
        ok: false as const,
        user: null,
      };
    }

    return {
      ok: true as const,
      user: userRepository.toSafeUser(user),
    };
  }
}

export const authService = new AuthService();
export { AuthError };
