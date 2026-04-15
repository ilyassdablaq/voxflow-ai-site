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

  async getRecentMessages(conversationId: string, limit: number) {
    const recent = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
      },
    });

    return recent.reverse();
  }

  async countMessagesByRole(conversationId: string, role: "USER" | "ASSISTANT" | "SYSTEM") {
    return prisma.message.count({
      where: {
        conversationId,
        role,
      },
    });
  }

  async markConversationEnded(conversationId: string) {
    return prisma.conversation.update({
      where: { id: conversationId },
      data: {
        status: "ENDED",
        endedAt: new Date(),
      },
    });
  }

  async listConversations(userId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    return prisma.conversation.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
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

  async deleteConversation(id: string, userId: string) {
    return prisma.conversation.deleteMany({
      where: {
        id,
        userId,
      },
    });
  }

  async updateConversationTitle(id: string, userId: string, title: string) {
    return prisma.conversation.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        title,
      },
    });
  }
}
