import { TimelineProjectionService } from "../domain/timeline-projection.service";
import type { TimelineEntry, TimelineScope } from "../domain/timeline-entry";
import type { TimelineDTO, TimelineEntryDTO } from "./dtos";
import type { MemoriesReadPort, PeopleReadPort } from "./ports";

/**
 * Application use cases for Timeline (TECHNICAL_DESIGN §10.3). These are pure
 * orchestration: read people + memories through the injected ports, run the
 * domain projection, and map to plain DTOs. They never touch persistence and
 * cannot fail for control-flow reasons, so they resolve a value directly
 * (read queries, per AGENT_CONTRACTS — `runValue` in the endpoint layer).
 */

export interface BuildTimelineInput {
  readonly scope: TimelineScope;
}

export interface GetOnThisDayInput {
  readonly month: number;
  readonly day: number;
}

/** `BuildTimeline({ scope })` → ordered timeline for the given scope. */
export function BuildTimeline(
  people: PeopleReadPort,
  memories: MemoriesReadPort,
): (input: BuildTimelineInput) => Promise<TimelineDTO> {
  return async ({ scope }) => {
    const entries = await projectScoped(people, memories, scope);
    return { scope, entries: entries.map(toDTO) };
  };
}

/** `GetOnThisDay({ month, day })` → whole-family entries on that calendar day. */
export function GetOnThisDay(
  people: PeopleReadPort,
  memories: MemoriesReadPort,
): (input: GetOnThisDayInput) => Promise<TimelineDTO> {
  return async ({ month, day }) => {
    const scope: TimelineScope = { kind: "WholeFamily" };
    const entries = await projectScoped(people, memories, scope);
    const matched = TimelineProjectionService.getOnThisDay(entries, {
      month,
      day,
    });
    return { scope, entries: matched.map(toDTO) };
  };
}

async function projectScoped(
  people: PeopleReadPort,
  memories: MemoriesReadPort,
  scope: TimelineScope,
): Promise<TimelineEntry[]> {
  const [peopleViews, memoryViews] = await Promise.all([
    people.listPeople(),
    memories.listMemories(),
  ]);
  return TimelineProjectionService.project(peopleViews, memoryViews, scope);
}

function toDTO(entry: TimelineEntry): TimelineEntryDTO {
  return {
    id: entry.id,
    kind: entry.kind,
    date: entry.date,
    sortKey: entry.sortKey,
    title: entry.title,
    personIds: [...entry.personIds],
    ...(entry.memoryId !== undefined ? { memoryId: entry.memoryId } : {}),
  };
}
