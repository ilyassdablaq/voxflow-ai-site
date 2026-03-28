import { PrismaClient, PlanInterval, PlanType } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { key: "free" },
    update: {
      type: PlanType.FREE,
      interval: PlanInterval.MONTHLY,
      priceCents: 0,
      voiceMinutes: 100,
      tokenLimit: 100_000,
      features: ["100 voice minutes", "Basic support", "1 agent"],
      isActive: true,
    },
    create: {
      key: "free",
      name: "Free",
      type: PlanType.FREE,
      interval: PlanInterval.MONTHLY,
      priceCents: 0,
      voiceMinutes: 100,
      tokenLimit: 100_000,
      features: ["100 voice minutes", "Basic support", "1 agent"],
    },
  });

  await prisma.plan.upsert({
    where: { key: "pro" },
    update: {
      type: PlanType.PRO,
      interval: PlanInterval.MONTHLY,
      priceCents: 4900,
      voiceMinutes: 5000,
      tokenLimit: 2_000_000,
      features: ["5000 voice minutes", "Priority support", "Unlimited agents"],
      isActive: true,
    },
    create: {
      key: "pro",
      name: "Pro",
      type: PlanType.PRO,
      interval: PlanInterval.MONTHLY,
      priceCents: 4900,
      voiceMinutes: 5000,
      tokenLimit: 2_000_000,
      features: ["5000 voice minutes", "Priority support", "Unlimited agents"],
    },
  });

  await prisma.plan.upsert({
    where: { key: "enterprise" },
    update: {
      type: PlanType.ENTERPRISE,
      interval: PlanInterval.MONTHLY,
      priceCents: 9900,
      voiceMinutes: 100000,
      tokenLimit: 10_000_000,
      features: ["Dedicated support", "SLA", "Custom integrations"],
      isActive: true,
    },
    create: {
      key: "enterprise",
      name: "Enterprise",
      type: PlanType.ENTERPRISE,
      interval: PlanInterval.MONTHLY,
      priceCents: 9900,
      voiceMinutes: 100000,
      tokenLimit: 10_000_000,
      features: ["Dedicated support", "SLA", "Custom integrations"],
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
