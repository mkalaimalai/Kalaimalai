import type { SharedDeps } from "@/bootstrap/container";
import {
  BuildTimeline,
  GetOnThisDay,
  type BuildTimelineInput,
  type GetOnThisDayInput,
} from "./application/timeline.use-cases";
import type { TimelineDTO } from "./application/dtos";
import type { MemoriesReadPort, PeopleReadPort } from "./application/ports";

/**
 * TimelineModule — the bound use cases this context exposes (AGENT_CONTRACTS:
 * "The module factory"). Timeline owns no persistence; it derives everything
 * from injected producer read ports.
 */
export interface TimelineModule {
  buildTimeline(input: BuildTimelineInput): Promise<TimelineDTO>;
  getOnThisDay(input: GetOnThisDayInput): Promise<TimelineDTO>;
}

/** The downstream read ports the integrator injects (Genealogy + Memories). */
export interface TimelineReads {
  people: PeopleReadPort;
  memories: MemoriesReadPort;
}

/**
 * Factory. Note the SECOND argument: the integrator binds producer query
 * methods (`listPeopleViews`, `listMemoryViews`) to these ports at the
 * composition root — Timeline never imports Genealogy/Memories directly.
 *
 * `_deps` (SharedDeps) is accepted to match the standard factory signature even
 * though Timeline needs no clock/ids/store of its own.
 */
export function createTimelineModule(
  _deps: SharedDeps,
  reads: TimelineReads,
): TimelineModule {
  const buildTimeline = BuildTimeline(reads.people, reads.memories);
  const getOnThisDay = GetOnThisDay(reads.people, reads.memories);
  return {
    buildTimeline: (input) => buildTimeline(input),
    getOnThisDay: (input) => getOnThisDay(input),
  };
}
