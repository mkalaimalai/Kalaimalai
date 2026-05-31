import type { Clock } from "@/shared/ports";
import { ApproximateDate } from "@/shared/kernel";
import type { PersonView } from "@/shared/views";
import { FestivalCalendar } from "../domain/festival-calendar";
import {
  NextOccurrenceService,
  type CalendarDate,
  type MonthDay,
} from "../domain/next-occurrence";
import type { ReminderDTO } from "./dtos";
import type { PeopleReadPort } from "./ports";

export interface ListUpcomingRemindersInput {
  /** How many days ahead to include (inclusive of today). */
  readonly windowDays: number;
}

export interface ListUpcomingRemindersDeps {
  readonly people: PeopleReadPort;
  readonly clock: Clock;
  readonly festivals: FestivalCalendar;
  /** IANA timezone for "today" resolution (N6, TZ-aware). */
  readonly timeZone?: string;
}

/** Extract a recurring month/day from a PersonView's birth (day-precise only). */
function birthMonthDay(person: PersonView): MonthDay | null {
  if (!person.birth) return null;
  const md = ApproximateDate.fromJSON(person.birth).monthDay();
  return md;
}

/**
 * ListUpcomingReminders — combines birthdays (from people) and festivals (from
 * the calendar) whose next occurrence falls within `windowDays` of today, sorted
 * by soonest. Excludes Unlisted people (privacy — TECHNICAL_DESIGN §4.3/§8).
 *
 * Anniversaries: PersonView/RelationshipView carry no marriage date, so there is
 * no data source for them in the MVP. We skip them gracefully here (no throw);
 * the DTO `kind` reserves "anniversary" for when a marriage date becomes
 * available upstream.
 */
export function makeListUpcomingReminders(deps: ListUpcomingRemindersDeps) {
  return async function listUpcomingReminders(
    input: ListUpcomingRemindersInput,
  ): Promise<ReminderDTO[]> {
    const today: CalendarDate = deps.clock.today(deps.timeZone);
    const window = Math.max(0, Math.floor(input.windowDays));

    const within = (date: CalendarDate): number | null => {
      const days = NextOccurrenceService.daysUntil(date, today);
      return days >= 0 && days <= window ? days : null;
    };

    const reminders: ReminderDTO[] = [];

    // Birthdays from people (day-precise birth only, exclude Unlisted).
    const people = await deps.people.listPeople();
    for (const person of people) {
      if (person.isUnlisted) continue;
      const md = birthMonthDay(person);
      if (!md) continue;
      const date = NextOccurrenceService.nextOccurrence(md, today);
      const days = within(date);
      if (days === null) continue;
      reminders.push({
        id: `birthday:${person.id}`,
        kind: "birthday",
        title: `${person.displayName}'s birthday`,
        date,
        daysUntil: days,
        personIds: [person.id],
      });
    }

    // Festivals from the data-driven calendar.
    for (const festival of deps.festivals.list()) {
      const date = NextOccurrenceService.nextOccurrence(festival.monthDay, today);
      const days = within(date);
      if (days === null) continue;
      reminders.push({
        id: festival.id,
        kind: "festival",
        title: festival.name,
        date,
        daysUntil: days,
        personIds: [],
      });
    }

    // Sort by soonest, then by title for a stable order on ties.
    reminders.sort(
      (a, b) => a.daysUntil - b.daysUntil || a.title.localeCompare(b.title),
    );
    return reminders;
  };
}

export type ListUpcomingReminders = ReturnType<typeof makeListUpcomingReminders>;
