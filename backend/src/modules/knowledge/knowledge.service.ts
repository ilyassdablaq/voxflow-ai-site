import { RagService } from "../../services/rag/rag.service.js";
import { IngestFileInput, IngestStructuredInput, IngestUrlInput } from "./knowledge.schemas.js";

export class KnowledgeService {
  constructor(private readonly ragService: RagService) {}

  async listDocuments(userId: string) {
    return this.ragService.listDocuments(userId);
  }

  async ingestFile(userId: string, payload: IngestFileInput) {
    return this.ragService.ingestFromUpload({
      userId,
      fileName: payload.fileName,
      mimeType: payload.mimeType,
      contentBase64: payload.contentBase64,
    });
  }

  async ingestStructured(userId: string, payload: IngestStructuredInput) {
    return this.ragService.ingestStructuredData({
      userId,
      format: payload.format,
      title: payload.title,
      content: payload.content,
    });
  }

  async ingestUrl(userId: string, payload: IngestUrlInput) {
    return this.ragService.ingestWebsite({
      userId,
      url: payload.url,
      maxPages: payload.maxPages,
    });
  }

  async deleteDocument(userId: string, documentId: string) {
    return this.ragService.deleteDocument(userId, documentId);
  }
}
