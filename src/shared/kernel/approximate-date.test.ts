import { describe, it, expect } from "vitest";
import { ApproximateDate } from "./approximate-date";

describe("ApproximateDate", () => {
  it("supports year-only precision", () => {
    const d = ApproximateDate.year(1998);
    expect(d.precision).toBe("year");
    expect(d.format("en-US")).toBe("1998");
  });

  it("supports full-day precision", () => {
    const d = ApproximateDate.day(1998, 3, 4);
    expect(d.precision).toBe("day");
    expect(d.monthDay()).toEqual({ month: 3, day: 4 });
  });

  it("orders coarse dates before precise dates in the same year", () => {
    const coarse = ApproximateDate.year(1998);
    const precise = ApproximateDate.day(1998, 3, 4);
    expect(coarse.compare(precise)).toBeLessThan(0);
  });

  it("round-trips through JSON", () => {
    const d = ApproximateDate.day(2001, 12, 25);
    expect(ApproximateDate.fromJSON(d.toJSON()).equals(d)).toBe(true);
  });

  it("rejects an out-of-range month", () => {
    expect(() => ApproximateDate.fromParts({ year: 2000, month: 13 })).toThrow();
  });

  it("rejects a day without a month", () => {
    expect(() =>
      ApproximateDate.fromParts({ year: 2000, day: 5 }),
    ).toThrow();
  });
});
