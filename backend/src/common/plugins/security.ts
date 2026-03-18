import { FastifyInstance } from "fastify";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env } from "../../config/env.js";
import { redis } from "../../infra/cache/redis.js";

export async function registerSecurityPlugins(fastify: FastifyInstance): Promise<void> {
  await fastify.register(helmet, {
    global: true,
    contentSecurityPolicy: false,
  });

  await fastify.register(cors, {
    origin: [env.APP_ORIGIN],
    credentials: true,
  });

  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: "1 minute",
    redis,
    addHeadersOnExceeding: {
      "x-ratelimit-limit": true,
      "x-ratelimit-remaining": true,
      "x-ratelimit-reset": true,
    },
    keyGenerator(request) {
      const user = request.user as { sub?: string } | undefined;
      return user?.sub ?? request.ip;
    },
  });
}
