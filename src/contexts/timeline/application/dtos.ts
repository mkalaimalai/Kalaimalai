import type { ApproximateDateJSON, Branch } from "@/shared/kernel";
import type { TimelineEntryKind } from "../domain/timeline-entry";

/**
 * Plain, serializable timeline item handed to the UI/store (AGENT_CONTRACTS:
 * "DTOs are plain & serializable"). Mirrors the domain `TimelineEntry` but is a
 * stable wire shape independent of the domain type.
 */
export interface TimelineEntryDTO {
  readonly id: string;
  readonly kind: TimelineEntryKind;
  readonly date: ApproximateDateJSON;
  readonly sortKey: number;
  readonly title: string;
  readonly personIds: readonly string[];
  readonly memoryId?: string;
}

/** Scope describing what a timeline DTO covers (echoed back for the UI). */
export type TimelineScopeDTO =
  | { readonly kind: "WholeFamily" }
  | { readonly kind: "Branch"; readonly branch: Branch }
  | { readonly kind: "Person"; readonly personId: string };

/** Result of `BuildTimeline` / `GetOnThisDay`. */
export interface TimelineDTO {
  readonly scope: TimelineScopeDTO;
  readonly entries: readonly TimelineEntryDTO[];
}
