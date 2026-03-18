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
}
