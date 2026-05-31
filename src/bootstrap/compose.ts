import { setContainer, type AppContainer, type SharedDeps } from "./container";
import { SystemClock } from "@/shared/ports/clock";
import { UuidGenerator } from "@/shared/ports/id-generator";
import {
  InMemoryKeyValueStore,
  LocalStorageKeyValueStore,
} from "@/shared/infrastructure";

import { createGenealogyModule } from "@/contexts/genealogy";
import { createMemoriesModule } from "@/contexts/memories";
import { createIdentityModule } from "@/contexts/identity";
import { createNotificationsModule } from "@/contexts/notifications";
import { createTimelineModule } from "@/contexts/timeline";
import { createRemindersModule } from "@/contexts/reminders";
import { createEngagementModule } from "@/contexts/engagement";

/**
 * The composition root (TECHNICAL_DESIGN §9.6). The single place adapters are
 * wired to use cases and cross-context read ports are bound. Swapping local
 * adapters for HTTP ones later happens HERE and nowhere else.
 */
export function composeContainer(deps: SharedDeps): AppContainer {
  // Producer + self-contained contexts.
  const genealogy = createGenealogyModule(deps);
  const memories = createMemoriesModule(deps);
  const identity = createIdentityModule(deps);
  const notifications = createNotificationsModule(deps);

  // Downstream read models — bound to producer query methods (the only place
  // contexts are connected; no context imports another's domain).
  const timeline = createTimelineModule(deps, {
    people: { listPeople: () => genealogy.listPeopleViews() },
    memories: { listMemories: () => memories.listMemoryViews() },
  });

  const reminders = createRemindersModule(deps, {
    people: {
      listPeople: () => genealogy.listPeopleViews(),
      listRelationships: () => genealogy.listRelationshipViews(),
    },
  });

  const engagement = createEngagementModule(deps, {
    memories: { listMemories: () => memories.listMemoryViews() },
    people: { listPeople: () => genealogy.listPeopleViews() },
  });

  return {
    genealogy,
    memories,
    identity,
    notifications,
    timeline,
    reminders,
    engagement,
  };
}

/** Build the Phase-0 dependency set (localStorage in the browser, memory in SSR/tests). */
export function makeDeps(): SharedDeps {
  const store =
    typeof window !== "undefined"
      ? new LocalStorageKeyValueStore()
      : new InMemoryKeyValueStore();
  return { store, clock: new SystemClock(), ids: new UuidGenerator() };
}

/** Compose and install the container. Returns it for seeding. */
export function bootstrapContainer(deps: SharedDeps = makeDeps()): {
  container: AppContainer;
  deps: SharedDeps;
} {
  const container = composeContainer(deps);
  setContainer(container);
  return { container, deps };
}
