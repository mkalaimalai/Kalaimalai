import type { SharedDeps } from "@/bootstrap/container";
import type { Result } from "@/shared/kernel";
import type { InviteDTO, MemberDTO } from "./application/dtos";
import {
  type ApproveMemberInput,
  type CreateInviteInput,
  type EnsureSeedAdminInput,
  type IdentityDeps,
  type RedeemInviteInput,
  makeApproveMember,
  makeCreateInvite,
  makeEnsureSeedAdmin,
  makeGetCurrentMember,
  makeListMembers,
  makeRedeemInvite,
  makeSignInAs,
} from "./application/use-cases";
import { LocalAuthAdapter } from "./infrastructure/local-auth-adapter";
import { LocalStorageInviteRepository } from "./infrastructure/invite-repository";
import { LocalStorageMemberRepository } from "./infrastructure/member-repository";

/**
 * IdentityModule — the bound public surface of the Identity & Access context
 * (AGENT_CONTRACTS "module factory"). The integrator wires this into the
 * AppContainer; RTK Query `queryFn`s resolve it via `getContainer().identity`.
 */
export interface IdentityModule {
  createInvite(input: CreateInviteInput): Promise<Result<InviteDTO>>;
  redeemInvite(input: RedeemInviteInput): Promise<Result<MemberDTO>>;
  approveMember(input: ApproveMemberInput): Promise<Result<MemberDTO>>;
  getCurrentMember(): Promise<MemberDTO | null>;
  listMembers(): Promise<MemberDTO[]>;
  signInAs(memberId: string): Promise<Result<MemberDTO>>;
  /** Idempotent composition-root seed of a starter Active Admin. */
  ensureSeedAdmin(input: EnsureSeedAdminInput): Promise<Result<MemberDTO>>;
}

export function createIdentityModule(deps: SharedDeps): IdentityModule {
  const identityDeps: IdentityDeps = {
    members: new LocalStorageMemberRepository(deps.store),
    invites: new LocalStorageInviteRepository(deps.store),
    auth: new LocalAuthAdapter(deps.store),
    clock: deps.clock,
    ids: deps.ids,
  };

  return {
    createInvite: makeCreateInvite(identityDeps),
    redeemInvite: makeRedeemInvite(identityDeps),
    approveMember: makeApproveMember(identityDeps),
    getCurrentMember: makeGetCurrentMember(identityDeps),
    listMembers: makeListMembers(identityDeps),
    signInAs: makeSignInAs(identityDeps),
    ensureSeedAdmin: makeEnsureSeedAdmin(identityDeps),
  };
}
