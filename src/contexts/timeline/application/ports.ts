import type { MemoryView, PersonView } from "@/shared/views";

/**
 * Output (read) ports for the Timeline context (AGENT_CONTRACTS "Cross-context
 * reads"). Timeline is a downstream read model: it MUST NOT import Genealogy or
 * Memories code. Instead it reads them through these ports, typed purely with
 * `@/shared/views` shapes. The composition root binds these to the producer
 * modules' query methods (`listPeopleViews`, `listMemoryViews`).
 */
export interface PeopleReadPort {
  listPeople(): Promise<PersonView[]>;
}

export interface MemoriesReadPort {
  listMemories(): Promise<MemoryView[]>;
}
