import type { SharedDeps } from "@/bootstrap/container";
import { FestivalCalendar } from "./domain/festival-calendar";
import type {
  ReminderDTO,
  SuggestedGreetingDTO,
} from "./application/dtos";
import {
  getSuggestedGreeting,
  type GetSuggestedGreetingInput,
} from "./application/get-suggested-greeting";
import {
  makeListUpcomingReminders,
  type ListUpcomingRemindersInput,
} from "./application/list-upcoming-reminders";
import type { PeopleReadPort } from "./application/ports";

/**
 * Public module surface for the Reminders context (AGENT_CONTRACTS "module
 * factory"). Bound use cases as async methods; the UI/store call these, never the
 * domain or repositories directly.
 */
export interface RemindersModule {
  listUpcomingReminders(
    input: ListUpcomingRemindersInput,
  ): Promise<ReminderDTO[]>;
  getSuggestedGreeting(
    input: GetSuggestedGreetingInput,
  ): Promise<SuggestedGreetingDTO>;
}

/**
 * Construct the Reminders module. The second argument injects the cross-context
 * read port (implemented by the integrator over the Genealogy module) so this
 * context never imports another context's code.
 */
export function createRemindersModule(
  deps: SharedDeps,
  reads: { people: PeopleReadPort },
): RemindersModule {
  const festivals = new FestivalCalendar();
  const listUpcoming = makeListUpcomingReminders({
    people: reads.people,
    clock: deps.clock,
    festivals,
  });

  return {
    listUpcomingReminders: (input) => listUpcoming(input),
    getSuggestedGreeting: async (input) => getSuggestedGreeting(input),
  };
}
