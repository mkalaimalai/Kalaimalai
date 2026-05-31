import { describe, expect, it } from "vitest";
import {
  FESTIVALS,
  FestivalCalendar,
  type Festival,
} from "./festival-calendar";

describe("FestivalCalendar", () => {
  it("exposes the default MVP dataset", () => {
    const cal = new FestivalCalendar();
    expect(cal.list().length).toBe(FESTIVALS.length);
    expect(cal.list().map((f) => f.id)).toContain("festival:new-year");
  });

  it("has unique, stable ids and valid month/day for every festival", () => {
    const ids = new Set<string>();
    for (const f of FESTIVALS) {
      expect(ids.has(f.id)).toBe(false);
      ids.add(f.id);
      expect(f.monthDay.month).toBeGreaterThanOrEqual(1);
      expect(f.monthDay.month).toBeLessThanOrEqual(12);
      expect(f.monthDay.day).toBeGreaterThanOrEqual(1);
      expect(f.monthDay.day).toBeLessThanOrEqual(31);
    }
  });

  it("marks lunar festivals as approximate and solar/civil ones as exact", () => {
    const byId = (id: string): Festival => {
      const f = FESTIVALS.find((x) => x.id === id);
      if (!f) throw new Error(`missing ${id}`);
      return f;
    };
    expect(byId("festival:new-year").approximate).toBe(false);
    expect(byId("festival:diwali").approximate).toBe(true);
  });

  it("can be constructed with a custom (data-driven) dataset", () => {
    const custom: Festival[] = [
      { id: "x", name: "X", monthDay: { month: 6, day: 6 }, approximate: false },
    ];
    const cal = new FestivalCalendar(custom);
    expect(cal.list()).toEqual(custom);
  });
});
