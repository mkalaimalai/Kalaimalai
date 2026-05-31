import type { ApproximateDateJSON } from "@/shared/kernel/approximate-date";
import type { Branch } from "@/shared/kernel/branch";

/**
 * Cross-context READ views (TECHNICAL_DESIGN §4.1: "Timeline and Reminders are
 * downstream read/derivation models that consume Genealogy + Memories").
 *
 * These are the ONLY shapes that may cross a context boundary. Producer contexts
 * (Genealogy, Memories) map their aggregates to these plain DTOs; consumer
 * contexts (Timeline, Reminders, Engagement) read them through an injected port
 * whose interface lives in the consumer. The composition root binds producer
 * query methods to consumer ports — so no context imports another's `domain/`.
 */

export interface PersonView {
  id: string;
  displayName: string;
  branch: Branch;
  gender: "Male" | "Female" | "Other" | "Unknown";
  birth: ApproximateDateJSON | null;
  passing: ApproximateDateJSON | null;
  isDeceased: boolean;
  /** Excluded from feeds/reminders when true (Unlisted visibility). */
  isUnlisted: boolean;
}

export interface RelationshipView {
  id: string;
  type: "ParentOf" | "SpouseOf" | "SiblingOf";
  fromPersonId: string;
  toPersonId: string;
}

export interface MemoryView {
  id: string;
  caption: string;
  date: ApproximateDateJSON | null;
  place: string | null;
  taggedPersonIds: string[];
  albumId: string | null;
  /** A resolvable media key/URL for the primary media (may be a data URL). */
  mediaRef: string | null;
}
