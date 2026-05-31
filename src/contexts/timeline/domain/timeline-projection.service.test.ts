import { describe, expect, it } from "vitest";
import { ApproximateDate } from "@/shared/kernel";
import type { PersonView, MemoryView } from "@/shared/views";
import { TimelineProjectionService } from "./timeline-projection.service";

const day = (y: number, m: number, d: number) =>
  ApproximateDate.day(y, m, d).toJSON();
const year = (y: number) => ApproximateDate.year(y).toJSON();

function person(overrides: Partial<PersonView> & { id: string }): PersonView {
  return {
    id: overrides.id,
    displayName: overrides.displayName ?? `Person ${overrides.id}`,
    branch: overrides.branch ?? "Maternal",
    gender: overrides.gender ?? "Unknown",
    birth: overrides.birth ?? null,
    passing: overrides.passing ?? null,
    isDeceased: overrides.isDeceased ?? overrides.passing != null,
    isUnlisted: overrides.isUnlisted ?? false,
  };
}

function memory(overrides: Partial<MemoryView> & { id: string }): MemoryView {
  return {
    id: overrides.id,
    caption: overrides.caption ?? "",
    date: overrides.date ?? null,
    place: overrides.place ?? null,
    taggedPersonIds: overrides.taggedPersonIds ?? [],
    albumId: overrides.albumId ?? null,
    mediaRef: overrides.mediaRef ?? null,
  };
}

describe("TimelineProjectionService.project", () => {
  it("creates birth, passing, and memory entries", () => {
    const people: PersonView[] = [
      person({ id: "p1", birth: day(1950, 1, 2), passing: day(2010, 3, 4) }),
    ];
    const memories: MemoryView[] = [
      memory({ id: "m1", date: day(1980, 6, 7), caption: "A picnic", taggedPersonIds: ["p1"] }),
    ];

    const entries = TimelineProjectionService.project(people, memories, {
      kind: "WholeFamily",
    });

    expect(entries.map((e) => e.kind)).toEqual(["birth", "memory", "passing"]);
    const birth = entries[0]!;
    expect(birth.kind).toBe("birth");
    expect(birth.personIds).toEqual(["p1"]);
    const mem = entries[1]!;
    expect(mem.kind).toBe("memory");
    expect(mem.memoryId).toBe("m1");
    expect(mem.title).toBe("A picnic");
    expect(mem.personIds).toEqual(["p1"]);
  });

  it("orders entries chronologically by ApproximateDate sort semantics", () => {
    const people: PersonView[] = [
      person({ id: "p1", birth: day(2000, 5, 5) }),
      person({ id: "p2", birth: day(1990, 1, 1) }),
    ];
    const memories: MemoryView[] = [
      memory({ id: "m1", date: year(1995) }),
      memory({ id: "m2", date: day(2001, 12, 31) }),
    ];

    const entries = TimelineProjectionService.project(people, memories, {
      kind: "WholeFamily",
    });

    const keys = entries.map((e) => e.sortKey);
    expect(keys).toEqual([...keys].sort((a, b) => a - b));
    // 1990 birth, 1995 memory, 2000 birth, 2001 memory
    expect(entries.map((e) => e.personIds[0] ?? e.memoryId)).toEqual([
      "p2",
      "m1",
      "p1",
      "m2",
    ]);
  });

  it("sortKey for a year-precise date precedes a day-precise date in the same year", () => {
    const people: PersonView[] = [];
    const memories: MemoryView[] = [
      memory({ id: "exact", date: day(1998, 3, 4) }),
      memory({ id: "coarse", date: year(1998) }),
    ];
    const entries = TimelineProjectionService.project(people, memories, {
      kind: "WholeFamily",
    });
    expect(entries.map((e) => e.memoryId)).toEqual(["coarse", "exact"]);
  });

  it("skips people without a birth date and memories without a date", () => {
    const people: PersonView[] = [person({ id: "p1", birth: null })];
    const memories: MemoryView[] = [memory({ id: "m1", date: null })];
    const entries = TimelineProjectionService.project(people, memories, {
      kind: "WholeFamily",
    });
    expect(entries).toEqual([]);
  });

  it("falls back to a generated title for a captionless memory", () => {
    const memories: MemoryView[] = [
      memory({ id: "m1", date: day(2000, 1, 1), caption: "   " }),
    ];
    const entries = TimelineProjectionService.project([], memories, {
      kind: "WholeFamily",
    });
    expect(entries[0]!.title).toBe("Memory");
  });

  it("titles birth and passing entries from display name", () => {
    const people: PersonView[] = [
      person({ id: "p1", displayName: "Meena", birth: day(1950, 1, 1), passing: day(2020, 1, 1) }),
    ];
    const entries = TimelineProjectionService.project(people, [], {
      kind: "WholeFamily",
    });
    expect(entries[0]!.title).toBe("Meena was born");
    expect(entries[1]!.title).toBe("Meena passed away");
  });

  describe("unlisted exclusion", () => {
    it("excludes unlisted people's birth/passing entries", () => {
      const people: PersonView[] = [
        person({ id: "p1", isUnlisted: true, birth: day(1950, 1, 1), passing: day(2000, 1, 1) }),
        person({ id: "p2", isUnlisted: false, birth: day(1960, 1, 1) }),
      ];
      const entries = TimelineProjectionService.project(people, [], {
        kind: "WholeFamily",
      });
      expect(entries.map((e) => e.personIds[0])).toEqual(["p2"]);
    });

    it("drops unlisted people from a memory's tagged person list", () => {
      const people: PersonView[] = [
        person({ id: "p1", isUnlisted: true }),
        person({ id: "p2", isUnlisted: false }),
      ];
      const memories: MemoryView[] = [
        memory({ id: "m1", date: day(2000, 1, 1), taggedPersonIds: ["p1", "p2"] }),
      ];
      const entries = TimelineProjectionService.project(people, memories, {
        kind: "WholeFamily",
      });
      expect(entries[0]!.personIds).toEqual(["p2"]);
    });
  });

  describe("scope filtering", () => {
    const people: PersonView[] = [
      person({ id: "m1p", branch: "Maternal", birth: day(1950, 1, 1) }),
      person({ id: "p1p", branch: "Paternal", birth: day(1955, 1, 1) }),
    ];
    const memories: MemoryView[] = [
      memory({ id: "memA", date: day(1990, 1, 1), taggedPersonIds: ["m1p"] }),
      memory({ id: "memB", date: day(1991, 1, 1), taggedPersonIds: ["p1p"] }),
      memory({ id: "memC", date: day(1992, 1, 1), taggedPersonIds: [] }),
    ];

    const tag = (e: { kind: string; personIds: readonly string[]; memoryId?: string }) =>
      e.kind === "memory" ? e.memoryId : e.personIds[0];

    it("Branch scope keeps only entries concerning people in that branch", () => {
      const entries = TimelineProjectionService.project(people, memories, {
        kind: "Branch",
        branch: "Maternal",
      });
      expect(entries.map(tag)).toEqual(["m1p", "memA"]);
    });

    it("Person scope keeps only entries concerning that person", () => {
      const entries = TimelineProjectionService.project(people, memories, {
        kind: "Person",
        personId: "p1p",
      });
      expect(entries.map(tag)).toEqual(["p1p", "memB"]);
    });

    it("WholeFamily keeps everything (incl. untagged memories)", () => {
      const entries = TimelineProjectionService.project(people, memories, {
        kind: "WholeFamily",
      });
      expect(entries).toHaveLength(5);
    });
  });
});

describe("TimelineProjectionService.getOnThisDay", () => {
  const entries = TimelineProjectionService.project(
    [
      person({ id: "p1", displayName: "Asha", birth: day(1950, 3, 15) }),
      person({ id: "p2", displayName: "Ravi", birth: day(1980, 3, 15), passing: day(2015, 8, 1) }),
    ],
    [
      memory({ id: "m1", date: day(2000, 3, 15) }),
      memory({ id: "m2", date: day(2000, 7, 1) }),
      memory({ id: "m3", date: year(1999) }),
    ],
    { kind: "WholeFamily" },
  );

  it("returns entries matching the given month/day across years", () => {
    const result = TimelineProjectionService.getOnThisDay(entries, {
      month: 3,
      day: 15,
    });
    expect(result.map((e) => e.personIds[0] ?? e.memoryId).sort()).toEqual([
      "m1",
      "p1",
      "p2",
    ]);
  });

  it("excludes entries whose date is not day-precise", () => {
    const result = TimelineProjectionService.getOnThisDay(entries, {
      month: 1,
      day: 1,
    });
    expect(result).toEqual([]);
  });

  it("matches a different month/day independently", () => {
    const result = TimelineProjectionService.getOnThisDay(entries, {
      month: 7,
      day: 1,
    });
    expect(result.map((e) => e.memoryId)).toEqual(["m2"]);
  });
});
