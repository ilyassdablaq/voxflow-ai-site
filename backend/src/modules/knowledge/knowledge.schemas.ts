import { z } from "zod";

export const ingestFileSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  contentBase64: z.string().min(1),
});

export const ingestStructuredSchema = z.object({
  format: z.enum(["json", "xml"]),
  title: z.string().min(1).max(255),
  content: z.string().min(2),
});

export const ingestUrlSchema = z.object({
  url: z.string().url(),
  maxPages: z.coerce.number().int().min(1).max(10).default(4),
});

export const documentIdParamSchema = z.object({
  id: z.string().uuid(),
});

export type IngestFileInput = z.infer<typeof ingestFileSchema>;
export type IngestStructuredInput = z.infer<typeof ingestStructuredSchema>;
export type IngestUrlInput = z.infer<typeof ingestUrlSchema>;
