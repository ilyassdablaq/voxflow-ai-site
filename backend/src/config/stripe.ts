import { env } from "./env.js";
import Stripe from "stripe";

/**
 * Stripe SDK - initialize from environment variable
 * Requires STRIPE_SECRET_KEY in .env
 */
export const getStripeClient = () => {
  if (!env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  return new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2023-10-16",
  });
};

export const STRIPE_CONFIG = {
  webhookSecret: env.STRIPE_WEBHOOK_SECRET || '',
  successUrl: env.STRIPE_SUCCESS_URL || `${env.APP_ORIGIN}/stripe-success`,
  cancelUrl: env.STRIPE_CANCEL_URL || `${env.APP_ORIGIN}/stripe-cancel`,
};

export type StripeCheckoutPaymentMethod = "card" | "paypal" | "sepa_debit";

export type StripePaymentMethodDisplay = {
  key: "card" | "paypal" | "wallets" | "sepa_debit";
  label: string;
  description: string;
  enabled: boolean;
};

export function getStripeCheckoutPaymentMethods(): StripeCheckoutPaymentMethod[] {
  const methods: StripeCheckoutPaymentMethod[] = ["card"];

  if (env.STRIPE_ENABLE_PAYPAL) {
    methods.push("paypal");
  }

  if (env.STRIPE_ENABLE_SEPA_DEBIT) {
    methods.push("sepa_debit");
  }

  return methods;
}

export function getStripePaymentMethodDisplay(): StripePaymentMethodDisplay[] {
  return [
    {
      key: "card",
      label: "Credit / Debit Cards",
      description: "Visa, Mastercard, American Express and other major cards.",
      enabled: true,
    },
    {
      key: "paypal",
      label: "PayPal",
      description: "Available when enabled in your Stripe account and region.",
      enabled: env.STRIPE_ENABLE_PAYPAL,
    },
    {
      key: "wallets",
      label: "Apple Pay / Google Pay",
      description: "Shown automatically on supported devices and verified domains.",
      enabled: env.STRIPE_ENABLE_WALLETS,
    },
    {
      key: "sepa_debit",
      label: "SEPA Direct Debit",
      description: "Available for eligible EUR subscriptions in supported countries.",
      enabled: env.STRIPE_ENABLE_SEPA_DEBIT,
    },
  ];
}
