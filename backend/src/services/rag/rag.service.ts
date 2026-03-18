import { prisma } from "../../infra/database/prisma.js";

export class RagService {
  async retrieveContext(queryEmbedding: number[], topK = 3): Promise<string[]> {
    const embeddingSql = `[${queryEmbedding.join(",")}]`;

    const rows = (await prisma.$queryRawUnsafe(
      `SELECT kc."chunkText" as chunk_text
       FROM "KnowledgeChunk" kc
       ORDER BY kc.embedding <-> '${embeddingSql}'::vector
       LIMIT ${topK}`,
    )) as Array<{ chunk_text: string }>;

    return rows.map((row: { chunk_text: string }) => row.chunk_text);
  }

  buildPrompt(userMessage: string, contexts: string[]): string {
    const contextText = contexts.length > 0 ? contexts.join("\n\n") : "No relevant context found.";
    return `You are VoxAI assistant. Use the context when relevant.\n\nContext:\n${contextText}\n\nUser:\n${userMessage}`;
  }
}
