import { describe, expect, it } from "vitest";
import {
  isLeapYear,
  NextOccurrenceService,
  type CalendarDate,
} from "./next-occurrence";

const date = (year: number, month: number, day: number): CalendarDate => ({
  year,
  month,
  day,
});

describe("isLeapYear", () => {
  it("identifies leap years by the Gregorian rule", () => {
    expect(isLeapYear(2024)).toBe(true);
    expect(isLeapYear(2000)).toBe(true);
    expect(isLeapYear(1900)).toBe(false);
    expect(isLeapYear(2023)).toBe(false);
  });
});

describe("NextOccurrenceService.nextOccurrence", () => {
  it("returns this year when the date is still upcoming", () => {
    expect(
      NextOccurrenceService.nextOccurrence({ month: 12, day: 25 }, date(2026, 5, 31)),
    ).toEqual(date(2026, 12, 25));
  });

  it("returns today when the occasion is today (daysUntil 0)", () => {
    const next = NextOccurrenceService.nextOccurrence(
      { month: 5, day: 31 },
      date(2026, 5, 31),
    );
    expect(next).toEqual(date(2026, 5, 31));
    expect(NextOccurrenceService.daysUntil(next, date(2026, 5, 31))).toBe(0);
  });

  it("wraps to next year when the date has already passed", () => {
    expect(
      NextOccurrenceService.nextOccurrence({ month: 1, day: 1 }, date(2026, 5, 31)),
    ).toEqual(date(2027, 1, 1));
  });

  it("wraps when same month but earlier day already passed", () => {
    expect(
      NextOccurrenceService.nextOccurrence({ month: 5, day: 10 }, date(2026, 5, 31)),
    ).toEqual(date(2027, 5, 10));
  });

  it("clamps Feb 29 to Feb 28 in a non-leap target year", () => {
    expect(
      NextOccurrenceService.nextOccurrence({ month: 2, day: 29 }, date(2026, 1, 1)),
    ).toEqual(date(2026, 2, 28));
  });

  it("keeps Feb 29 in a leap target year", () => {
    expect(
      NextOccurrenceService.nextOccurrence({ month: 2, day: 29 }, date(2024, 1, 1)),
    ).toEqual(date(2024, 2, 29));
  });

  it("wraps Feb 29 to the next leap year clamp correctly", () => {
    // From 2026-03-01, next Feb 29 occurrence is 2027 (non-leap) -> clamped 02-28.
    expect(
      NextOccurrenceService.nextOccurrence({ month: 2, day: 29 }, date(2026, 3, 1)),
    ).toEqual(date(2027, 2, 28));
  });
});

describe("NextOccurrenceService.daysUntil", () => {
  it("counts whole days across a month boundary", () => {
    expect(
      NextOccurrenceService.daysUntil(date(2026, 6, 1), date(2026, 5, 31)),
    ).toBe(1);
  });

  it("counts days across a year boundary", () => {
    expect(
      NextOccurrenceService.daysUntil(date(2027, 1, 1), date(2026, 12, 25)),
    ).toBe(7);
  });

  it("returns 0 for the same day", () => {
    expect(
      NextOccurrenceService.daysUntil(date(2026, 5, 31), date(2026, 5, 31)),
    ).toBe(0);
  });
});
