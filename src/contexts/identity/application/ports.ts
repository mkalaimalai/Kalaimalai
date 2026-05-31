import type { Invite } from "../domain/invite";
import type { Member } from "../domain/member";

/**
 * Output ports (driven). The application depends on these interfaces;
 * infrastructure implements them (hexagonal — TECHNICAL_DESIGN §6.1).
 */
export interface MemberRepository {
  get(id: string): Promise<Member | null>;
  list(): Promise<Member[]>;
  save(member: Member): Promise<void>;
}

export interface InviteRepository {
  get(id: string): Promise<Invite | null>;
  findByToken(token: string): Promise<Invite | null>;
  list(): Promise<Invite[]>;
  save(invite: Invite): Promise<void>;
}

/**
 * AuthPort — the local stub auth seam (TECHNICAL_DESIGN §9.1). Phase 0 simulates
 * pick-a-member / magic-link by storing the current member id; a passwordless
 * backend swaps this adapter without touching use cases.
 */
export interface AuthPort {
  getCurrentMemberId(): string | null;
  setCurrentMember(id: string): void;
}
