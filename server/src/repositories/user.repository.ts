import { prisma } from '../lib/prisma';

class UserRepository {
  async findByEmail(email: string) {
    return prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async findByNickname(nickname: string) {
    return prisma.user.findUnique({
      where: {
        nickname,
      },
    });
  }

  async findByLoginId(loginId: string) {
    return prisma.user.findUnique({
      where: {
        loginId: loginId.toLowerCase(),
      },
    });
  }

  async findById(userId: string) {
    return prisma.user.findUnique({
      where: {
        userId,
      },
    });
  }

  async findByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return prisma.user.findFirst({
      where: {
        OR: [{ loginId: normalized }, { email: normalized }],
      },
    });
  }

  async createUser(data: {
    userId: string;
    loginId: string;
    email: string;
    passwordHash: string;
    nickname: string;
    cash: number;
    tokens: number;
    userName?: string;
    userRole: string;
    userStatus: string;
  }) {
    return prisma.user.create({
      data,
    });
  }

  async updateLastLoginAt(userId: string) {
    return prisma.user.update({
      where: {
        userId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    });
  }

  toSafeUser(user: {
    userId: string;
    loginId: string;
    email: string | null;
    nickname: string;
    userName: string | null;
    cash: number;
    tokens: number;
    userRole: string;
    userStatus: string;
    lastLoginAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      userId: user.userId,
      loginId: user.loginId,
      email: user.email,
      nickname: user.nickname,
      userName: user.userName,
      cash: user.cash,
      tokens: user.tokens,
      userRole: user.userRole,
      userStatus: user.userStatus,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const userRepository = new UserRepository();
