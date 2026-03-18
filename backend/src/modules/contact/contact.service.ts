import { ContactRepository } from "./contact.repository.js";
import { ContactInput } from "./contact.schemas.js";

export class ContactService {
  constructor(private readonly repository: ContactRepository) {}

  async create(payload: ContactInput, userId?: string) {
    return this.repository.createContactMessage({
      ...payload,
      userId,
    });
  }
}
