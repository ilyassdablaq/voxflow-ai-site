import { FastifyInstance } from "fastify";
import { RawData, WebSocket } from "ws";
import { AppError } from "../../common/errors/app-error.js";
import { AiOrchestratorService } from "../../services/ai/ai-orchestrator.service.js";
import { ConversationRepository } from "../../modules/conversation/conversation.repository.js";

export function registerWebSocketGateway(
  fastify: FastifyInstance,
  aiOrchestratorService: AiOrchestratorService,
  conversationRepository: ConversationRepository,
): void {
  fastify.get("/ws/conversations/:id", { websocket: true }, (socket, request) => {
    const { id: conversationId } = request.params as { id: string };

    socket.on("message", async (message: RawData) => {
      try {
        const payload = JSON.parse(String(message)) as {
          type: "audio_chunk" | "text_message";
          data: string;
          language?: string;
        };

        if (!payload.type || !payload.data) {
          throw new AppError(400, "INVALID_WS_PAYLOAD", "Invalid WebSocket payload");
        }

        if (payload.type === "text_message") {
          await conversationRepository.createMessage({
            conversationId,
            role: "USER",
            content: payload.data,
          });

          const ai = await aiOrchestratorService.streamTextTurn(
            {
              text: payload.data,
              language: payload.language ?? "en",
            },
            (token) => {
              socket.send(
                JSON.stringify({
                  type: "assistant_delta",
                  data: { token },
                }),
              );
            },
          );

          await conversationRepository.createMessage({
            conversationId,
            role: "ASSISTANT",
            content: ai.responseText,
            tokenCount: ai.tokenCount,
            audioUrl: `data:${ai.audioMimeType};base64,${ai.audioBase64}`,
          });

          socket.send(
            JSON.stringify({
              type: "assistant_response",
              data: {
                text: ai.responseText,
                audioBase64: ai.audioBase64,
                audioMimeType: ai.audioMimeType,
                tokenCount: ai.tokenCount,
                promptTokens: ai.promptTokens,
                completionTokens: ai.completionTokens,
              },
            }),
          );
          return;
        }

        const ai = await aiOrchestratorService.processVoiceTurn({
          audioChunk: Buffer.from(payload.data, "base64"),
          language: payload.language ?? "en",
        });

        await conversationRepository.createMessage({
          conversationId,
          role: "USER",
          content: ai.transcript,
        });

        await conversationRepository.createMessage({
          conversationId,
          role: "ASSISTANT",
          content: ai.responseText,
          tokenCount: ai.tokenCount,
          audioUrl: `data:${ai.audioMimeType};base64,${ai.audioBase64}`,
        });

        socket.send(
          JSON.stringify({
            type: "transcription",
            data: { transcript: ai.transcript, durationSeconds: ai.sttDurationSeconds },
          }),
        );
        socket.send(
          JSON.stringify({
            type: "assistant_response",
            data: {
              text: ai.responseText,
              audioBase64: ai.audioBase64,
              audioMimeType: ai.audioMimeType,
              tokenCount: ai.tokenCount,
              promptTokens: ai.promptTokens,
              completionTokens: ai.completionTokens,
              ttsDurationSeconds: ai.ttsDurationSeconds,
            },
          }),
        );
      } catch (error) {
        const typedSocket = socket as WebSocket;
        typedSocket.send(
          JSON.stringify({
            type: "error",
            error: {
              message: error instanceof Error ? error.message : "Unknown error",
            },
          }),
        );
      }
    });
  });
}
