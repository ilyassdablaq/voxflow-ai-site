import { FastifyInstance } from "fastify";
import { authenticate } from "../../common/middleware/auth-middleware.js";
import { validate } from "../../common/middleware/validate.js";
import { RagService } from "../../services/rag/rag.service.js";
import { AiOrchestratorService } from "../../services/ai/ai-orchestrator.service.js";
import { ConversationRepository } from "../conversation/conversation.repository.js";
import { IntegrationRepository } from "./integration.repository.js";
import { IntegrationService } from "./integration.service.js";
import { EmbedChatInput, IntegrationSettingsInput, embedChatSchema, integrationSettingsSchema } from "./integration.schemas.js";

export async function integrationRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new IntegrationService(
    new IntegrationRepository(),
    new ConversationRepository(),
    new AiOrchestratorService(new RagService()),
  );

  fastify.get("/api/integrations/settings", { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { sub: string };
    return service.getSettings(user.sub);
  });

  fastify.put(
    "/api/integrations/settings",
    { preHandler: [authenticate, validate({ body: integrationSettingsSchema })] },
    async (request) => {
      const user = request.user as { sub: string };
      return service.updateSettings(user.sub, request.body as IntegrationSettingsInput);
    },
  );

  fastify.post("/api/integrations/regenerate-key", { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { sub: string };
    return service.regenerateEmbedKey(user.sub);
  });

  fastify.post("/api/embed/chat", { preHandler: [validate({ body: embedChatSchema })] }, async (request) => {
    return service.processEmbedChat(request.body as EmbedChatInput);
  });
}
