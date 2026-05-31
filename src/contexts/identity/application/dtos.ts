import type { MemberStatus } from "../domain/member";
import type { Role } from "../domain/role";

/**
 * Plain, serializable DTOs (AGENT_CONTRACTS rule 6). The UI and store never see
 * live domain entities — use cases map aggregates to these.
 */
export interface MemberDTO {
  id: string;
  displayName: string;
  email: string | null;
  role: Role;
  linkedPersonId: string | null;
  status: MemberStatus;
}

export interface InviteDTO {
  id: string;
  token: string;
  invitedByMemberId: string;
  role: Role;
  createdAtMs: number;
  expiresAtMs: number;
  redeemed: boolean;
}
