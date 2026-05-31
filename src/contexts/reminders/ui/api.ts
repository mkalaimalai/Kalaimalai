import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runValue } from "@/store/query-fn";
import type { ReminderDTO, SuggestedGreetingDTO } from "../application/dtos";
import type { GetSuggestedGreetingInput } from "../application/get-suggested-greeting";

/**
 * RTK Query endpoints for Reminders (AGENT_CONTRACTS "RTK Query endpoints"). Both
 * are read/query endpoints resolving the bound use cases from the composition
 * root; tagged "Reminder" for cache invalidation.
 */
export const remindersApi = api.injectEndpoints({
  endpoints: (build) => ({
    listUpcomingReminders: build.query<ReminderDTO[], { windowDays: number }>({
      queryFn: (arg) =>
        runValue(getContainer().reminders.listUpcomingReminders(arg)),
      providesTags: ["Reminder"],
    }),
    getSuggestedGreeting: build.query<
      SuggestedGreetingDTO,
      GetSuggestedGreetingInput
    >({
      queryFn: (arg) =>
        runValue(getContainer().reminders.getSuggestedGreeting(arg)),
    }),
  }),
});

export const {
  useListUpcomingRemindersQuery,
  useGetSuggestedGreetingQuery,
  useLazyGetSuggestedGreetingQuery,
} = remindersApi;
