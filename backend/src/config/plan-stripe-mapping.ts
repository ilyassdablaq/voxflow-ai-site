import { env } from "./env.js";

const PLAN_KEY_ALIASES: Record<string, string> = {
  pro: "pro-monthly",
  enterprise: "enterprise-monthly",
};

/**
 * Normalize user-selected plan keys so legacy/new naming both work.
 */
export function normalizePlanKeyForCheckout(planKey: string): string {
  const normalized = planKey.trim().toLowerCase();
  return PLAN_KEY_ALIASES[normalized] ?? normalized;
}

type StripePlanConfig = {
  priceId?: string;
};

/**
 * Env-backed mapping used when DB does not yet have stripePriceId values.
 */
const PLAN_STRIPE_MAP: Record<string, StripePlanConfig> = {
  pro: { priceId: env.STRIPE_PRICE_ID_PRO },
  "pro-monthly": { priceId: env.STRIPE_PRICE_ID_PRO_MONTHLY ?? env.STRIPE_PRICE_ID_PRO },
  "pro-yearly": { priceId: env.STRIPE_PRICE_ID_PRO_YEARLY },
  enterprise: { priceId: env.STRIPE_PRICE_ID_ENTERPRISE },
  "enterprise-monthly": { priceId: env.STRIPE_PRICE_ID_ENTERPRISE_MONTHLY ?? env.STRIPE_PRICE_ID_ENTERPRISE },
  "enterprise-yearly": { priceId: env.STRIPE_PRICE_ID_ENTERPRISE_YEARLY },
};

export function getStripePriceForPlan(planKey: string): string | null {
  const normalizedPlanKey = normalizePlanKeyForCheckout(planKey);
  const direct = PLAN_STRIPE_MAP[planKey]?.priceId;
  const normalized = PLAN_STRIPE_MAP[normalizedPlanKey]?.priceId;
  return direct ?? normalized ?? null;
}

export function getPlanKeyFromStripePrice(priceId: string): string | null {
  for (const [planKey, config] of Object.entries(PLAN_STRIPE_MAP)) {
    if (config.priceId && config.priceId === priceId) {
      return planKey;
    }
  }
  return null;
}
