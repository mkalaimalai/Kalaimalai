/**
 * Public barrel for the Timeline context. The integrator imports the module
 * factory + ports here, wires the read ports to the producer modules, and adds
 * `timeline` to the container. No other context imports Timeline internals.
 */
export {
  createTimelineModule,
  type TimelineModule,
  type TimelineReads,
} from "./timeline.module";

export type {
  PeopleReadPort,
  MemoriesReadPort,
} from "./application/ports";

export type {
  TimelineDTO,
  TimelineEntryDTO,
  TimelineScopeDTO,
} from "./application/dtos";

export type {
  BuildTimelineInput,
  GetOnThisDayInput,
} from "./application/timeline.use-cases";

export type {
  TimelineEntry,
  TimelineEntryKind,
  TimelineScope,
} from "./domain/timeline-entry";

import type { TimelineModule } from "./timeline.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    timeline: TimelineModule;
  }
}
