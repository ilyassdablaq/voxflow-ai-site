import { PlanRepository } from "./plan.repository.js";
import { AppError } from "../../common/errors/app-error.js";

export class PlanService {
  constructor(private readonly repository: PlanRepository) {}

  async listPlans() {
    return this.repository.getActivePlans();
  }

  async getCurrentSubscription(userId: string) {
    return this.repository.getCurrentSubscription(userId);
  }

  async changePlan(userId: string, planKey: string) {
    const plan = await this.repository.getPlanByKey(planKey);
    if (!plan) {
      throw new AppError(404, "PLAN_NOT_FOUND", "Plan not found");
    }

    await this.repository.activatePlanForUser(userId, plan.id);
    return this.repository.getCurrentSubscription(userId);
  }
}
