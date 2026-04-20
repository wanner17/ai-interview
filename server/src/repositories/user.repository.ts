import { prisma } from '../lib/prisma';

class UserRepository {
  async findByEmail(email: string) {
    return prisma.tbUser.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async findByNickname(nickname: string) {
    return prisma.tbUser.findUnique({
      where: {
        nickname,
      },
    });
  }

  async findByLoginId(loginId: string) {
    return prisma.tbUser.findUnique({
      where: {
        loginId: loginId.toLowerCase(),
      },
    });
  }

  async findById(userId: string) {
    return prisma.tbUser.findUnique({
      where: {
        userId,
      },
    });
  }

  async findByIdentifier(identifier: string) {
    const normalized = identifier.trim().toLowerCase();
    return prisma.tbUser.findFirst({
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
    tokens: number;
    userName?: string;
    userRole: string;
    userStatus: string;
  }) {
    return prisma.tbUser.create({
      data,
    });
  }

  async updateLastLoginAt(userId: string) {
    return prisma.tbUser.update({
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
      userRole: user.userRole,
      userStatus: user.userStatus,
      lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const userRepository = new UserRepository();
