import { apiClient } from "@/lib/api-client";

export interface KnowledgeDocumentItem {
  id: string;
  title: string;
  createdAt: string;
  _count: {
    chunks: number;
  };
}

export interface IngestionResult {
  document: {
    id: string;
    title: string;
    createdAt: string;
  };
  chunksCount: number;
  wordCount: number;
}

async function fileToBase64(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const slice = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...slice);
  }

  return btoa(binary);
}

export const knowledgeService = {
  listDocuments(): Promise<KnowledgeDocumentItem[]> {
    return apiClient.get<KnowledgeDocumentItem[]>("/api/knowledge/documents");
  },

  async uploadFile(file: File): Promise<IngestionResult> {
    return apiClient.post<IngestionResult>("/api/knowledge/ingest/file", {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      contentBase64: await fileToBase64(file),
    });
  },

  ingestStructured(format: "json" | "xml", title: string, content: string): Promise<IngestionResult> {
    return apiClient.post<IngestionResult>("/api/knowledge/ingest/structured", {
      format,
      title,
      content,
    });
  },

  ingestUrl(url: string, maxPages = 4): Promise<IngestionResult> {
    return apiClient.post<IngestionResult>("/api/knowledge/ingest/url", {
      url,
      maxPages,
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await apiClient.delete<void>(`/api/knowledge/documents/${id}`);
  },
};
