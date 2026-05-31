import type { MonthDay } from "./next-occurrence";

/**
 * FestivalCalendar — a data-driven set of recurring festivals (TECHNICAL_DESIGN
 * §10.4). Each festival recurs on a fixed Gregorian month/day for the MVP.
 *
 * IMPORTANT (MVP simplification): truly lunar/luni-solar festivals (e.g. Diwali,
 * Eid) do NOT fall on a fixed Gregorian date — their date shifts year to year.
 * Computing them needs an astronomical/lunar calendar engine that is out of scope
 * for Phase 0. Such entries are marked `approximate: true` and pinned to a
 * representative fixed date so they still surface in the calendar; replace with a
 * real ephemeris later. Solar/civil festivals (e.g. New Year's Day) are exact.
 *
 * The list is plain data so more festivals can be added without code changes.
 */
export interface Festival {
  /** Stable identifier, used to build deterministic reminder ids. */
  readonly id: string;
  readonly name: string;
  /** Fixed Gregorian recurrence for the MVP. */
  readonly monthDay: MonthDay;
  /**
   * True when the real festival is lunar/luni-solar and this fixed date is only a
   * stand-in for the MVP (date varies year to year in reality).
   */
  readonly approximate: boolean;
  /** Optional region/tradition label for display/filtering. */
  readonly region?: string;
}

/**
 * MVP festival dataset. A small, illustrative handful — extend freely. Lunar ones
 * carry `approximate: true` with a representative fixed Gregorian date.
 */
export const FESTIVALS: readonly Festival[] = [
  {
    id: "festival:new-year",
    name: "New Year's Day",
    monthDay: { month: 1, day: 1 },
    approximate: false,
  },
  {
    id: "festival:pongal",
    name: "Pongal",
    monthDay: { month: 1, day: 14 },
    approximate: false, // solar; Tamil harvest festival, fixed ~Jan 14-15.
    region: "Tamil Nadu",
  },
  {
    id: "festival:tamil-new-year",
    name: "Tamil New Year (Puthandu)",
    monthDay: { month: 4, day: 14 },
    approximate: false, // solar, fixed ~Apr 14.
    region: "Tamil Nadu",
  },
  {
    id: "festival:diwali",
    name: "Diwali",
    monthDay: { month: 11, day: 1 }, // luni-solar; fixed-for-MVP stand-in.
    approximate: true,
    region: "India",
  },
  {
    id: "festival:holi",
    name: "Holi",
    monthDay: { month: 3, day: 14 }, // luni-solar; fixed-for-MVP stand-in.
    approximate: true,
    region: "India",
  },
] as const;

export class FestivalCalendar {
  constructor(private readonly festivals: readonly Festival[] = FESTIVALS) {}

  list(): readonly Festival[] {
    return this.festivals;
  }
}
