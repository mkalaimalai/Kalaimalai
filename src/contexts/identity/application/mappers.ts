import type { Invite } from "../domain/invite";
import type { Member } from "../domain/member";
import type { InviteDTO, MemberDTO } from "./dtos";

export function toMemberDTO(member: Member): MemberDTO {
  return {
    id: member.id,
    displayName: member.displayName,
    email: member.email ?? null,
    role: member.role,
    linkedPersonId: member.linkedPersonId ?? null,
    status: member.status,
  };
}

export function toInviteDTO(invite: Invite): InviteDTO {
  return {
    id: invite.id,
    token: invite.token,
    invitedByMemberId: invite.invitedByMemberId,
    role: invite.role,
    createdAtMs: invite.createdAtMs,
    expiresAtMs: invite.expiresAtMs,
    redeemed: invite.redeemed,
  };
}
