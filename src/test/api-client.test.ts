import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/services/auth.service", () => ({
  authService: {
    getAccessToken: vi.fn(),
    getRefreshToken: vi.fn(),
    refreshTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

import { apiClient } from "@/lib/api-client";
import { authService } from "@/services/auth.service";

const mockedAuth = vi.mocked(authService);

describe("apiClient", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    mockedAuth.getAccessToken.mockReturnValue("token-1");
    mockedAuth.getRefreshToken.mockReturnValue("refresh-1");
  });

  it("returns parsed JSON on success", async () => {
    const fetchSpy = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );

    const result = await apiClient.get<{ ok: boolean }>("/api/test");

    expect(result.ok).toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries once after token refresh on 401", async () => {
    mockedAuth.refreshTokens.mockResolvedValue({ accessToken: "token-2", refreshToken: "refresh-2" });

    const fetchSpy = vi
      .spyOn(global, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: "abc" }), { status: 200 }));

    const result = await apiClient.get<{ id: string }>("/api/retry");

    expect(result.id).toBe("abc");
    expect(mockedAuth.refreshTokens).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("clears tokens when refresh fails", async () => {
    mockedAuth.refreshTokens.mockRejectedValue(new Error("refresh failed"));

    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );

    await expect(apiClient.get("/api/protected")).rejects.toThrow("Unauthorized");
    expect(mockedAuth.clearTokens).toHaveBeenCalledTimes(1);
  });
});
