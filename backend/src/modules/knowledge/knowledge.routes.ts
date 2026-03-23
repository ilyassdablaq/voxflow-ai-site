import { FastifyInstance } from "fastify";
import { authenticate } from "../../common/middleware/auth-middleware.js";
import { validate } from "../../common/middleware/validate.js";
import { RagService } from "../../services/rag/rag.service.js";
import { KnowledgeService } from "./knowledge.service.js";
import {
  documentIdParamSchema,
  IngestFileInput,
  IngestStructuredInput,
  IngestUrlInput,
  ingestFileSchema,
  ingestStructuredSchema,
  ingestUrlSchema,
} from "./knowledge.schemas.js";

export async function knowledgeRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new KnowledgeService(new RagService());

  fastify.get("/api/knowledge/documents", { preHandler: [authenticate] }, async (request) => {
    const user = request.user as { sub: string };
    return service.listDocuments(user.sub);
  });

  fastify.post(
    "/api/knowledge/ingest/file",
    { preHandler: [authenticate, validate({ body: ingestFileSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const result = await service.ingestFile(user.sub, request.body as IngestFileInput);
      return reply.status(201).send(result);
    },
  );

  fastify.post(
    "/api/knowledge/ingest/structured",
    { preHandler: [authenticate, validate({ body: ingestStructuredSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const result = await service.ingestStructured(user.sub, request.body as IngestStructuredInput);
      return reply.status(201).send(result);
    },
  );

  fastify.post(
    "/api/knowledge/ingest/url",
    { preHandler: [authenticate, validate({ body: ingestUrlSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const result = await service.ingestUrl(user.sub, request.body as IngestUrlInput);
      return reply.status(201).send(result);
    },
  );

  fastify.delete(
    "/api/knowledge/documents/:id",
    { preHandler: [authenticate, validate({ params: documentIdParamSchema })] },
    async (request, reply) => {
      const user = request.user as { sub: string };
      const { id } = request.params as { id: string };
      await service.deleteDocument(user.sub, id);
      return reply.status(204).send();
    },
  );
}
