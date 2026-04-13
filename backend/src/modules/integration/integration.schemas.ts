import { z } from "zod";

export const integrationSettingsSchema = z.object({
  botName: z.string().min(1).max(80),
  themeColor: z.string().regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/),
  position: z.enum(["bottom-right", "bottom-left"]),
  language: z.string().min(2).max(8),
  launcherText: z.string().max(20).default("Chat"),
  launcherIcon: z.enum(["chat", "message", "sparkles", "none"]).default("chat"),
});

export const embedChatSchema = z.object({
  embedKey: z.string().min(16).max(128),
  message: z.string().min(1).max(4000),
  conversationId: z.string().uuid().optional(),
  language: z.string().min(2).max(8).optional(),
});

export type IntegrationSettingsInput = z.infer<typeof integrationSettingsSchema>;
export type EmbedChatInput = z.infer<typeof embedChatSchema>;
