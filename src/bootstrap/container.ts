import type { Clock } from "@/shared/ports/clock";
import type { IdGenerator } from "@/shared/ports/id-generator";
import type { KeyValueStore } from "@/shared/infrastructure/key-value-store";

/**
 * Composition root container (TECHNICAL_DESIGN §9.6). The single place use cases
 * are exposed to the driving side. RTK Query `queryFn`s resolve from here via
 * `getContainer()`.
 *
 * Each bounded context AUGMENTS `AppContainer` with its own key via declaration
 * merging from its public barrel, e.g.:
 *
 *   declare module "@/bootstrap/container" {
 *     interface AppContainer { genealogy: GenealogyModule }
 *   }
 *
 * so no central file is edited when a context is added — keeping contexts
 * independently buildable.
 */
// Intentionally empty: each bounded context adds its key via declaration merging.
export interface AppContainer {} // eslint-disable-line

/** Shared dependencies handed to every context module factory at composition. */
export interface SharedDeps {
  store: KeyValueStore;
  clock: Clock;
  ids: IdGenerator;
}

let current: AppContainer | null = null;

export function setContainer(container: AppContainer): void {
  current = container;
}

export function getContainer(): AppContainer {
  if (!current) {
    throw new Error(
      "Composition root not initialized. Call setContainer() in bootstrap before using use cases.",
    );
  }
  return current;
}

/** Test helper — clears the singleton between specs. */
export function resetContainer(): void {
  current = null;
}
