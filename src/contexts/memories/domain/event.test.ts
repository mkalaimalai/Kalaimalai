import { describe, it, expect } from "vitest";
import { ApproximateDate, EventId } from "@/shared/kernel";
import { FamilyEvent } from "./event";

describe("FamilyEvent", () => {
  it("creates an event with a single date", () => {
    const r = FamilyEvent.create({
      id: EventId("e1"),
      title: "Wedding",
      date: ApproximateDate.day(2018, 6, 1),
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.title).toBe("Wedding");
    expect(r.value.date?.precision).toBe("day");
    expect(r.value.dateRange).toBeNull();
  });

  it("creates an event with a date range", () => {
    const r = FamilyEvent.create({
      id: EventId("e1"),
      title: "Trip",
      dateRange: {
        start: ApproximateDate.day(2019, 1, 1),
        end: ApproximateDate.day(2019, 1, 7),
      },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.dateRange?.start.year).toBe(2019);
    expect(r.value.dateRange?.end.day).toBe(7);
  });

  it("rejects an empty title", () => {
    const r = FamilyEvent.create({ id: EventId("e1"), title: "" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("EVENT_TITLE_REQUIRED");
  });

  it("rejects a range whose end precedes its start", () => {
    const r = FamilyEvent.create({
      id: EventId("e1"),
      title: "Bad",
      dateRange: {
        start: ApproximateDate.day(2019, 1, 7),
        end: ApproximateDate.day(2019, 1, 1),
      },
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("EVENT_RANGE_INVALID");
  });
});
