import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";

vi.mock("@/hooks/use-auth", () => ({
  useAuth: vi.fn(),
}));

import { useAuth } from "@/hooks/use-auth";

describe("ProtectedRoute", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show loading state when authentication is in progress", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      isLoggedIn: false,
      user: null,
      subscription: null,
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByRole("status", { name: "loading-auth" })).toBeInTheDocument();
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should render children when user is logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isLoggedIn: true,
      user: { id: "123", email: "test@example.com" },
      subscription: null,
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.getByText("Protected Content")).toBeInTheDocument();
  });

  it("should redirect to sign-in when user is not logged in", () => {
    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isLoggedIn: false,
      user: null,
      subscription: null,
      logout: vi.fn(),
    } as any);

    render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    // Router should have redirected
    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });

  it("should not render protected content when loading finishes and user is not authenticated", async () => {
    const { rerender } = render(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    vi.mocked(useAuth).mockReturnValue({
      isLoading: true,
      isLoggedIn: false,
      user: null,
      subscription: null,
      logout: vi.fn(),
    } as any);

    rerender(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    vi.mocked(useAuth).mockReturnValue({
      isLoading: false,
      isLoggedIn: false,
      user: null,
      subscription: null,
      logout: vi.fn(),
    } as any);

    rerender(
      <BrowserRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </BrowserRouter>
    );

    expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
  });
});
