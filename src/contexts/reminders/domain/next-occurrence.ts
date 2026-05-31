/**
 * NextOccurrenceService — pure date math for recurring (annual) occasions
 * (TECHNICAL_DESIGN §10.4). Given a recurring month/day and "today" (Y/M/D parts
 * supplied by the timezone-aware Clock), compute the next upcoming Gregorian date.
 *
 * Pure: no Date.now(), no timezone logic here — the caller resolves "today" via
 * `Clock.today(timeZone)` so this stays deterministic and trivially testable.
 */

export interface MonthDay {
  /** 1-12 */
  readonly month: number;
  /** 1-31 */
  readonly day: number;
}

export interface CalendarDate {
  readonly year: number;
  /** 1-12 */
  readonly month: number;
  /** 1-31 */
  readonly day: number;
}

/** A year is a leap year under the Gregorian rules. */
export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

/**
 * Clamp a recurring month/day to a concrete day within `year`. The only month/day
 * that can be invalid in some years is Feb 29 — in a non-leap year it is clamped
 * to Feb 28 so the occasion still surfaces.
 */
function clampToYear(monthDay: MonthDay, year: number): CalendarDate {
  if (monthDay.month === 2 && monthDay.day === 29 && !isLeapYear(year)) {
    return { year, month: 2, day: 28 };
  }
  return { year, month: monthDay.month, day: monthDay.day };
}

/** Order key for comparing (month, day) within a single year. */
function ordinal(month: number, day: number): number {
  return month * 100 + day;
}

export const NextOccurrenceService = {
  /**
   * The next upcoming occurrence of `monthDay` on or after `fromDate`.
   * If the occasion falls today it counts as today (daysUntil 0). If it has
   * already passed this year it wraps to next year. Feb 29 clamps to Feb 28 in
   * non-leap target years.
   */
  nextOccurrence(monthDay: MonthDay, fromDate: CalendarDate): CalendarDate {
    const thisYear = clampToYear(monthDay, fromDate.year);
    const passed =
      ordinal(thisYear.month, thisYear.day) <
      ordinal(fromDate.month, fromDate.day);
    return passed ? clampToYear(monthDay, fromDate.year + 1) : thisYear;
  },

  /**
   * Whole days from `fromDate` until `target` (UTC, calendar-day granularity).
   * Both are treated as civil dates; 0 means "today".
   */
  daysUntil(target: CalendarDate, fromDate: CalendarDate): number {
    const a = Date.UTC(fromDate.year, fromDate.month - 1, fromDate.day);
    const b = Date.UTC(target.year, target.month - 1, target.day);
    return Math.round((b - a) / 86_400_000);
  },
} as const;
