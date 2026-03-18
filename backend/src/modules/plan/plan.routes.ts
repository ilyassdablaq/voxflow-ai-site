import { FastifyInstance } from "fastify";
import { PlanRepository } from "./plan.repository.js";
import { PlanService } from "./plan.service.js";

export async function planRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new PlanService(new PlanRepository());

  fastify.get("/api/plans", async () => {
    return service.listPlans();
  });
}
