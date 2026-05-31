import { describe, it, expect } from "vitest";
import { ApproximateDate } from "@/shared/kernel";
import type { TimelineEntryDTO } from "../application/dtos";
import { layoutTimelineAxis, yearFraction } from "./axis-layout";

const entry = (
  id: string,
  y: number,
  m: number,
  d: number,
  kind: TimelineEntryDTO["kind"] = "memory",
): TimelineEntryDTO => ({
  id,
  kind,
  date: ApproximateDate.day(y, m, d).toJSON(),
  sortKey: ApproximateDate.day(y, m, d).sortKey(),
  title: id,
  personIds: [],
});

describe("layoutTimelineAxis", () => {
  it("returns an empty layout for no entries", () => {
    const layout = layoutTimelineAxis([]);
    expect(layout.entries).toEqual([]);
    expect(layout.ticks).toEqual([]);
  });

  it("orders entries left→right by date as a percentage of the span", () => {
    const layout = layoutTimelineAxis([
      entry("a", 1950, 1, 1),
      entry("c", 2010, 1, 1),
      entry("b", 1980, 1, 1),
    ]);
    const byId = Object.fromEntries(layout.entries.map((e) => [e.entry.id, e]));
    expect(byId.a!.xPct).toBeLessThan(byId.b!.xPct);
    expect(byId.b!.xPct).toBeLessThan(byId.c!.xPct);
    layout.entries.forEach((e) => {
      expect(e.xPct).toBeGreaterThanOrEqual(0);
      expect(e.xPct).toBeLessThanOrEqual(100);
    });
  });

  it("alternates entries between the top and bottom lanes", () => {
    const layout = layoutTimelineAxis([
      entry("a", 1950, 1, 1),
      entry("b", 1960, 1, 1),
      entry("c", 1970, 1, 1),
    ]);
    const lanes = layout.entries
      .sort((x, y) => x.xPct - y.xPct)
      .map((e) => e.lane);
    expect(lanes[0]).not.toBe(lanes[1]);
    expect(lanes[1]).not.toBe(lanes[2]);
  });

  it("stacks coincident entries outward in the same lane", () => {
    // Three entries on the same day: lanes alternate top/bottom/top, so the two
    // top-lane entries land on the same x and must get different laneIndexes.
    const layout = layoutTimelineAxis([
      entry("a", 1950, 1, 1),
      entry("b", 1950, 1, 1),
      entry("c", 1950, 1, 1),
    ]);
    const top = layout.entries.filter((e) => e.lane === "top");
    const indices = top.map((e) => e.laneIndex);
    expect(new Set(indices).size).toBeGreaterThan(1);
  });

  it("produces year ticks at nice intervals across the span", () => {
    const layout = layoutTimelineAxis([
      entry("a", 1950, 1, 1),
      entry("b", 2010, 1, 1),
    ]);
    expect(layout.ticks.length).toBeGreaterThanOrEqual(3);
    // Ticks are monotonic and within 0–100.
    const xs = layout.ticks.map((t) => t.xPct);
    expect([...xs].sort((p, q) => p - q)).toEqual(xs);
    layout.ticks.forEach((t) => {
      expect(t.xPct).toBeGreaterThanOrEqual(0);
      expect(t.xPct).toBeLessThanOrEqual(100);
    });
  });

  it("nudges position by month within a year", () => {
    expect(yearFraction({ year: 2000, month: 1, day: 1 })).toBeCloseTo(2000, 5);
    expect(yearFraction({ year: 2000, month: 7, day: 1 })).toBeGreaterThan(2000.4);
  });
});
