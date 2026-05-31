# Agent Build Contracts — Family Fabric Phase 0

You are building ONE bounded context inside an existing Next.js + TypeScript repo
that already has its foundation in place. Follow these contracts EXACTLY so your
context integrates with the others without conflicts. Read
`docs/TECHNICAL_DESIGN.md` for product/architecture intent.

## Golden rules

1. **Stay inside your context directory** `src/contexts/<context>/`. Do NOT edit
   files outside it except creating the files this contract tells you to. Never
   edit another context, the store, the foundation, or `app/`.
2. **Strict TypeScript, no `any`.** `strict: true`, `noUncheckedIndexedAccess: true`.
3. **Dependency rule:** `domain/` imports only `domain/` + `@/shared/kernel`.
   `application/` imports `domain/` + ports + `@/shared/*`. `ui/` imports
   `application/` DTOs/hooks + `@/shared/ui`. NEVER import another context's
   `domain/` or `application/`.
4. **TDD.** Write Vitest tests FIRST for every domain rule and use case, then
   implement. Tests live next to source as `*.test.ts`. Run `npx vitest run
   src/contexts/<context>` — it must pass before you finish.
5. **Use cases return `Result<T, DomainError>`** (from `@/shared/kernel`). No
   throwing for control flow.
6. **DTOs are plain & serializable.** UI and the store never see live domain
   entities — map to plain DTO objects (no class instances, no `Date`; use
   `ApproximateDateJSON`).

## Foundation you build on (already exists — import, don't recreate)

- `@/shared/kernel` — branded ids (`PersonId`, `MemoryId`, …), `ApproximateDate`,
  `ApproximateDateJSON`, `Branch`, `Result`/`ok`/`err`/`fail`/`DomainError`.
- `@/shared/ports` — `Clock`, `IdGenerator`.
- `@/shared/infrastructure` — `KeyValueStore`, `Collection<TStored, TCurrent>`
  (schema-versioned write-through map; wrap one per aggregate for persistence).
- `@/shared/views` — `PersonView`, `RelationshipView`, `MemoryView` (the ONLY
  cross-context read shapes).
- `@/shared/ui` — `cn`, `Button`, `Card`/`CardHeader`/`CardTitle`/`CardContent`,
  `Input`, `Select`, `Field`. Elder-first (min target 44px). Use these.
- `@/store/api` — the shared RTK Query `api`. Inject endpoints into it.
- `@/store/query-fn` — `runResult(...)`, `runValue(...)` for endpoint `queryFn`s.
- `@/bootstrap/container` — `AppContainer`, `SharedDeps`, `getContainer()`.

## Per-context internal shape

```
src/contexts/<context>/
  domain/          entities, value objects, services, *.test.ts
  application/     use cases (return Result), DTOs, output-port interfaces, *.test.ts
  infrastructure/  repository adapters over Collection/KeyValueStore
  ui/              React components, api.ts (RTK Query injectEndpoints)
  <context>.module.ts   factory: (deps) => module object of use cases
  index.ts         public barrel + container augmentation
```

## The module factory (REQUIRED public surface)

Each context exposes a typed module of bound use cases. Example for `genealogy`:

```ts
// src/contexts/genealogy/genealogy.module.ts
import type { SharedDeps } from "@/bootstrap/container";

export interface GenealogyModule {
  addPerson(input: AddPersonInput): Promise<Result<PersonDTO>>;
  getTree(branch?: Branch): Promise<TreeDTO>;
  // ...all use cases as async methods
}

export function createGenealogyModule(
  deps: SharedDeps,
  // downstream-read deps, if any, are added as a second arg — see below
): GenealogyModule {
  const people = new LocalStoragePersonRepository(deps.store);
  // wire repos + use cases, return the object
}
```

```ts
// src/contexts/genealogy/index.ts
export * from "./genealogy.module";
export type { /* DTOs the integrator/UI need */ } from "./application/dtos";

import type { GenealogyModule } from "./genealogy.module";
declare module "@/bootstrap/container" {
  interface AppContainer {
    genealogy: GenealogyModule; // <-- your context key
  }
}
```

The integrator wires `createXModule(deps)` into the container and calls
`setContainer(...)`. You do NOT edit the composition root.

## RTK Query endpoints (ui/api.ts)

```ts
import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";

export const genealogyApi = api.injectEndpoints({
  endpoints: (build) => ({
    getTree: build.query<TreeDTO, { branch?: Branch } | void>({
      queryFn: (arg) =>
        runValue(getContainer().genealogy.getTree(arg?.branch)),
      providesTags: ["Tree"],
    }),
    addPerson: build.mutation<PersonDTO, AddPersonInput>({
      queryFn: (input) => runResult(getContainer().genealogy.addPerson(input)),
      invalidatesTags: ["Tree", "Person"],
    }),
  }),
});

export const { useGetTreeQuery, useAddPersonMutation } = genealogyApi;
```

Tag types already registered: Person, Relationship, Tree, ChangeRequest, Memory,
Album, Event, Timeline, Reminder, Reaction, Comment, Wish, Feed, Member, Invite,
Notification. Use only these.

## Cross-context reads (downstream contexts only)

Timeline, Reminders, Engagement must NOT import Genealogy/Memories code. Instead:

1. Define a port interface in YOUR `application/ports.ts`, typed with
   `@/shared/views` shapes, e.g.:
   ```ts
   export interface PeopleReadPort { listPeople(): Promise<PersonView[]>; }
   export interface MemoriesReadPort { listMemories(): Promise<MemoryView[]>; }
   ```
2. Your module factory takes these ports as a second argument:
   ```ts
   export function createTimelineModule(deps: SharedDeps, reads: {
     people: PeopleReadPort; memories: MemoriesReadPort;
   }): TimelineModule { ... }
   ```
3. The integrator implements those ports by calling the producer modules'
   query methods (which return the `@/shared/views` shapes). So PRODUCER modules
   (Genealogy, Memories) MUST expose query methods returning the view shapes:
   - Genealogy module: `listPeopleViews(): Promise<PersonView[]>` and
     `listRelationshipViews(): Promise<RelationshipView[]>`.
   - Memories module: `listMemoryViews(): Promise<MemoryView[]>`.

## UI components

- Server vs client: any component using hooks/state must start with `"use client"`.
- Build presentational components that take DTO props; container components use
  the RTK Query hooks. Keep tree/list rendering behind a small presentation
  boundary where the design calls for it (Genealogy tree viz).
- Accessibility (N5): label every input (`Field`), keep targets ≥44px, ensure
  keyboard focus works, use semantic elements and aria where needed.

## What to deliver

- All domain + application code with passing Vitest tests.
- Working infrastructure repos persisting via `Collection`.
- `ui/` components + `ui/api.ts` with exported hooks.
- The module factory + `index.ts` barrel + container augmentation.
- A short `src/contexts/<context>/README.md` listing your module's public methods
  and exported hooks (the integrator reads this to wire routes).

Do NOT run the dev server or edit `app/`. The integrator handles routing, the
composition root, seeding, and final end-to-end verification.
