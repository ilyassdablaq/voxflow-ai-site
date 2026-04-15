import { AppError } from "../../common/errors/app-error.js";
import { ConversationRepository } from "../conversation/conversation.repository.js";
import { AiOrchestratorService } from "../../services/ai/ai-orchestrator.service.js";
import { IntegrationRepository } from "./integration.repository.js";
import { EmbedChatInput, IntegrationSettingsInput } from "./integration.schemas.js";
import { assertTenantAccess } from "../../common/services/tenant-guard.service.js";

export class IntegrationService {
  constructor(
    private readonly repository: IntegrationRepository,
    private readonly conversationRepository: ConversationRepository,
    private readonly aiOrchestratorService: AiOrchestratorService,
  ) {}

  async getSettings(userId: string) {
    return this.repository.getOrCreateByUserId(userId);
  }

  async updateSettings(userId: string, payload: IntegrationSettingsInput) {
    return this.repository.updateSettings(userId, payload);
  }

  async regenerateEmbedKey(userId: string) {
    return this.repository.regenerateEmbedKey(userId);
  }

  async processEmbedChat(payload: EmbedChatInput) {
    const integration = await this.repository.getByEmbedKey(payload.embedKey);
    if (!integration) {
      throw new AppError(401, "INVALID_EMBED_KEY", "Invalid embed key");
    }
    const maxSessionQuestions = Math.max(1, integration.maxSessionQuestions || 3);

    let conversationId = payload.conversationId;
    if (conversationId) {
      const conversation = await this.conversationRepository.getConversationById(conversationId);
      if (!conversation) {
        throw new AppError(404, "CONVERSATION_NOT_FOUND", "Conversation not found");
      }

      try {
        assertTenantAccess(conversation.userId, integration.userId, "conversation");
      } catch {
        throw new AppError(403, "FORBIDDEN", "Conversation does not belong to this embed key");
      }

      if (conversation.status === "ENDED") {
        throw new AppError(429, "EMBED_SESSION_LIMIT_REACHED", `This chat session has reached the ${maxSessionQuestions}-question limit.`);
      }
    } else {
      const conversation = await this.conversationRepository.createConversation({
        userId: integration.userId,
        title: `Website Chat - ${integration.botName}`,
        language: payload.language ?? integration.language,
      });
      conversationId = conversation.id;
    }

    const userMessageCount = await this.conversationRepository.countMessagesByRole(conversationId, "USER");
    if (userMessageCount >= maxSessionQuestions) {
      await this.conversationRepository.markConversationEnded(conversationId);
      throw new AppError(429, "EMBED_SESSION_LIMIT_REACHED", `This chat session has reached the ${maxSessionQuestions}-question limit.`);
    }

    await this.conversationRepository.createMessage({
      conversationId,
      role: "USER",
      content: payload.message,
    });

    const conversationHistory = await this.conversationRepository.getRecentMessages(conversationId, 20);
    const ai = await this.aiOrchestratorService.processTextTurn({
      userId: integration.userId,
      text: payload.message,
      language: payload.language ?? integration.language,
      history: conversationHistory.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    });

    const assistantMessage = await this.conversationRepository.createMessage({
      conversationId,
      role: "ASSISTANT",
      content: ai.responseText,
      tokenCount: ai.tokenCount,
      audioUrl: `data:${ai.audioMimeType};base64,${ai.audioBase64}`,
    });

    const questionCount = userMessageCount + 1;
    const remainingQuestions = Math.max(0, maxSessionQuestions - questionCount);
    const sessionCompleted = questionCount >= maxSessionQuestions;

    if (sessionCompleted) {
      await this.conversationRepository.markConversationEnded(conversationId);
    }

    return {
      conversationId,
      botName: integration.botName,
      maxSessionQuestions,
      remainingQuestions,
      sessionCompleted,
      message: {
        id: assistantMessage.id,
        role: "ASSISTANT",
        content: ai.responseText,
        createdAt: assistantMessage.createdAt,
      },
    };
  }
}
