import { prisma } from "../../infra/database/prisma.js";

export class ConversationRepository {
  async createConversation(data: { userId: string; title?: string; language: string }) {
    return prisma.conversation.create({
      data,
      select: {
        id: true,
        userId: true,
        title: true,
        language: true,
        status: true,
        createdAt: true,
      },
    });
  }

  async createMessage(data: { conversationId: string; role: "USER" | "ASSISTANT" | "SYSTEM"; content: string; tokenCount?: number | null; audioUrl?: string | null }) {
    return prisma.message.create({ data });
  }

  async getConversationById(id: string) {
    return prisma.conversation.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        title: true,
        status: true,
        language: true,
      },
    });
  }

  async getMessages(conversationId: string) {
    return prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        role: true,
        content: true,
        tokenCount: true,
        audioUrl: true,
        createdAt: true,
      },
    });
  }
}
