import { z } from "zod";

export const contactSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  company: z.string().max(120).optional(),
  message: z.string().min(5).max(4000),
});

export type ContactInput = z.infer<typeof contactSchema>;
