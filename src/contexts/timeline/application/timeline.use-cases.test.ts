import { describe, expect, it } from "vitest";
import { ApproximateDate } from "@/shared/kernel";
import type { MemoryView, PersonView } from "@/shared/views";
import type { MemoriesReadPort, PeopleReadPort } from "./ports";
import { BuildTimeline, GetOnThisDay } from "./timeline.use-cases";

const day = (y: number, m: number, d: number) =>
  ApproximateDate.day(y, m, d).toJSON();

const PEOPLE: PersonView[] = [
  {
    id: "p1",
    displayName: "Asha",
    branch: "Maternal",
    gender: "Female",
    birth: day(1950, 3, 15),
    passing: null,
    isDeceased: false,
    isUnlisted: false,
  },
  {
    id: "p2",
    displayName: "Ravi",
    branch: "Paternal",
    gender: "Male",
    birth: day(1980, 7, 1),
    passing: day(2015, 3, 15),
    isDeceased: true,
    isUnlisted: false,
  },
  {
    id: "p3",
    displayName: "Hidden",
    branch: "Maternal",
    gender: "Other",
    birth: day(1990, 1, 1),
    passing: null,
    isDeceased: false,
    isUnlisted: true,
  },
];

const MEMORIES: MemoryView[] = [
  {
    id: "m1",
    caption: "Wedding",
    date: day(1975, 6, 6),
    place: null,
    taggedPersonIds: ["p1"],
    albumId: null,
    mediaRef: null,
  },
  {
    id: "m2",
    caption: "Trip",
    date: day(2000, 3, 15),
    place: null,
    taggedPersonIds: ["p2"],
    albumId: null,
    mediaRef: null,
  },
];

function fakePeople(people: PersonView[] = PEOPLE): PeopleReadPort {
  return { listPeople: async () => people };
}
function fakeMemories(memories: MemoryView[] = MEMORIES): MemoriesReadPort {
  return { listMemories: async () => memories };
}

describe("BuildTimeline", () => {
  it("builds a whole-family timeline ordered chronologically", async () => {
    const buildTimeline = BuildTimeline(fakePeople(), fakeMemories());
    const dto = await buildTimeline({ scope: { kind: "WholeFamily" } });

    expect(dto.scope).toEqual({ kind: "WholeFamily" });
    const keys = dto.entries.map((e) => e.sortKey);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    // p1 birth(1950), m1(1975), p2 birth(1980), m2(2000), p2 passing(2015)
    expect(dto.entries.map((e) => e.id)).toEqual([
      "birth:p1",
      "memory:m1",
      "birth:p2",
      "memory:m2",
      "passing:p2",
    ]);
  });

  it("excludes unlisted people", async () => {
    const buildTimeline = BuildTimeline(fakePeople(), fakeMemories([]));
    const dto = await buildTimeline({ scope: { kind: "WholeFamily" } });
    expect(dto.entries.some((e) => e.id === "birth:p3")).toBe(false);
  });

  it("filters by Branch scope", async () => {
    const buildTimeline = BuildTimeline(fakePeople(), fakeMemories());
    const dto = await buildTimeline({
      scope: { kind: "Branch", branch: "Paternal" },
    });
    expect(dto.scope).toEqual({ kind: "Branch", branch: "Paternal" });
    expect(dto.entries.map((e) => e.id)).toEqual([
      "birth:p2",
      "memory:m2",
      "passing:p2",
    ]);
  });

  it("filters by Person scope", async () => {
    const buildTimeline = BuildTimeline(fakePeople(), fakeMemories());
    const dto = await buildTimeline({
      scope: { kind: "Person", personId: "p1" },
    });
    expect(dto.entries.map((e) => e.id)).toEqual(["birth:p1", "memory:m1"]);
  });

  it("returns plain serializable DTOs", async () => {
    const buildTimeline = BuildTimeline(fakePeople(), fakeMemories());
    const dto = await buildTimeline({ scope: { kind: "WholeFamily" } });
    expect(dto).toEqual(JSON.parse(JSON.stringify(dto)));
  });
});

describe("GetOnThisDay", () => {
  it("returns whole-family entries matching the given month/day", async () => {
    const getOnThisDay = GetOnThisDay(fakePeople(), fakeMemories());
    const dto = await getOnThisDay({ month: 3, day: 15 });
    // p1 birth 1950-03-15, p2 passing 2015-03-15, m2 2000-03-15
    expect(dto.entries.map((e) => e.id).sort()).toEqual([
      "birth:p1",
      "memory:m2",
      "passing:p2",
    ]);
  });

  it("returns an empty timeline when nothing matches", async () => {
    const getOnThisDay = GetOnThisDay(fakePeople(), fakeMemories());
    const dto = await getOnThisDay({ month: 12, day: 25 });
    expect(dto.entries).toEqual([]);
    expect(dto.scope).toEqual({ kind: "WholeFamily" });
  });
});
