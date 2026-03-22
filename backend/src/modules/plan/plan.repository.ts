import { prisma } from "../../infra/database/prisma.js";

export class PlanRepository {
  async getActivePlans() {
    return prisma.plan.findMany({
      where: { isActive: true },
      orderBy: [{ priceCents: "asc" }],
      select: {
        id: true,
        key: true,
        name: true,
        interval: true,
        priceCents: true,
        voiceMinutes: true,
        tokenLimit: true,
        features: true,
      },
    });
  }

  async getCurrentSubscription(userId: string) {
    return prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: {
        plan: {
          select: {
            id: true,
            key: true,
            name: true,
            interval: true,
            priceCents: true,
            voiceMinutes: true,
            tokenLimit: true,
            features: true,
          },
        },
      },
      orderBy: { startsAt: "desc" },
    });
  }

  async getPlanByKey(planKey: string) {
    return prisma.plan.findUnique({
      where: { key: planKey },
      select: {
        id: true,
        key: true,
        name: true,
        interval: true,
        priceCents: true,
        voiceMinutes: true,
        tokenLimit: true,
        features: true,
      },
    });
  }

  async activatePlanForUser(userId: string, planId: string) {
    return prisma.$transaction(async (tx) => {
      await tx.subscription.updateMany({
        where: { userId, isActive: true },
        data: { isActive: false, endsAt: new Date() },
      });

      return tx.subscription.create({
        data: {
          userId,
          planId,
          startsAt: new Date(),
          isActive: true,
        },
      });
    });
  }
}
