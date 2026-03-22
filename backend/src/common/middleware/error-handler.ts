import { FastifyError, FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { AppError } from "../errors/app-error.js";
import { logger } from "../../config/logger.js";

export function errorHandler(error: FastifyError | Error, _request: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof ZodError) {
    reply.status(400).send({
      error: {
        code: "VALIDATION_ERROR",
        message: "Request validation failed",
        details: error.flatten(),
      },
    });
    return;
  }

  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
    });
    return;
  }

  logger.error({ error }, "Unhandled server error");

  reply.status(500).send({
    error: {
      code: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong",
    },
  });
}
