import type { Clock, IdGenerator } from "@/shared/ports";
import type { Result } from "@/shared/kernel";
import { InviteId, MemberId, PersonId, fail, ok } from "@/shared/kernel";
import { Invite } from "../domain/invite";
import { Member } from "../domain/member";
import { canApproveMembers, type Role } from "../domain/role";
import type { InviteDTO, MemberDTO } from "./dtos";
import { toInviteDTO, toMemberDTO } from "./mappers";
import type { AuthPort, InviteRepository, MemberRepository } from "./ports";

export interface IdentityDeps {
  members: MemberRepository;
  invites: InviteRepository;
  auth: AuthPort;
  clock: Clock;
  ids: IdGenerator;
}

export interface CreateInviteInput {
  invitedBy: string;
  role: Role;
  ttlMs: number;
}

/** CreateInvite — mint an expiring invite (token via IdGenerator, expiry via Clock). */
export function makeCreateInvite(deps: IdentityDeps) {
  return async (input: CreateInviteInput): Promise<Result<InviteDTO>> => {
    if (input.ttlMs <= 0) {
      return fail("INVITE_INVALID_TTL", "Invite ttl must be positive.");
    }
    const inviter = await deps.members.get(input.invitedBy);
    if (!inviter) {
      return fail("MEMBER_NOT_FOUND", "Inviting member not found.");
    }
    const now = deps.clock.now();
    const created = Invite.create({
      id: InviteId(deps.ids.next()),
      token: deps.ids.next(),
      invitedByMemberId: MemberId(input.invitedBy),
      role: input.role,
      createdAtMs: now,
      expiresAtMs: now + input.ttlMs,
      redeemed: false,
    });
    if (!created.ok) return created;
    await deps.invites.save(created.value);
    return ok(toInviteDTO(created.value));
  };
}

export interface RedeemInviteInput {
  token: string;
  displayName: string;
}

/**
 * RedeemInvite — consume a valid invite and create a Pending member with the
 * granted role. Fails if the token is unknown, expired, or already redeemed.
 */
export function makeRedeemInvite(deps: IdentityDeps) {
  return async (input: RedeemInviteInput): Promise<Result<MemberDTO>> => {
    const invite = await deps.invites.findByToken(input.token);
    if (!invite) {
      return fail("INVITE_NOT_FOUND", "No invite matches that token.");
    }
    const redeemed = invite.redeem(deps.clock.now());
    if (!redeemed.ok) return redeemed;

    const member = Member.create({
      id: MemberId(deps.ids.next()),
      displayName: input.displayName,
      role: invite.role,
      status: "Pending",
    });
    if (!member.ok) return member;

    // Persist the redeemed invite and the new member together.
    await deps.invites.save(redeemed.value);
    await deps.members.save(member.value);
    return ok(toMemberDTO(member.value));
  };
}

export interface ApproveMemberInput {
  actorRole: Role;
  memberId: string;
}

/** ApproveMember — Admin-only transition of a Pending member to Active (F1.5). */
export function makeApproveMember(deps: IdentityDeps) {
  return async (input: ApproveMemberInput): Promise<Result<MemberDTO>> => {
    if (!canApproveMembers(input.actorRole)) {
      return fail(
        "NOT_AUTHORIZED",
        "Only an Admin may approve members.",
      );
    }
    const member = await deps.members.get(input.memberId);
    if (!member) {
      return fail("MEMBER_NOT_FOUND", "Member not found.");
    }
    const approved = member.approve();
    if (!approved.ok) return approved;
    await deps.members.save(approved.value);
    return ok(toMemberDTO(approved.value));
  };
}

/** GetCurrentMember — resolve the signed-in member from the AuthPort (read). */
export function makeGetCurrentMember(deps: IdentityDeps) {
  return async (): Promise<MemberDTO | null> => {
    const id = deps.auth.getCurrentMemberId();
    if (!id) return null;
    const member = await deps.members.get(id);
    return member ? toMemberDTO(member) : null;
  };
}

/** ListMembers — all members as DTOs (read). */
export function makeListMembers(deps: IdentityDeps) {
  return async (): Promise<MemberDTO[]> => {
    const members = await deps.members.list();
    return members.map(toMemberDTO);
  };
}

/** SignInAs — stub auth: switch the current member (TECHNICAL_DESIGN §9.1). */
export function makeSignInAs(deps: IdentityDeps) {
  return async (memberId: string): Promise<Result<MemberDTO>> => {
    const member = await deps.members.get(memberId);
    if (!member) {
      return fail("MEMBER_NOT_FOUND", "Cannot sign in as unknown member.");
    }
    deps.auth.setCurrentMember(memberId);
    return ok(toMemberDTO(member));
  };
}

export interface EnsureSeedAdminInput {
  displayName: string;
  linkedPersonId?: string;
}

/**
 * EnsureSeedAdmin — composition-root bootstrap (TECHNICAL_DESIGN §8 seeding).
 * Idempotent and safe to call on every boot: if an Active Admin already exists,
 * no-ops and returns it; otherwise creates an Active Admin directly via the
 * domain factory and signs them in (the one seam that mints the FIRST member,
 * since invites require an existing inviter and only yield Pending members).
 */
export function makeEnsureSeedAdmin(deps: IdentityDeps) {
  return async (
    input: EnsureSeedAdminInput,
  ): Promise<Result<MemberDTO>> => {
    const existing = await deps.members.list();
    const activeAdmin = existing.find(
      (m) => m.role === "Admin" && m.isActive,
    );
    if (activeAdmin) {
      return ok(toMemberDTO(activeAdmin));
    }

    const created = Member.create({
      id: MemberId(deps.ids.next()),
      displayName: input.displayName,
      role: "Admin",
      status: "Active",
      ...(input.linkedPersonId !== undefined
        ? { linkedPersonId: PersonId(input.linkedPersonId) }
        : {}),
    });
    if (!created.ok) return created;

    await deps.members.save(created.value);
    deps.auth.setCurrentMember(created.value.id);
    return ok(toMemberDTO(created.value));
  };
}
