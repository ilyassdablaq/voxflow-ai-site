import { prisma } from "../../infra/database/prisma.js";

export class ContactRepository {
  async createContactMessage(data: { userId?: string; name: string; email: string; company?: string; message: string }) {
    return prisma.contactMessage.create({ data });
  }
}
