import "fastify";

declare module "fastify" {
  interface FastifyRequest {
    user?: {
      sub: string;
      email?: string;
      role?: "USER" | "ADMIN";
      type?: string;
    };
  }
}
