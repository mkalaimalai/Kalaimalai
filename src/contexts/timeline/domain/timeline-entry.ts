import type { ApproximateDateJSON } from "@/shared/kernel";
import type { Branch } from "@/shared/kernel";

/** The kind of life event a timeline entry represents. */
export type TimelineEntryKind = "birth" | "passing" | "memory";

/**
 * A single chronological item in a timeline projection (TECHNICAL_DESIGN §10.3).
 * Plain, serializable value: no class instances, no `Date`.
 */
export interface TimelineEntry {
  readonly id: string;
  readonly kind: TimelineEntryKind;
  readonly date: ApproximateDateJSON;
  /** Epoch-ms sort key derived from the ApproximateDate (chronological order). */
  readonly sortKey: number;
  readonly title: string;
  /** People this entry concerns — the subject(s) of a birth/passing, or tagged people of a memory. */
  readonly personIds: readonly string[];
  /** Present only when `kind === "memory"`. */
  readonly memoryId?: string;
}

/**
 * Timeline scope filter (TECHNICAL_DESIGN §10.3):
 *  - WholeFamily: every listed person + memory.
 *  - Branch: entries whose people belong to the given lineage.
 *  - Person: entries that concern a single person.
 */
export type TimelineScope =
  | { readonly kind: "WholeFamily" }
  | { readonly kind: "Branch"; readonly branch: Branch }
  | { readonly kind: "Person"; readonly personId: string };
