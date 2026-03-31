import { beforeAll, afterEach, vi } from "vitest";
import dotenv from "dotenv";

// Load environment variables for tests
dotenv.config({ path: ".env.test" });
dotenv.config();

// Ensure required env vars exist before any module imports env.ts
process.env.NODE_ENV ||= "test";
process.env.APP_ORIGIN ||= "http://localhost:3000";
process.env.DATABASE_URL ||= "postgresql://postgres:postgres@localhost:5432/voxai_test";
process.env.REDIS_URL ||= "redis://localhost:6379";
process.env.JWT_ACCESS_SECRET ||= "test-access-secret-123456";
process.env.JWT_REFRESH_SECRET ||= "test-refresh-secret-123456";
process.env.JWT_ACCESS_EXPIRES_IN ||= "15m";
process.env.JWT_REFRESH_EXPIRES_IN ||= "7d";

// Mock external services
vi.mock("@/config/logger", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    trace: vi.fn(),
  },
}));

// Global test setup
beforeAll(() => {
  process.env.NODE_ENV = "test";
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Suppress console output during tests (optional)
global.console.error = vi.fn();
global.console.warn = vi.fn();
