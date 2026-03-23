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
      where: { userId, status: "ACTIVE" },
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
        where: { userId, status: "ACTIVE" },
        data: { status: "INACTIVE", endsAt: new Date() },
      });

      return tx.subscription.create({
        data: {
          userId,
          planId,
          startsAt: new Date(),
          status: "ACTIVE",
        },
      });
    });
  }

  async ensureDefaultFreePlanSubscription(userId: string) {
    const existingActive = await prisma.subscription.findFirst({
      where: { userId, status: "ACTIVE" },
      select: { id: true },
    });

    if (existingActive) {
      return;
    }

    const freePlan = await prisma.plan.findFirst({
      where: {
        key: "free",
        isActive: true,
      },
      select: { id: true },
    });

    if (!freePlan) {
      return;
    }

    await prisma.subscription.create({
      data: {
        userId,
        planId: freePlan.id,
        status: "ACTIVE",
      },
    });
  }
}
