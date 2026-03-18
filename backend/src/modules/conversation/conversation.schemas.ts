import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(120).optional(),
  language: z.string().min(2).max(8).default("en"),
  initialMessage: z.string().min(1).max(4000).optional(),
});

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
