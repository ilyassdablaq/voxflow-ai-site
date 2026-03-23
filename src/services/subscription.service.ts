import { apiClient } from "@/lib/api-client";

export interface Plan {
  id: string;
  key: string;
  name: string;
  interval: "MONTHLY" | "YEARLY";
  priceCents: number;
  voiceMinutes: number;
  tokenLimit: number;
  features: unknown;
}

export interface CurrentSubscription {
  id: string;
  userId: string;
  planId: string;
  status: "ACTIVE" | "INACTIVE" | "CANCELED" | "EXPIRED";
  startsAt: string;
  endsAt: string | null;
  plan: Plan;
}

export const subscriptionService = {
  listPlans(): Promise<Plan[]> {
    return apiClient.get<Plan[]>("/api/plans");
  },

  getCurrentSubscription(): Promise<CurrentSubscription | null> {
    return apiClient.get<CurrentSubscription | null>("/api/subscriptions/current");
  },

  changePlan(planKey: string): Promise<CurrentSubscription | null> {
    return apiClient.post<CurrentSubscription | null>("/api/subscriptions/change", { planKey });
  },
};
