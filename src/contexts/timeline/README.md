# Timeline context

A **downstream READ MODEL** (TECHNICAL_DESIGN §4.1, §10.3). Timeline owns **no
persistence** and **does not import** Genealogy or Memories code. It projects an
ordered, chronological list of life events (births, passings) and memories from
data read through two injected ports typed with `@/shared/views`.

## Read ports the integrator MUST supply

`createTimelineModule(deps, reads)` takes a **second argument** with the producer
read ports. Bind these at the composition root to the producer modules' query
methods:

```ts
import { createTimelineModule } from "@/contexts/timeline";

const timeline = createTimelineModule(deps, {
  people: { listPeople: () => genealogy.listPeopleViews() }, // -> PersonView[]
  memories: { listMemories: () => memories.listMemoryViews() }, // -> MemoryView[]
});
// then: setContainer({ ...others, timeline })
```

- `PeopleReadPort.listPeople(): Promise<PersonView[]>`
- `MemoriesReadPort.listMemories(): Promise<MemoryView[]>`

Timeline excludes **Unlisted** people from all feeds (their births/passings are
dropped and they are removed from memory tag lists).

## Module — public methods (`TimelineModule`)

| Method | Input | Returns |
|---|---|---|
| `buildTimeline` | `{ scope }` where scope is `{kind:"WholeFamily"}` \| `{kind:"Branch", branch}` \| `{kind:"Person", personId}` | `Promise<TimelineDTO>` |
| `getOnThisDay` | `{ month, day }` | `Promise<TimelineDTO>` |

Both are read queries (never fail) — endpoints use `runValue`. Entries are
ordered chronologically using `ApproximateDate` sort semantics (coarser dates
sort to the start of their range). `getOnThisDay` only matches day-precise dates.

`TimelineDTO = { scope, entries: TimelineEntryDTO[] }` and
`TimelineEntryDTO = { id, kind: "birth"|"passing"|"memory", date, sortKey, title,
personIds[], memoryId? }` — all plain/serializable.

## Hooks (`ui/api.ts`)

Injected into the shared RTK Query `api`, tagged `Timeline`:

- `useBuildTimelineQuery({ scope })`
- `useGetOnThisDayQuery({ month, day })`

## `/timeline` route component

`ui/TimelineView.tsx` (client):

- `TimelineView({ people? })` — container. Vertical chronological list with a
  scope switcher (Whole family / Maternal / Paternal / a person), grouped by
  year. `people: PersonOption[]` (`{ id, displayName }`) powers the per-person
  options; pass it from the Genealogy read view.
- `TimelineList({ timeline })` — pure presentational list grouped by year, takes
  a ready `TimelineDTO`.

Mount `TimelineView` at the `/timeline` route. Uses shared UI primitives
(`Card`, `Field`, `Select`), labelled controls, and semantic `ol`/`time`.

## Tests

`npx vitest run src/contexts/timeline` — domain projection (ordering, scope
filtering, unlisted exclusion, on-this-day), use cases (fake read ports), and
the presentational list component.
