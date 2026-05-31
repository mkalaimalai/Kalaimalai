import { ApproximateDate } from "@/shared/kernel";
import type { ApproximateDateJSON } from "@/shared/kernel";
import type { MemoryView, PersonView } from "@/shared/views";
import type { TimelineEntry, TimelineScope } from "./timeline-entry";

/**
 * TimelineProjectionService — pure domain service (TECHNICAL_DESIGN §10.3).
 *
 * Composes an ordered list of {@link TimelineEntry} from people + memories:
 *  - a `birth` entry per listed person with a birth date,
 *  - a `passing` entry per listed person with a passing date,
 *  - a `memory` entry per memory with a date.
 *
 * Ordering uses {@link ApproximateDate} sort semantics so coarser dates sort to
 * the start of their range. Unlisted people are excluded from feeds entirely
 * (their life events are dropped and they are removed from memory tag lists).
 *
 * No I/O, no class instances leak out — every returned value is plain/serializable.
 */
export const TimelineProjectionService = {
  project(
    people: readonly PersonView[],
    memories: readonly MemoryView[],
    scope: TimelineScope,
  ): TimelineEntry[] {
    const listed = people.filter((p) => !p.isUnlisted);
    const listedIds = new Set(listed.map((p) => p.id));
    const branchOf = new Map(listed.map((p) => [p.id, p.branch] as const));

    const entries: TimelineEntry[] = [];

    for (const person of listed) {
      if (person.birth) {
        entries.push(
          lifeEntry("birth", person, person.birth, `${person.displayName} was born`),
        );
      }
      if (person.passing) {
        entries.push(
          lifeEntry(
            "passing",
            person,
            person.passing,
            `${person.displayName} passed away`,
          ),
        );
      }
    }

    for (const memory of memories) {
      if (!memory.date) continue;
      const personIds = memory.taggedPersonIds.filter((id) => listedIds.has(id));
      const title = memory.caption.trim() || "Memory";
      entries.push({
        id: `memory:${memory.id}`,
        kind: "memory",
        date: memory.date,
        sortKey: sortKeyOf(memory.date),
        title,
        personIds,
        memoryId: memory.id,
      });
    }

    const scoped = entries.filter((entry) =>
      inScope(entry, scope, branchOf),
    );

    return scoped.sort((a, b) => a.sortKey - b.sortKey);
  },

  /**
   * "On this day" — entries whose date falls on the given month/day in any year.
   * Only day-precise entries can match (coarser dates have no concrete day).
   */
  getOnThisDay(
    entries: readonly TimelineEntry[],
    target: { month: number; day: number },
  ): TimelineEntry[] {
    return entries.filter(
      (entry) =>
        entry.date.month === target.month && entry.date.day === target.day,
    );
  },
};

function lifeEntry(
  kind: "birth" | "passing",
  person: PersonView,
  date: ApproximateDateJSON,
  title: string,
): TimelineEntry {
  return {
    id: `${kind}:${person.id}`,
    kind,
    date,
    sortKey: sortKeyOf(date),
    title,
    personIds: [person.id],
  };
}

function sortKeyOf(date: ApproximateDateJSON): number {
  return ApproximateDate.fromJSON(date).sortKey();
}

function inScope(
  entry: TimelineEntry,
  scope: TimelineScope,
  branchOf: ReadonlyMap<string, PersonView["branch"]>,
): boolean {
  switch (scope.kind) {
    case "WholeFamily":
      return true;
    case "Person":
      return entry.personIds.includes(scope.personId);
    case "Branch":
      return entry.personIds.some((id) => branchOf.get(id) === scope.branch);
  }
}
