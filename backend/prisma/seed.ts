import { PrismaClient, PlanInterval } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.plan.upsert({
    where: { key: "free" },
    update: {},
    create: {
      key: "free",
      name: "Free",
      interval: PlanInterval.MONTHLY,
      priceCents: 0,
      voiceMinutes: 100,
      tokenLimit: 100_000,
      features: ["100 voice minutes", "Basic support", "1 agent"],
    },
  });

  await prisma.plan.upsert({
    where: { key: "pro" },
    update: {},
    create: {
      key: "pro",
      name: "Pro",
      interval: PlanInterval.MONTHLY,
      priceCents: 4900,
      voiceMinutes: 5000,
      tokenLimit: 2_000_000,
      features: ["5000 voice minutes", "Priority support", "Unlimited agents"],
    },
  });

  await prisma.plan.upsert({
    where: { key: "enterprise" },
    update: {},
    create: {
      key: "enterprise",
      name: "Enterprise",
      interval: PlanInterval.MONTHLY,
      priceCents: 0,
      voiceMinutes: 100000,
      tokenLimit: 20_000_000,
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
