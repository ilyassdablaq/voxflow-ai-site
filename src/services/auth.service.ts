import { API_BASE } from "@/lib/api-config";

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface ApiErrorShape {
  message?: string;
}

async function parseAuthError(response: Response, fallback: string): Promise<Error> {
  try {
    const error = (await response.json()) as ApiErrorShape;
    return new Error(error.message || fallback);
  } catch {
    return new Error(fallback);
  }
}

export const authService = {
  async register(email: string, password: string, fullName: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, fullName }),
    });

    if (!response.ok) throw await parseAuthError(response, "Registration failed");

    return response.json();
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) throw await parseAuthError(response, "Login failed");

    return response.json();
  },

  async refreshTokens(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      throw new Error("Missing refresh token");
    }

    const response = await fetch(`${API_BASE}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) throw await parseAuthError(response, "Token refresh failed");

    const tokens = (await response.json()) as { accessToken: string; refreshToken: string };
    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  },

  setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  },

  getAccessToken(): string | null {
    return localStorage.getItem("accessToken");
  },

  getRefreshToken(): string | null {
    return localStorage.getItem("refreshToken");
  },

  clearTokens(): void {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
  },

  isLoggedIn(): boolean {
    return !!this.getAccessToken();
  },
};
