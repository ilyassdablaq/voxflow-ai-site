import { beforeAll, afterEach, vi } from "vitest";
import dotenv from "dotenv";

// Load environment variables for tests
dotenv.config({ path: ".env.test" });
dotenv.config();

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
  process.env.JWT_SECRET = "test-jwt-secret-do-not-use-in-production";
  process.env.REFRESH_TOKEN_SECRET = "test-refresh-token-secret";
  process.env.JWT_EXPIRY = "15m";
  process.env.REFRESH_TOKEN_EXPIRY = "7d";
});

// Cleanup after each test
afterEach(() => {
  vi.clearAllMocks();
});

// Suppress console output during tests (optional)
global.console.error = vi.fn();
global.console.warn = vi.fn();
