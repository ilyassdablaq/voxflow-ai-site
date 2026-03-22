import { z } from "zod";

export const createConversationSchema = z.object({
  title: z.string().max(120).optional(),
  language: z.string().min(2).max(8).default("en"),
  initialMessage: z.string().min(1).max(4000).optional(),
});

export const updateConversationSchema = z.object({
  title: z.string().min(1).max(120),
});

export const conversationIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const listConversationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreateConversationInput = z.infer<typeof createConversationSchema>;
export type UpdateConversationInput = z.infer<typeof updateConversationSchema>;
export type ListConversationsQuery = z.infer<typeof listConversationsQuerySchema>;
