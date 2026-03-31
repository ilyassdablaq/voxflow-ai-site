import { logger } from "../../config/logger.js";

/**
 * Standardized error handling for production applications
 * Provides consistent error responses, logging, and user-friendly messages
 */

export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        status: this.status,
        ...(this.details && { details: this.details }),
      },
    };
  }
}

/**
 * Common error codes and their meanings
 */
export const ERROR_CODES = {
  // Authentication errors
  INVALID_CREDENTIALS: { status: 401, message: "Invalid email or password" },
  UNAUTHORIZED: { status: 401, message: "Unauthorized access" },
  INVALID_TOKEN: { status: 401, message: "Invalid or expired token" },
  TOKEN_EXPIRED: { status: 401, message: "Token has expired" },

  // Authorization errors
  FORBIDDEN: { status: 403, message: "Access denied" },
  PLAN_UPGRADE_REQUIRED: { status: 403, message: "This feature requires a paid plan" },

  // Validation errors
  INVALID_REQUEST: { status: 400, message: "Invalid request parameters" },
  VALIDATION_ERROR: { status: 400, message: "Validation failed" },

  // Resource errors
  NOT_FOUND: { status: 404, message: "Resource not found" },
  SUBSCRIPTION_NOT_FOUND: { status: 404, message: "Subscription not found" },
  PLAN_NOT_FOUND: { status: 404, message: "Plan not found" },

  // Conflict errors
  EMAIL_ALREADY_EXISTS: { status: 409, message: "Email already exists" },
  DUPLICATE_RESOURCE: { status: 409, message: "Resource already exists" },

  // Rate limiting
  TOO_MANY_REQUESTS: { status: 429, message: "Too many requests" },

  // Server errors
  INTERNAL_SERVER_ERROR: { status: 500, message: "Internal server error" },
  DATABASE_ERROR: { status: 500, message: "Database error" },
  EXTERNAL_SERVICE_ERROR: { status: 503, message: "External service unavailable" },
} as const;

/**
 * Safe error handler - converts any error to AppError
 */
export function createErrorResponse(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Log the full error for debugging
    logger.error({ error: error.message, stack: error.stack }, "Unexpected error");

    // Return generic error to client
    return new AppError(
      500,
      "INTERNAL_SERVER_ERROR",
      "An unexpected error occurred. Please try again later.",
    );
  }

  logger.error(error, "Unknown error type");
  return new AppError(500, "INTERNAL_SERVER_ERROR", "An unexpected error occurred");
}

/**
 * Async error wrapper for Express/Fastify handlers
 * Automatically catches and converts errors to AppError
 */
export function catchAsync<T extends any[], R>(
  handler: (...args: T) => Promise<R>,
): (...args: T) => Promise<R> {
  return async (...args: T): Promise<R> => {
    try {
      return await handler(...args);
    } catch (error) {
      throw createErrorResponse(error);
    }
  };
}

/**
 * Validation error handler
 */
export function createValidationError(errors: Record<string, string[]>): AppError {
  return new AppError(400, "VALIDATION_ERROR", "Validation failed", {
    errors,
  });
}

/**
 * Rate limiting error
 */
export function createRateLimitError(retryAfter: number): AppError {
  return new AppError(
    429,
    "TOO_MANY_REQUESTS",
    "Too many requests. Please try again later.",
    {
      retryAfter,
    },
  );
}

/**
 * Feature access error (for plan-gated features)
 */
export function createPlanUpgradeError(feature: string): AppError {
  return new AppError(
    403,
    "PLAN_UPGRADE_REQUIRED",
    `${feature} is available with a paid plan upgrade`,
    { feature },
  );
}

/**
 * Production-safe logging that doesn't expose sensitive data
 */
export function logError(error: unknown, context: string) {
  const sanitized = {
    context,
    timestamp: new Date().toISOString(),
    ...(error instanceof AppError && {
      code: error.code,
      status: error.status,
      message: error.message,
    }),
    ...(error instanceof Error && {
      name: error.name,
      message: error.message,
      // Stack trace in dev only
      ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
    }),
  };

  logger.error(sanitized);
}

/**
 * Log successful operations for audit trail
 */
export function logAudit(userId: string, action: string, details?: Record<string, unknown>) {
  logger.info(
    {
      userId,
      action,
      timestamp: new Date().toISOString(),
      ...details,
    },
    "Audit trail",
  );
}

/**
 * Validation helpers for common fields
 */
export const validators = {
  email: (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { valid: false, error: "Invalid email format" };
    }
    return { valid: true };
  },

  password: (password: string): { valid: boolean; error?: string } => {
    if (password.length < 8) {
      return { valid: false, error: "Password must be at least 8 characters" };
    }
    if (!/[A-Z]/.test(password)) {
      return { valid: false, error: "Password must contain uppercase letter" };
    }
    if (!/[a-z]/.test(password)) {
      return { valid: false, error: "Password must contain lowercase letter" };
    }
    if (!/[0-9]/.test(password)) {
      return { valid: false, error: "Password must contain digit" };
    }
    return { valid: true };
  },

  url: (url: string): { valid: boolean; error?: string } => {
    try {
      new URL(url);
      return { valid: true };
    } catch {
      return { valid: false, error: "Invalid URL" };
    }
  },

  uuid: (uuid: string): { valid: boolean; error?: string } => {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(uuid)) {
      return { valid: false, error: "Invalid UUID format" };
    }
    return { valid: true };
  },
};

/**
 * Security utilities
 */
export const security = {
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>]/g, "")
      .replace(/javascript:/gi, "")
      .trim();
  },

  /**
   * Check if URL is safe (internal only)
   */
  isSafeRedirectUrl: (url: string, allowedDomains: string[] = []): boolean => {
    try {
      const parsed = new URL(url);
      // Only allow relative URLs or whitelisted domains
      return (
        !parsed.href.toLowerCase().includes("javascript:") &&
        allowedDomains.some((domain) => parsed.hostname.endsWith(domain))
      );
    } catch {
      // Relative URLs
      return url.startsWith("/") && !url.includes("..") && !url.toLowerCase().includes("javascript:");
    }
  },

  /**
   * Rate limit key generator
   */
  getRateLimitKey: (identifier: string, type: string): string => {
    return `ratelimit:${type}:${identifier}`;
  },
};

/**
 * Retry logic for transient failures
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === maxAttempts) {
        break;
      }

      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs,
      );

      logger.warn(
        { attempt, delayMs, error: lastError.message },
        "Retry attempt",
      );

      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  throw lastError;
}
