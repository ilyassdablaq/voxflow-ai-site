import { apiClient } from "@/lib/api-client";

export interface IntegrationSettings {
  userId: string;
  botName: string;
  themeColor: string;
  position: "bottom-right" | "bottom-left";
  language: string;
  launcherText: string;
  launcherIcon: "chat" | "message" | "sparkles" | "none";
  embedKey: string;
  updatedAt: string;
}

export const integrationService = {
  getSettings(): Promise<IntegrationSettings> {
    return apiClient.get<IntegrationSettings>("/api/integrations/settings");
  },

  updateSettings(payload: {
    botName: string;
    themeColor: string;
    position: "bottom-right" | "bottom-left";
    language: string;
    launcherText: string;
    launcherIcon: "chat" | "message" | "sparkles" | "none";
  }) {
    return apiClient.put<IntegrationSettings>("/api/integrations/settings", payload);
  },

  regenerateKey(): Promise<IntegrationSettings> {
    return apiClient.post<IntegrationSettings>("/api/integrations/regenerate-key", {});
  },
};
