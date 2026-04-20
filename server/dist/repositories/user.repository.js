"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = void 0;
const prisma_1 = require("../lib/prisma");
class UserRepository {
    async findByEmail(email) {
        return prisma_1.prisma.user.findUnique({
            where: {
                email: email.toLowerCase(),
            },
        });
    }
    async findByNickname(nickname) {
        return prisma_1.prisma.user.findUnique({
            where: {
                nickname,
            },
        });
    }
    async findByLoginId(loginId) {
        return prisma_1.prisma.user.findUnique({
            where: {
                loginId: loginId.toLowerCase(),
            },
        });
    }
    async findById(userId) {
        return prisma_1.prisma.user.findUnique({
            where: {
                userId,
            },
        });
    }
    async findByIdentifier(identifier) {
        const normalized = identifier.trim().toLowerCase();
        return prisma_1.prisma.user.findFirst({
            where: {
                OR: [{ loginId: normalized }, { email: normalized }],
            },
        });
    }
    async createUser(data) {
        return prisma_1.prisma.user.create({
            data,
        });
    }
    async updateLastLoginAt(userId) {
        return prisma_1.prisma.user.update({
            where: {
                userId,
            },
            data: {
                lastLoginAt: new Date(),
            },
        });
    }
    toSafeUser(user) {
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
exports.userRepository = new UserRepository();
