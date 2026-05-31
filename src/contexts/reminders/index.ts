/**
 * Public barrel for the Reminders context. Exports the module factory, the
 * read-port interface the integrator must implement, and the plain DTOs the
 * integrator/UI consume. Augments the composition-root container with the
 * `reminders` key via declaration merging (no central file is edited).
 */
export * from "./reminders.module";
export type { PeopleReadPort } from "./application/ports";
export type {
  ReminderDTO,
  ReminderKind,
  ReminderDateDTO,
  OccasionKind,
  SuggestedGreetingDTO,
} from "./application/dtos";
export type { GetSuggestedGreetingInput } from "./application/get-suggested-greeting";
export type { ListUpcomingRemindersInput } from "./application/list-upcoming-reminders";

import type { RemindersModule } from "./reminders.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    reminders: RemindersModule;
  }
}
