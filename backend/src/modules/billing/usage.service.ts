import { prisma } from "../../infra/database/prisma.js";
import { AppError } from "../../common/errors/app-error.js";

export class UsageService {
  async trackUsage(data: { userId: string; conversationId?: string; minutesUsed: number; tokensUsed: number }): Promise<void> {
    await prisma.usage.create({ data });
  }

  async enforcePlanLimits(userId: string): Promise<void> {
    const activeSubscription = await prisma.subscription.findFirst({
      where: { userId, isActive: true },
      include: { plan: true },
      orderBy: { startsAt: "desc" },
    });

    if (!activeSubscription) {
      return;
    }

    const startOfMonth = new Date();
    startOfMonth.setUTCDate(1);
    startOfMonth.setUTCHours(0, 0, 0, 0);

    const usage = await prisma.usage.aggregate({
      where: {
        userId,
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        minutesUsed: true,
        tokensUsed: true,
      },
    });

    const usedMinutes = usage._sum.minutesUsed ?? 0;
    const usedTokens = usage._sum.tokensUsed ?? 0;

    if (usedMinutes >= activeSubscription.plan.voiceMinutes || usedTokens >= activeSubscription.plan.tokenLimit) {
      throw new AppError(402, "PLAN_LIMIT_EXCEEDED", "Plan usage limit exceeded");
    }
  }
}
