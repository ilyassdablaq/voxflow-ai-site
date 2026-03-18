import { PlanRepository } from "./plan.repository.js";

export class PlanService {
  constructor(private readonly repository: PlanRepository) {}

  async listPlans() {
    return this.repository.getActivePlans();
  }
}
