import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";
import type { InviteDTO, MemberDTO } from "../application/dtos";
import type {
  ApproveMemberInput,
  CreateInviteInput,
  RedeemInviteInput,
} from "../application/use-cases";

/**
 * Identity RTK Query endpoints (AGENT_CONTRACTS "RTK Query endpoints"). RTK
 * Query is a driving adapter: each `queryFn` resolves the Identity module from
 * the composition root and invokes a use case. Tags: Member, Invite.
 */
export const identityApi = api.injectEndpoints({
  endpoints: (build) => ({
    getCurrentMember: build.query<MemberDTO | null, void>({
      queryFn: () => runValue(getContainer().identity.getCurrentMember()),
      providesTags: ["Member"],
    }),
    listMembers: build.query<MemberDTO[], void>({
      queryFn: () => runValue(getContainer().identity.listMembers()),
      providesTags: ["Member"],
    }),
    createInvite: build.mutation<InviteDTO, CreateInviteInput>({
      queryFn: (input) =>
        runResult(getContainer().identity.createInvite(input)),
      invalidatesTags: ["Invite"],
    }),
    redeemInvite: build.mutation<MemberDTO, RedeemInviteInput>({
      queryFn: (input) =>
        runResult(getContainer().identity.redeemInvite(input)),
      invalidatesTags: ["Member", "Invite"],
    }),
    approveMember: build.mutation<MemberDTO, ApproveMemberInput>({
      queryFn: (input) =>
        runResult(getContainer().identity.approveMember(input)),
      invalidatesTags: ["Member"],
    }),
    signInAs: build.mutation<MemberDTO, string>({
      queryFn: (memberId) =>
        runResult(getContainer().identity.signInAs(memberId)),
      invalidatesTags: ["Member"],
    }),
  }),
});

export const {
  useGetCurrentMemberQuery,
  useListMembersQuery,
  useCreateInviteMutation,
  useRedeemInviteMutation,
  useApproveMemberMutation,
  useSignInAsMutation,
} = identityApi;
