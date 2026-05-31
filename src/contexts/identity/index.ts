export * from "./identity.module";
export type { MemberDTO, InviteDTO } from "./application/dtos";
export type {
  CreateInviteInput,
  RedeemInviteInput,
  ApproveMemberInput,
  EnsureSeedAdminInput,
} from "./application/use-cases";
export type { Role, MemberStatus } from "./domain";

// UI surface the integrator needs to wire routes and role-gated navigation.
export {
  RoleGate,
  useCurrentRole,
  type RoleGateProps,
} from "./ui/RoleGate";
export { InviteOnboarding, type InviteOnboardingProps } from "./ui/InviteOnboarding";
export { MemberSwitcher } from "./ui/MemberSwitcher";
export {
  identityApi,
  useGetCurrentMemberQuery,
  useListMembersQuery,
  useCreateInviteMutation,
  useRedeemInviteMutation,
  useApproveMemberMutation,
  useSignInAsMutation,
} from "./ui/api";

import type { IdentityModule } from "./identity.module";
declare module "@/bootstrap/container" {
  interface AppContainer {
    identity: IdentityModule;
  }
}
