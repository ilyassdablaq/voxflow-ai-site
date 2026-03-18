import { FastifyRequest } from "fastify";
import { z, ZodTypeAny } from "zod";
import { AppError } from "../errors/app-error.js";

type ValidationSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

export function validate(schemas: ValidationSchemas) {
  return async function validator(request: FastifyRequest): Promise<void> {
    try {
      if (schemas.body) {
        request.body = schemas.body.parse(request.body);
      }
      if (schemas.params) {
        request.params = schemas.params.parse(request.params);
      }
      if (schemas.query) {
        request.query = schemas.query.parse(request.query);
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new AppError(400, "VALIDATION_ERROR", "Request validation failed", error.flatten());
      }
      throw error;
    }
  };
}
