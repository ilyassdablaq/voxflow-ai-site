import { randomBytes } from "node:crypto";
import { prisma } from "../../infra/database/prisma.js";

type IntegrationSettingsRecord = {
  userId: string;
  botName: string;
  themeColor: string;
  position: "bottom-right" | "bottom-left";
  language: string;
  launcherText: string;
  launcherIcon: "chat" | "message" | "sparkles";
  embedKey: string;
  updatedAt: Date;
};

function createEmbedKey() {
  return `emb_${randomBytes(24).toString("hex")}`;
}

export class IntegrationRepository {
  private initialized = false;

  private async ensureTable() {
    if (this.initialized) {
      return;
    }

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS integration_settings (
        user_id TEXT PRIMARY KEY,
        bot_name TEXT NOT NULL,
        theme_color TEXT NOT NULL,
        position TEXT NOT NULL,
        language TEXT NOT NULL,
        launcher_text TEXT NOT NULL DEFAULT 'Chat',
        launcher_icon TEXT NOT NULL DEFAULT 'chat',
        embed_key TEXT UNIQUE NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE integration_settings
      ADD COLUMN IF NOT EXISTS launcher_text TEXT NOT NULL DEFAULT 'Chat'
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE integration_settings
      ADD COLUMN IF NOT EXISTS launcher_icon TEXT NOT NULL DEFAULT 'chat'
    `);

    this.initialized = true;
  }

  private mapRecord(row: {
    user_id: string;
    bot_name: string;
    theme_color: string;
    position: "bottom-right" | "bottom-left";
    language: string;
    launcher_text: string | null;
    launcher_icon: "chat" | "message" | "sparkles" | null;
    embed_key: string;
    updated_at: Date;
  }): IntegrationSettingsRecord {
    return {
      userId: row.user_id,
      botName: row.bot_name,
      themeColor: row.theme_color,
      position: row.position,
      language: row.language,
      launcherText: row.launcher_text ?? "Chat",
      launcherIcon: row.launcher_icon ?? "chat",
      embedKey: row.embed_key,
      updatedAt: row.updated_at,
    };
  }

  async getOrCreateByUserId(userId: string) {
    await this.ensureTable();

    const existing = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        bot_name: string;
        theme_color: string;
        position: "bottom-right" | "bottom-left";
        language: string;
        launcher_text: string | null;
        launcher_icon: "chat" | "message" | "sparkles" | null;
        embed_key: string;
        updated_at: Date;
      }>
    >(
      `
        SELECT user_id, bot_name, theme_color, position, language, launcher_text, launcher_icon, embed_key, updated_at
        FROM integration_settings
        WHERE user_id = $1
      `,
      userId,
    );

    if (existing.length > 0) {
      return this.mapRecord(existing[0]);
    }

    const embedKey = createEmbedKey();
    await prisma.$executeRawUnsafe(
      `
        INSERT INTO integration_settings (user_id, bot_name, theme_color, position, language, launcher_text, launcher_icon, embed_key, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
      `,
      userId,
      "Chatbot",
      "#5A67D8",
      "bottom-right",
      "en",
      "Chat",
      "chat",
      embedKey,
    );

    return {
      userId,
      botName: "Chatbot",
      themeColor: "#5A67D8",
      position: "bottom-right",
      language: "en",
      launcherText: "Chat",
      launcherIcon: "chat",
      embedKey,
      updatedAt: new Date(),
    } as IntegrationSettingsRecord;
  }

  async updateSettings(userId: string, payload: {
    botName: string;
    themeColor: string;
    position: "bottom-right" | "bottom-left";
    language: string;
    launcherText: string;
    launcherIcon: "chat" | "message" | "sparkles";
  }) {
    await this.ensureTable();

    await this.getOrCreateByUserId(userId);

    await prisma.$executeRawUnsafe(
      `
        UPDATE integration_settings
        SET bot_name = $2,
            theme_color = $3,
            position = $4,
            language = $5,
            launcher_text = $6,
            launcher_icon = $7,
            updated_at = NOW()
        WHERE user_id = $1
      `,
      userId,
      payload.botName,
      payload.themeColor,
      payload.position,
      payload.language,
      payload.launcherText,
      payload.launcherIcon,
    );

    return this.getOrCreateByUserId(userId);
  }

  async regenerateEmbedKey(userId: string) {
    await this.ensureTable();

    await this.getOrCreateByUserId(userId);
    const embedKey = createEmbedKey();

    await prisma.$executeRawUnsafe(
      `
        UPDATE integration_settings
        SET embed_key = $2,
            updated_at = NOW()
        WHERE user_id = $1
      `,
      userId,
      embedKey,
    );

    return this.getOrCreateByUserId(userId);
  }

  async getByEmbedKey(embedKey: string) {
    await this.ensureTable();

    const rows = await prisma.$queryRawUnsafe<
      Array<{
        user_id: string;
        bot_name: string;
        theme_color: string;
        position: "bottom-right" | "bottom-left";
        language: string;
        launcher_text: string | null;
        launcher_icon: "chat" | "message" | "sparkles" | null;
        embed_key: string;
        updated_at: Date;
      }>
    >(
      `
        SELECT user_id, bot_name, theme_color, position, language, launcher_text, launcher_icon, embed_key, updated_at
        FROM integration_settings
        WHERE embed_key = $1
      `,
      embedKey,
    );

    if (rows.length === 0) {
      return null;
    }

    return this.mapRecord(rows[0]);
  }
}
