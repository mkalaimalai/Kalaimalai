import type { Invite } from "../domain/invite";
import type { Member } from "../domain/member";
import type { AuthPort, InviteRepository, MemberRepository } from "./ports";

/**
 * In-memory port fakes for use-case tests (TECHNICAL_DESIGN §12: use cases are
 * tested against in-memory fakes, the same wiring minus storage).
 */
export class InMemoryMemberRepository implements MemberRepository {
  private readonly map = new Map<string, Member>();

  async get(id: string): Promise<Member | null> {
    return this.map.get(id) ?? null;
  }
  async list(): Promise<Member[]> {
    return Array.from(this.map.values());
  }
  async save(member: Member): Promise<void> {
    this.map.set(member.id, member);
  }
}

export class InMemoryInviteRepository implements InviteRepository {
  private readonly map = new Map<string, Invite>();

  async get(id: string): Promise<Invite | null> {
    return this.map.get(id) ?? null;
  }
  async findByToken(token: string): Promise<Invite | null> {
    for (const invite of this.map.values()) {
      if (invite.token === token) return invite;
    }
    return null;
  }
  async list(): Promise<Invite[]> {
    return Array.from(this.map.values());
  }
  async save(invite: Invite): Promise<void> {
    this.map.set(invite.id, invite);
  }
}

export class InMemoryAuthPort implements AuthPort {
  private currentId: string | null = null;

  getCurrentMemberId(): string | null {
    return this.currentId;
  }
  setCurrentMember(id: string): void {
    this.currentId = id;
  }
}
