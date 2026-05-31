import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";
import type {
  OutboundNotificationLogDTO,
  SendOutboundInput,
  SendOutboundResult,
} from "../application";

/**
 * RTK Query endpoints for the Notifications context (driving adapter). The work
 * happens in the application layer, resolved from the composition root.
 */
export const notificationsApi = api.injectEndpoints({
  endpoints: (build) => ({
    listSent: build.query<OutboundNotificationLogDTO[], void>({
      queryFn: () => runValue(getContainer().notifications.listSent()),
      providesTags: ["Notification"],
    }),
    sendOutbound: build.mutation<SendOutboundResult, SendOutboundInput>({
      queryFn: (input) =>
        runResult(getContainer().notifications.sendOutbound(input)),
      invalidatesTags: ["Notification"],
    }),
  }),
});

export const { useListSentQuery, useSendOutboundMutation } = notificationsApi;
