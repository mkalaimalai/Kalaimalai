import type { PersonView, RelationshipView } from "@/shared/views";

/**
 * Output port for reading people/relationships from the upstream Genealogy
 * context (AGENT_CONTRACTS "Cross-context reads"). Reminders never imports
 * Genealogy code — the integrator implements this port by delegating to the
 * Genealogy module's view query methods. Typed purely with `@/shared/views`.
 */
export interface PeopleReadPort {
  listPeople(): Promise<PersonView[]>;
  listRelationships(): Promise<RelationshipView[]>;
}
