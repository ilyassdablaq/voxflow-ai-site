import { prisma } from "../../infra/database/prisma.js";

export class AuthRepository {
  async findUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async createUser(data: { email: string; passwordHash: string; fullName: string; role?: "USER" | "ADMIN" }) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({ data });

      const freePlan = await tx.plan.findFirst({
        where: {
          key: "free",
          isActive: true,
        },
        select: { id: true },
      });

      if (freePlan) {
        await tx.subscription.create({
          data: {
            userId: user.id,
            planId: freePlan.id,
            status: "ACTIVE",
          },
        });
      }

      return user;
    });
  }

  async createRefreshToken(data: { tokenHash: string; userId: string; expiresAt: Date }): Promise<void> {
    await prisma.refreshToken.create({ data });
  }

  async findRefreshToken(tokenHash: string): Promise<{ id: string; userId: string; expiresAt: Date; revokedAt: Date | null } | null> {
    return prisma.refreshToken.findUnique({
      where: { tokenHash },
      select: { id: true, userId: true, expiresAt: true, revokedAt: true },
    });
  }

  async revokeRefreshToken(tokenHash: string): Promise<void> {
    await prisma.refreshToken.update({
      where: { tokenHash },
      data: { revokedAt: new Date() },
    });
  }
}
