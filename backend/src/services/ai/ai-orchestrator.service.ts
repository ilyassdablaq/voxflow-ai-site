import { logger } from "../../config/logger.js";
import { RagService } from "../rag/rag.service.js";
import { ChatMessage, LlmGenerationResult, MockLlmProvider, ProviderSet, SttResult, TtsResult, createProviders } from "./providers.js";

export class AiOrchestratorService {
  private readonly providers: ProviderSet;

  constructor(private readonly ragService: RagService) {
    this.providers = createProviders();
  }

  async processVoiceTurn(input: { audioChunk: Buffer; language: string; syntheticEmbedding?: number[] }) {
    const sttResult = await this.transcribe(input.audioChunk, input.language);

    const embedding = input.syntheticEmbedding ?? new Array<number>(1536).fill(0.001);
    const contexts = await this.ragService.retrieveContext(embedding, 3);
    const ragContext = this.ragService.buildPrompt(sttResult.text, contexts);

    const llmResult = await this.generateText(ragContext, [
      {
        role: "user",
        content: sttResult.text,
      },
    ]);

    const ttsResult = await this.speak(llmResult.text, input.language);

    return {
      transcript: sttResult.text,
      responseText: llmResult.text,
      tokenCount: llmResult.usage.totalTokens,
      promptTokens: llmResult.usage.promptTokens,
      completionTokens: llmResult.usage.completionTokens,
      audioBuffer: ttsResult.audioBuffer,
      audioBase64: ttsResult.audioBuffer.toString("base64"),
      audioMimeType: ttsResult.mimeType,
      sttDurationSeconds: sttResult.durationSeconds,
      ttsDurationSeconds: ttsResult.durationSeconds,
      ragContextCount: contexts.length,
    };
  }

  async processTextTurn(input: { text: string; language: string; syntheticEmbedding?: number[] }) {
    const embedding = input.syntheticEmbedding ?? new Array<number>(1536).fill(0.001);
    const contexts = await this.ragService.retrieveContext(embedding, 3);
    const ragContext = this.ragService.buildPrompt(input.text, contexts);

    const llmResult = await this.generateText(ragContext, [
      {
        role: "user",
        content: input.text,
      },
    ]);

    const ttsResult = await this.speak(llmResult.text, input.language);

    return {
      responseText: llmResult.text,
      tokenCount: llmResult.usage.totalTokens,
      promptTokens: llmResult.usage.promptTokens,
      completionTokens: llmResult.usage.completionTokens,
      audioBuffer: ttsResult.audioBuffer,
      audioBase64: ttsResult.audioBuffer.toString("base64"),
      audioMimeType: ttsResult.mimeType,
      sttDurationSeconds: 0,
      ttsDurationSeconds: ttsResult.durationSeconds,
      ragContextCount: contexts.length,
    };
  }

  async streamTextTurn(
    input: { text: string; language: string; syntheticEmbedding?: number[] },
    onToken: (token: string) => void,
  ) {
    const embedding = input.syntheticEmbedding ?? new Array<number>(1536).fill(0.001);
    const contexts = await this.ragService.retrieveContext(embedding, 3);
    const ragContext = this.ragService.buildPrompt(input.text, contexts);

    const llmResult = await this.streamGenerateText(
      ragContext,
      [
        {
          role: "user",
          content: input.text,
        },
      ],
      onToken,
    );

    const ttsResult = await this.speak(llmResult.text, input.language);

    return {
      responseText: llmResult.text,
      tokenCount: llmResult.usage.totalTokens,
      promptTokens: llmResult.usage.promptTokens,
      completionTokens: llmResult.usage.completionTokens,
      audioBuffer: ttsResult.audioBuffer,
      audioBase64: ttsResult.audioBuffer.toString("base64"),
      audioMimeType: ttsResult.mimeType,
      sttDurationSeconds: 0,
      ttsDurationSeconds: ttsResult.durationSeconds,
      ragContextCount: contexts.length,
    };
  }

  private async transcribe(audio: Buffer, language: string): Promise<SttResult> {
    if (this.providers.stt.transcribeWithMetadata) {
      return this.providers.stt.transcribeWithMetadata(audio, language);
    }

    return {
      text: await this.providers.stt.transcribe(audio, language),
      durationSeconds: 0,
    };
  }

  private async generateText(context: string, messages: ChatMessage[]): Promise<LlmGenerationResult> {
    try {
      if (this.providers.llm.generateResponseWithUsage) {
        return await this.providers.llm.generateResponseWithUsage(context, messages);
      }

      const text = await this.providers.llm.generateResponse(context, messages);
      return {
        text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    } catch (error) {
      logger.error({ error }, "Primary LLM provider failed, falling back to mock provider");
      const fallback = new MockLlmProvider();
      const text = await fallback.generateResponse(context, messages);
      return {
        text,
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
      };
    }
  }

  private async streamGenerateText(
    context: string,
    messages: ChatMessage[],
    onToken: (token: string) => void,
  ): Promise<LlmGenerationResult> {
    if (this.providers.llm.streamResponse) {
      return this.providers.llm.streamResponse(context, messages, onToken);
    }

    const nonStream = await this.generateText(context, messages);
    onToken(nonStream.text);
    return nonStream;
  }

  private async speak(text: string, language: string): Promise<TtsResult> {
    if (this.providers.tts.speakWithMetadata) {
      return this.providers.tts.speakWithMetadata(text, language);
    }

    const audioBuffer = await this.providers.tts.speak(text, language);
    return {
      audioBuffer,
      durationSeconds: 0,
      mimeType: "audio/mpeg",
    };
  }
}
