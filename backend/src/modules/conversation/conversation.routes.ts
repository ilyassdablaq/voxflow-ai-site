import { FastifyInstance } from "fastify";
import { authenticate } from "../../common/middleware/auth-middleware.js";
import { validate } from "../../common/middleware/validate.js";
import { UsageService } from "../billing/usage.service.js";
import { AiOrchestratorService } from "../../services/ai/ai-orchestrator.service.js";
import { RagService } from "../../services/rag/rag.service.js";
import { ConversationRepository } from "./conversation.repository.js";
import { ConversationService } from "./conversation.service.js";
import {
  conversationIdParamSchema,
  createConversationSchema,
  CreateConversationInput,
  listConversationsQuerySchema,
  ListConversationsQuery,
  updateConversationSchema,
  UpdateConversationInput,
} from "./conversation.schemas.js";

export async function conversationRoutes(fastify: FastifyInstance): Promise<void> {
  const repository = new ConversationRepository();
  const service = new ConversationService(repository, new UsageService(), new AiOrchestratorService(new RagService()));

  fastify.get(
    "/api/conversations",
    { preHandler: [authenticate, validate({ query: listConversationsQuerySchema })] },
    async (request) => {
      const user = request.user as { sub: string };
      const { page, limit } = request.query as ListConversationsQuery;
      return service.listConversations(user.sub, page, limit);
    },
  );

  fastify.post(
    "/api/conversations",
    { preHandler: [authenticate, validate({ body: createConversationSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const conversation = await service.createConversation(request.body as CreateConversationInput, user.sub);
      return reply.status(201).send(conversation);
    },
  );

  fastify.get(
    "/api/conversations/:id/messages",
    { preHandler: [authenticate, validate({ params: conversationIdParamSchema })] },
    async (request) => {
      const user = request.user as { sub: string };
      const { id } = request.params as { id: string };
      return service.getConversationMessages(id, user.sub);
    },
  );

  fastify.patch(
    "/api/conversations/:id",
    { preHandler: [authenticate, validate({ params: conversationIdParamSchema, body: updateConversationSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const { id } = request.params as { id: string };
      await service.renameConversation(id, user.sub, request.body as UpdateConversationInput);
      return reply.status(204).send();
    },
  );

  fastify.delete(
    "/api/conversations/:id",
    { preHandler: [authenticate, validate({ params: conversationIdParamSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const { id } = request.params as { id: string };
      await service.deleteConversation(id, user.sub);
      return reply.status(204).send();
    },
  );
}
