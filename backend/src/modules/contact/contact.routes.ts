import { FastifyInstance } from "fastify";
import { authenticate } from "../../common/middleware/auth-middleware.js";
import { validate } from "../../common/middleware/validate.js";
import { ContactService } from "./contact.service.js";
import { ContactRepository } from "./contact.repository.js";
import { ContactInput, contactSchema } from "./contact.schemas.js";

export async function contactRoutes(fastify: FastifyInstance): Promise<void> {
  const service = new ContactService(new ContactRepository());

  fastify.post("/api/contact", { preHandler: [validate({ body: contactSchema })] }, async (request, reply) => {
    const authHeader = request.headers.authorization;
    let userId: string | undefined;

    if (authHeader) {
      try {
        await authenticate(request, reply);
        userId = (request.user as { sub: string }).sub;
      } catch {
        userId = undefined;
      }
    }

    const result = await service.create(request.body as ContactInput, userId);
    return reply.status(201).send(result);
  });
}
