/**
 * Plain, serializable DTOs for the Reminders context (AGENT_CONTRACTS rule 6).
 * The UI and store never see live domain objects.
 */

export type ReminderKind = "birthday" | "anniversary" | "festival";

export interface ReminderDateDTO {
  readonly year: number;
  /** 1-12 */
  readonly month: number;
  /** 1-31 */
  readonly day: number;
}

export interface ReminderDTO {
  /** Stable, deterministic id (e.g. `birthday:<personId>` / festival id). */
  readonly id: string;
  readonly kind: ReminderKind;
  readonly title: string;
  /** The next upcoming occurrence date. */
  readonly date: ReminderDateDTO;
  /** Whole days from "today" until the occurrence (0 = today). */
  readonly daysUntil: number;
  /** People this reminder concerns (empty for festivals). */
  readonly personIds: string[];
}

export type OccasionKind = ReminderKind;

export interface SuggestedGreetingDTO {
  readonly occasionKind: OccasionKind;
  readonly message: string;
}
