import Fastify from "fastify";
import sensible from "@fastify/sensible";
import jwt from "@fastify/jwt";
import websocket from "@fastify/websocket";
import { env } from "./config/env.js";
import { registerSecurityPlugins } from "./common/plugins/security.js";
import { errorHandler } from "./common/middleware/error-handler.js";
import { authRoutes } from "./modules/auth/auth.routes.js";
import { contactRoutes } from "./modules/contact/contact.routes.js";
import { planRoutes } from "./modules/plan/plan.routes.js";
import { conversationRoutes } from "./modules/conversation/conversation.routes.js";
import { integrationRoutes } from "./modules/integration/integration.routes.js";
import { registerWebSocketGateway } from "./infra/ws/ws.gateway.js";
import { ConversationRepository } from "./modules/conversation/conversation.repository.js";
import { AiOrchestratorService } from "./services/ai/ai-orchestrator.service.js";
import { RagService } from "./services/rag/rag.service.js";

export async function buildApp() {
  const app = Fastify({
    logger:
      env.NODE_ENV === "production"
        ? { level: "info" }
        : {
            level: "debug",
            transport: {
              target: "pino-pretty",
              options: {
                translateTime: "SYS:standard",
                colorize: true,
              },
            },
          },
  });

  app.setErrorHandler(errorHandler);

  await app.register(sensible);
  await app.register(websocket);

  await app.register(jwt, {
    secret: env.JWT_ACCESS_SECRET,
  });

  await registerSecurityPlugins(app);

  app.get("/", async () => ({
    status: "ok",
    service: "voxai-backend",
    version: "1.0.0",
    endpoints: {
      health: "/health",
      auth: "/api/auth",
      plans: "/api/plans",
      conversations: "/api/conversations",
      contact: "/api/contact",
    },
    timestamp: new Date().toISOString(),
  }));

  app.get("/health", async () => ({
    status: "ok",
    service: "voxai-backend",
    timestamp: new Date().toISOString(),
  }));

  await app.register(authRoutes);
  await app.register(contactRoutes);
  await app.register(planRoutes);
  await app.register(conversationRoutes);
  await app.register(integrationRoutes);

  registerWebSocketGateway(app, new AiOrchestratorService(new RagService()), new ConversationRepository());

  return app;
}
