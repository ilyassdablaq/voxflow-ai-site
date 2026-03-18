import { FastifyInstance } from "fastify";
import { validate } from "../../common/middleware/validate.js";
import { AuthRepository } from "./auth.repository.js";
import { AuthService } from "./auth.service.js";
import { LoginInput, RefreshInput, RegisterInput, loginSchema, refreshSchema, registerSchema } from "./auth.schemas.js";

export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  const authService = new AuthService(fastify, new AuthRepository());

  fastify.post("/api/auth/register", { preHandler: [validate({ body: registerSchema })] }, async (request, reply) => {
    const result = await authService.register(request.body as RegisterInput);
    return reply.status(201).send(result);
  });

  fastify.post("/api/auth/login", { preHandler: [validate({ body: loginSchema })] }, async (request) => {
    return authService.login(request.body as LoginInput);
  });

  fastify.post("/api/auth/refresh", { preHandler: [validate({ body: refreshSchema })] }, async (request) => {
    return authService.refresh(request.body as RefreshInput);
  });
}
