import { describe, expect, it } from "vitest";
import { FixedClock } from "@/shared/ports";
import type { PersonView, RelationshipView } from "@/shared/views";
import { FestivalCalendar, type Festival } from "../domain/festival-calendar";
import { makeListUpcomingReminders } from "./list-upcoming-reminders";
import type { PeopleReadPort } from "./ports";

// 2026-05-31T12:00:00Z — deterministic "today" when resolved in UTC.
const TODAY_EPOCH = Date.UTC(2026, 4, 31, 12, 0, 0);

function fakePeople(people: PersonView[]): PeopleReadPort {
  const relationships: RelationshipView[] = [];
  return {
    listPeople: async () => people,
    listRelationships: async () => relationships,
  };
}

function person(overrides: Partial<PersonView> & Pick<PersonView, "id">): PersonView {
  return {
    displayName: "Test Person",
    branch: "Paternal",
    gender: "Unknown",
    birth: null,
    passing: null,
    isDeceased: false,
    isUnlisted: false,
    ...overrides,
  };
}

const noFestivals = new FestivalCalendar([]);

function makeUC(
  people: PersonView[],
  festivals: FestivalCalendar = noFestivals,
) {
  return makeListUpcomingReminders({
    people: fakePeople(people),
    clock: new FixedClock(TODAY_EPOCH),
    festivals,
    timeZone: "UTC",
  });
}

describe("listUpcomingReminders — birthdays", () => {
  it("includes a day-precise birthday within the window with correct daysUntil", async () => {
    const uc = makeUC([
      person({
        id: "p1",
        displayName: "Meena",
        birth: { year: 1990, month: 6, day: 5 },
      }),
    ]);
    const out = await uc({ windowDays: 30 });
    expect(out).toHaveLength(1);
    const r = out[0]!;
    expect(r.kind).toBe("birthday");
    expect(r.id).toBe("birthday:p1");
    expect(r.title).toContain("Meena");
    expect(r.date).toEqual({ year: 2026, month: 6, day: 5 });
    expect(r.daysUntil).toBe(5);
    expect(r.personIds).toEqual(["p1"]);
  });

  it("counts a birthday that is today as daysUntil 0", async () => {
    const uc = makeUC([
      person({ id: "p1", birth: { year: 1990, month: 5, day: 31 } }),
    ]);
    const out = await uc({ windowDays: 7 });
    expect(out).toHaveLength(1);
    expect(out[0]!.daysUntil).toBe(0);
  });

  it("excludes birthdays outside the window", async () => {
    const uc = makeUC([
      person({ id: "p1", birth: { year: 1990, month: 12, day: 25 } }),
    ]);
    const out = await uc({ windowDays: 30 });
    expect(out).toHaveLength(0);
  });

  it("ignores people without a day-precise birth", async () => {
    const uc = makeUC([
      person({ id: "p1", birth: { year: 1990, month: null, day: null } }),
      person({ id: "p2", birth: { year: 1990, month: 6, day: null } }),
      person({ id: "p3", birth: null }),
    ]);
    const out = await uc({ windowDays: 365 });
    expect(out).toHaveLength(0);
  });

  it("excludes Unlisted people", async () => {
    const uc = makeUC([
      person({
        id: "p1",
        isUnlisted: true,
        birth: { year: 1990, month: 6, day: 5 },
      }),
    ]);
    const out = await uc({ windowDays: 30 });
    expect(out).toHaveLength(0);
  });
});

describe("listUpcomingReminders — festivals", () => {
  it("includes a festival within the window", async () => {
    const festivals = new FestivalCalendar([
      { id: "festival:x", name: "Festival X", monthDay: { month: 6, day: 10 }, approximate: false } satisfies Festival,
    ]);
    const uc = makeUC([], festivals);
    const out = await uc({ windowDays: 30 });
    expect(out).toHaveLength(1);
    expect(out[0]!.kind).toBe("festival");
    expect(out[0]!.id).toBe("festival:x");
    expect(out[0]!.title).toBe("Festival X");
    expect(out[0]!.personIds).toEqual([]);
    expect(out[0]!.daysUntil).toBe(10);
  });
});

describe("listUpcomingReminders — combination & sorting", () => {
  it("combines birthdays and festivals sorted by soonest", async () => {
    const festivals = new FestivalCalendar([
      { id: "festival:soon", name: "Soon Fest", monthDay: { month: 6, day: 2 }, approximate: false },
    ]);
    const uc = makeUC(
      [person({ id: "p1", displayName: "Meena", birth: { year: 1990, month: 6, day: 5 } })],
      festivals,
    );
    const out = await uc({ windowDays: 30 });
    expect(out.map((r) => r.id)).toEqual(["festival:soon", "birthday:p1"]);
    expect(out.map((r) => r.daysUntil)).toEqual([2, 5]);
  });

  it("returns an empty list when nothing falls in the window", async () => {
    const uc = makeUC([
      person({ id: "p1", birth: { year: 1990, month: 1, day: 1 } }),
    ]);
    const out = await uc({ windowDays: 1 });
    expect(out).toEqual([]);
  });
});
