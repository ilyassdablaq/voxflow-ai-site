import Fastify, { FastifyInstance } from "fastify";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registerSecurityPlugins } from "./security";

const mockApiKeyFindUnique = vi.fn();
const mockCheckRequestLimit = vi.fn();
const mockGetEffectivePlanAccess = vi.fn();
const mockLoggerWarn = vi.fn();
const mockLoggerError = vi.fn();

vi.mock("../../config/env.js", () => ({
  env: {
    NODE_ENV: "test",
    JWT_ACCESS_SECRET: "test-access-secret",
    JWT_REFRESH_SECRET: "test-refresh-secret",
  },
}));

vi.mock("../../infra/cache/redis.js", () => ({
  redis: {},
}));

vi.mock("../../infra/database/prisma.js", () => ({
  prisma: {
    aPIKey: {
      findUnique: mockApiKeyFindUnique,
    },
  },
}));

vi.mock("../services/plan-rate-limit.service.js", () => ({
  rateLimitService: {
    checkRequestLimit: mockCheckRequestLimit,
  },
}));

vi.mock("../services/plan-check.service.js", () => ({
  PlanCheckService: vi.fn().mockImplementation(() => ({
    getEffectivePlanAccess: mockGetEffectivePlanAccess,
  })),
}));

vi.mock("../../config/logger.js", () => ({
  logger: {
    warn: mockLoggerWarn,
    error: mockLoggerError,
  },
}));

describe("registerSecurityPlugins", () => {
  let app: FastifyInstance | undefined;

  async function setupApp() {
    app = Fastify();
    app.decorateRequest("user", null);

    app.addHook("onRequest", async (request) => {
      const serializedUser = request.headers["x-test-user"];
      if (typeof serializedUser === "string") {
        (request as any).user = JSON.parse(serializedUser);
      }
    });

    await registerSecurityPlugins(app);

    app.get("/test", async (request) => ({
      ok: true,
      userPlan: (request as any).userPlan ?? null,
    }));

    await app.ready();
  }

  beforeEach(() => {
    vi.clearAllMocks();
    mockApiKeyFindUnique.mockResolvedValue(null);
    mockCheckRequestLimit.mockResolvedValue(true);
    mockGetEffectivePlanAccess.mockResolvedValue({ type: "FREE" });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it("registers the security plugins and serves anonymous requests", async () => {
    await setupApp();

    const response = await app!.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      userPlan: null,
    });
  });

  it("allows all origins by default for CORS preflight requests", async () => {
    await setupApp();

    const response = await app!.inject({
      method: "OPTIONS",
      url: "/test",
      headers: {
        origin: "https://evil.com",
        "access-control-request-method": "GET",
      },
    });

    expect(response.statusCode).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe("https://evil.com");
  });

  it("returns 429 when the FREE plan minute rate limit is exceeded", async () => {
    mockGetEffectivePlanAccess.mockResolvedValueOnce({ type: "FREE" });
    mockCheckRequestLimit.mockResolvedValueOnce(false);

    await setupApp();

    const response = await app!.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-test-user": JSON.stringify({ sub: "user-1", type: "user" }),
      },
    });

    expect(response.statusCode).toBe(429);
    expect(mockCheckRequestLimit).toHaveBeenCalledWith("user:user-1", "FREE", "minute");
    expect(mockLoggerWarn).toHaveBeenCalled();
  });

  it("stores the authenticated user plan on the request context", async () => {
    mockGetEffectivePlanAccess.mockResolvedValueOnce({ type: "PRO" });

    await setupApp();

    const response = await app!.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-test-user": JSON.stringify({ sub: "user-2", type: "user" }),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      userPlan: "PRO",
    });
    expect(mockCheckRequestLimit).not.toHaveBeenCalled();
  });

  it("skips plan-based rate limiting for anonymous requests", async () => {
    await setupApp();

    const response = await app!.inject({
      method: "GET",
      url: "/test",
    });

    expect(response.statusCode).toBe(200);
    expect(mockGetEffectivePlanAccess).not.toHaveBeenCalled();
    expect(mockCheckRequestLimit).not.toHaveBeenCalled();
  });

  it("lets the request continue when plan-based rate limiting throws unexpectedly", async () => {
    mockGetEffectivePlanAccess.mockResolvedValueOnce({ type: "FREE" });
    mockCheckRequestLimit.mockRejectedValueOnce(new Error("rate limit service failure"));

    await setupApp();

    const response = await app!.inject({
      method: "GET",
      url: "/test",
      headers: {
        "x-test-user": JSON.stringify({ sub: "user-3", type: "user" }),
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      ok: true,
      userPlan: null,
    });
    expect(mockLoggerError).toHaveBeenCalled();
  });
});
