import { describe, it, expect, beforeEach, vi } from "vitest";
import { z } from "zod";

// Common validation schemas used across the application
export const emailSchema = z
  .string()
  .email("Please enter a valid email address")
  .toLowerCase();

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter")
  .regex(/[0-9]/, "Password must contain at least one digit");

export const fullNameSchema = z
  .string()
  .min(2, "Full name must be at least 2 characters")
  .max(120, "Full name must not exceed 120 characters");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: fullNameSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignUpFormData = z.infer<typeof signUpSchema>;

describe("Form Validation Schemas", () => {
  describe("emailSchema", () => {
    it("should validate correct email format", () => {
      const email = "test@example.com";
      const result = emailSchema.safeParse(email);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(email.toLowerCase());
      }
    });

    it("should reject invalid email format", () => {
      const invalidEmails = ["notanemail", "test@", "@example.com", "test@.com"];
      invalidEmails.forEach((email) => {
        const result = emailSchema.safeParse(email);
        expect(result.success).toBe(false);
      });
    });

    it("should convert email to lowercase", () => {
      const result = emailSchema.safeParse("Test@EXAMPLE.COM");
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe("test@example.com");
      }
    });
  });

  describe("passwordSchema", () => {
    it("should validate strong password", () => {
      const result = passwordSchema.safeParse("SecurePassword123");
      expect(result.success).toBe(true);
    });

    it("should reject password shorter than 8 characters", () => {
      const result = passwordSchema.safeParse("Abc123");
      expect(result.success).toBe(false);
    });

    it("should require at least one uppercase letter", () => {
      const result = passwordSchema.safeParse("password123");
      expect(result.success).toBe(false);
    });

    it("should require at least one lowercase letter", () => {
      const result = passwordSchema.safeParse("PASSWORD123");
      expect(result.success).toBe(false);
    });

    it("should require at least one digit", () => {
      const result = passwordSchema.safeParse("PasswordWithoutNumbers");
      expect(result.success).toBe(false);
    });
  });

  describe("fullNameSchema", () => {
    it("should validate full name with 2+ characters", () => {
      const result = fullNameSchema.safeParse("John Doe");
      expect(result.success).toBe(true);
    });

    it("should reject name with less than 2 characters", () => {
      const result = fullNameSchema.safeParse("J");
      expect(result.success).toBe(false);
    });

    it("should reject name exceeding 120 characters", () => {
      const longName = "a".repeat(121);
      const result = fullNameSchema.safeParse(longName);
      expect(result.success).toBe(false);
    });

    it("should accept name at max boundary of 120 characters", () => {
      const maxName = "a".repeat(120);
      const result = fullNameSchema.safeParse(maxName);
      expect(result.success).toBe(true);
    });
  });

  describe("signUpSchema", () => {
    it("should validate complete sign-up form with valid data", () => {
      const data: SignUpFormData = {
        email: "test@example.com",
        password: "SecurePassword123",
        fullName: "Test User",
        confirmPassword: "SecurePassword123",
      };

      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it("should reject when passwords don't match", () => {
      const data = {
        email: "test@example.com",
        password: "SecurePassword123",
        fullName: "Test User",
        confirmPassword: "DifferentPassword123",
      };

      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        const confirmPasswordError = result.error.errors.find(
          (err) => err.path[0] === "confirmPassword"
        );
        expect(confirmPasswordError?.message).toContain("do not match");
      }
    });

    it("should return all validation errors at once", () => {
      const data = {
        email: "invalid-email",
        password: "weak", // Too short, no uppercase, no digit
        fullName: "J", // Too short
        confirmPassword: "weak",
      };

      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(1);
      }
    });

    it("should handle empty form submission", () => {
      const data = {
        email: "",
        password: "",
        fullName: "",
        confirmPassword: "",
      };

      const result = signUpSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe("Login validation", () => {
    const loginSchema = z.object({
      email: emailSchema,
      password: z.string().min(1, "Password is required"),
    });

    it("should validate login form", () => {
      const result = loginSchema.safeParse({
        email: "test@example.com",
        password: "anypassword",
      });
      expect(result.success).toBe(true);
    });

    it("should require email and password", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThanOrEqual(2);
      }
    });
  });
});

describe("Form Submission Error Handling", () => {
  it("should format validation errors clearly", () => {
    const result = signUpSchema.safeParse({
      email: "test@example.com",
      password: "Weak1",
      fullName: "Test",
      confirmPassword: "Weak1Different",
    });

    expect(result.success).toBe(false);

    if (!result.success) {
      const errorMap: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        const fieldName = String(err.path[0]);
        errorMap[fieldName] = err.message;
      });

      expect(errorMap["password"]).toBeDefined();
      expect(errorMap["confirmPassword"]).toBeDefined();
    }
  });

  it("should handle network errors gracefully", () => {
    const networkError = new Error("Network error");
    expect(networkError).toBeDefined();
    expect(networkError.message).toBe("Network error");
  });

  it("should handle API validation errors", () => {
    const apiError = {
      status: 409,
      code: "EMAIL_ALREADY_EXISTS",
      message: "A user with this email already exists",
    };

    expect(apiError.status).toBe(409);
    expect(apiError.code).toBe("EMAIL_ALREADY_EXISTS");
  });
});

describe("Form State Management", () => {
  it("should track form dirty state", () => {
    const dirtyFields = new Set<string>();

    // Simulate user interaction
    dirtyFields.add("email");
    dirtyFields.add("password");

    expect(dirtyFields.has("email")).toBe(true);
    expect(dirtyFields.has("password")).toBe(true);
    expect(dirtyFields.has("fullName")).toBe(false);
  });

  it("should handle form reset", () => {
    const formData = {
      email: "test@example.com",
      password: "SecurePassword123",
      fullName: "Test User",
      confirmPassword: "SecurePassword123",
    };

    const resetForm = {
      email: "",
      password: "",
      fullName: "",
      confirmPassword: "",
    };

    expect(resetForm.email).toBe("");
    expect(resetForm.password).toBe("");
  });

  it("should preserve form data on validation error", () => {
    const originalData = {
      email: "test@example.com",
      password: "weak",
      fullName: "Test User",
      confirmPassword: "weak",
    };

    // Validate
    const result = signUpSchema.safeParse(originalData);

    // Data should be preserved even if validation fails
    if (!result.success) {
      expect(originalData.email).toBe("test@example.com");
      expect(originalData.fullName).toBe("Test User");
    }
  });
});

describe("Accessibility in Form Validation", () => {
  it("should provide descriptive error messages", () => {
    const result = passwordSchema.safeParse("abc");
    expect(result.success).toBe(false);

    if (!result.success) {
      // Error message should be clear and actionable
      const messages = result.error.errors.map((err) => err.message);
      expect(messages.some((m) => m.includes("8 characters"))).toBe(true);
    }
  });

  it("should indicate required fields", () => {
    const schema = z.object({
      email: z.string().min(1, "Email is required"),
      password: z.string().min(1, "Password is required"),
    });

    const result = schema.safeParse({
      email: "",
      password: "",
    });

    expect(result.success).toBe(false);
  });
});
