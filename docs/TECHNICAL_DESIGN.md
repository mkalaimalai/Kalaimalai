# Family Fabric — Technical Design Document (Frontend)

| | |
|---|---|
| **Product** | Family Fabric |
| **Document** | Technical Design — Frontend (Phase 0 MVP) |
| **Version** | 1.0 |
| **Status** | Draft for build |
| **Companion** | [`docs/PRD.md`](./PRD.md) |
| **Scope of this doc** | The **frontend application only**. A real backend is **deferred**; the domain runs in the browser behind ports, with in-memory + localStorage adapters standing in for server persistence. The architecture is designed so the backend can be added later by swapping driven adapters — no domain or UI changes. |

> **Out of scope (by design):** server/API implementation, database schema, cloud
> infrastructure, the face-recognition pipeline (Phase 1), and native mobile
> (Phase 2). This document defines how the browser app is structured so those land
> cleanly later.

---

## 1. Goals & Principles

1. **Domain-Driven Design.** Model the family as a rich domain (tree, memories,
   timeline, reminders) with an explicit ubiquitous language and bounded contexts —
   not as CRUD over database tables.
2. **Hexagonal (Ports & Adapters).** The domain and application logic sit at the
   center and know nothing about React, Redux, the browser, or any future API. All
   I/O crosses an explicit **port**; everything external is an **adapter**.
3. **Backend-swappable.** Because persistence lives behind ports, "add the backend
   later" is a matter of writing new driven adapters (HTTP) and rewiring the
   composition root. The hexagon is untouched.
4. **Strict TypeScript, no `any`.** `strict: true`. The domain layer is pure,
   framework-free TypeScript and fully unit-testable without a DOM.
5. **Elder-first accessibility (PRD N5).** Accessible primitives, large targets,
   WCAG-aligned contrast, keyboard + screen-reader support — a first-class
   constraint, not a polish pass.
6. **Right-sized (PRD N4).** ~50–500 members, tens of thousands of media items. Do
   not over-engineer for millions.

---

## 2. Technology Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js (App Router)** + **React** | App Router; route segments are a *driving adapter* — thin, delegating to the application layer. |
| Language | **TypeScript (strict)** | Domain layer is pure TS, no framework imports. |
| Styling / components | **Tailwind CSS + shadcn/ui** | Radix-based accessible primitives → directly serves N5. Components copied into the repo (owned, themeable). |
| App & data state | **Redux Toolkit + RTK Query** | RTK Query is the UI-facing data gateway; its `queryFn` calls application use cases (not HTTP yet). RTK slices hold local UI state. |
| Persistence (now) | **In-memory repositories + localStorage / IndexedDB** | Real domain logic runs in the browser; data survives reloads. IndexedDB (via a thin wrapper) for media/larger blobs; localStorage for small structured data. |
| Persistence (later) | **HTTP adapters** | Swap-in; see §11. |
| Tree visualization | A graph/tree view lib (e.g. React Flow or D3-based) behind a UI port | Kept behind a presentation boundary so it can be replaced. |
| Testing | **Vitest** (domain/application/unit), **React Testing Library** (components), **Playwright** (E2E, later) | TDD per repo conventions. |
| i18n | **next-intl** (or equivalent) | N6: multi-language, locale-aware dates/festivals. |

---

## 3. Architectural Overview

### 3.1 The dependency rule

Dependencies point **inward only**. Nothing in an inner ring may import from an
outer ring.

```
        ┌─────────────────────────────────────────────────────────┐
        │  Driving adapters (Next.js routes, React, RTK Query)      │
        │   ┌─────────────────────────────────────────────────┐    │
        │   │  Application layer (use cases / input ports)      │    │
        │   │   ┌─────────────────────────────────────────┐    │    │
        │   │   │  Domain (entities, value objects,         │    │    │
        │   │   │  aggregates, domain services, events)     │    │    │
        │   │   └─────────────────────────────────────────┘    │    │
        │   │        ▲ uses output ports (interfaces)           │    │
        │   └─────────────────────────────────────────────────┘    │
        │              implemented by ▼                             │
        │  Driven adapters (in-memory + localStorage repos,         │
        │  notification stub, GEDCOM import/export, clock)          │
        └─────────────────────────────────────────────────────────┘
```

- **Domain** — pure business model. No React, no Redux, no `window`. Knows nothing
  about persistence.
- **Application** — orchestrates use cases (a.k.a. *input ports*). Depends on the
  domain and on *output port* interfaces. Contains no I/O itself.
- **Driving adapters** — what *drives* the app: Next.js route segments and React
  components dispatch into use cases (via RTK Query / hooks).
- **Driven adapters** — what the app *drives*: repository implementations, the
  notification stub, the GEDCOM port, the clock. They implement output ports.
- **Composition root** — the only place adapters and use cases are wired together
  (§9.3). Swapping adapters happens here and nowhere else.

### 3.2 Per-context hexagon

Every bounded context is its own small hexagon with this internal shape:

```
contexts/<context>/
  domain/          # entities, value objects, aggregates, domain services, events
  application/     # use cases (input ports), DTOs, output-port interfaces
  infrastructure/  # driven adapters: repositories, mappers, stubs
  ui/              # React components, hooks, RTK slices + RTK Query endpoints
```

---

## 4. Domain Model & Bounded Contexts

### 4.1 Context map

| Context | Type | Responsibility |
|---|---|---|
| **Genealogy** | **Core** | The family tree: people, relationships, dual maternal/paternal lineage, branches. The heart of the product. |
| **Memories** | Core | Photo/memory archive: media, captions, albums/events, manual person-tagging, links to people. |
| **Timeline** | Supporting (read model) | Chronological projection over memories + life events; per-person / per-branch / whole-family views; "On this day". |
| **Engagement** | Supporting | Reactions, comments, wishes, and the activity feed. |
| **Reminders** | Supporting | Birthdays, anniversaries, festivals — derived from Genealogy + a festival calendar. |
| **Identity & Access** | Supporting | Members, invite-only onboarding, roles (Admin / Member / Elder-viewer). Stubbed locally for now. |
| **Notifications** | Generic | Outbound delivery (WhatsApp/email) — **stub adapter only** in Phase 0 (PRD F6.1, outbound-only). |

**Relationships.** Genealogy is upstream of nearly everything (a `PersonId` is the
shared reference). Timeline and Reminders are **downstream read/derivation models**
that consume Genealogy + Memories. Engagement attaches to Memories and People.

### 4.2 Shared kernel

A small, carefully-guarded shared module holds cross-context primitives:
`PersonId`, `MemberId`, `MemoryId`, `ApproximateDate` (handles "1998" vs an exact
day — PRD F2.1/F4), `Branch` (Maternal | Paternal), `Result`/error types, and the
`Clock` port. Identifiers are typed value objects (branded types) so a `PersonId`
can never be passed where a `MemoryId` is expected.

### 4.3 Core aggregates (illustrative)

- **Genealogy → `Person` (aggregate root)**: identity, names (legal + nickname),
  gender, `ApproximateDate` of birth, optional date of passing (living/deceased),
  birthplace, current location, bio, visibility (`Public | Restricted | Unlisted`),
  branch. Invariants: a deceased person cannot gain future-dated life events; an
  "unlisted" person is excluded from feeds/reminders.
- **Genealogy → `Relationship`**: typed edge between two `PersonId`s
  (`ParentOf | SpouseOf | SiblingOf`, with adoption/step/remarriage modeled as
  qualifiers). Sibling/cousin links are *derived*, not stored, where possible.
  Structural edits are **proposals** until an Admin approves them (PRD F1.5) — model
  this as a `RelationshipChangeRequest` with an approval state.
- **Memories → `Memory` (aggregate root)**: media reference(s), `ApproximateDate`,
  place, caption/story, `taggedPeople: PersonId[]`, optional `albumId`/`eventId`.
- **Memories → `Album` / `Event`**: grouping aggregate (e.g. "Diwali 2019").
- **Engagement → `Reaction` / `Comment` / `Wish`**: attach to a `Memory` or a
  person's day.
- **Reminders → `ReminderRule`**: derived occurrence (birthday/anniversary/festival)
  with a next-occurrence calculation (time-zone-aware — N6).

Domain services live where logic spans aggregates, e.g.
`RelationshipPathService.explain(a, b)` ("how am I related to X?") and
`TimelineProjectionService` (build the ordered timeline from people + memories).

---

## 5. Folder Structure

```
family-fabric/
├─ app/                              # Next.js App Router — DRIVING adapter (thin)
│  ├─ layout.tsx                     # root layout, providers (Redux, i18n, theme)
│  ├─ (auth)/invite/[token]/         # invite onboarding
│  ├─ tree/                          # family tree views
│  │  ├─ page.tsx
│  │  └─ [personId]/page.tsx         # person profile
│  ├─ memories/                      # archive, albums, upload
│  ├─ timeline/                      # chronological views + "on this day"
│  ├─ calendar/                      # reminders / birthdays / festivals
│  └─ feed/                          # activity feed + engagement
├─ src/
│  ├─ contexts/
│  │  ├─ genealogy/{domain,application,infrastructure,ui}/
│  │  ├─ memories/{domain,application,infrastructure,ui}/
│  │  ├─ timeline/{domain,application,infrastructure,ui}/
│  │  ├─ engagement/{domain,application,infrastructure,ui}/
│  │  ├─ reminders/{domain,application,infrastructure,ui}/
│  │  ├─ identity/{domain,application,infrastructure,ui}/
│  │  └─ notifications/{application,infrastructure}/   # stub only
│  ├─ shared/
│  │  ├─ kernel/                     # PersonId, ApproximateDate, Branch, Result…
│  │  ├─ ports/                      # cross-cutting ports (Clock, IdGenerator)
│  │  └─ ui/                         # shadcn/ui components, design tokens, a11y helpers
│  ├─ store/                         # RTK store config, root reducer, listener mw
│  └─ bootstrap/                     # COMPOSITION ROOT: wire adapters → use cases
├─ test/                             # cross-context integration tests, fixtures
└─ ...
```

**Boundary lint rule (enforced):** `domain/` may import only from `domain/` and
`shared/kernel/`. `application/` may import `domain/` + ports. `ui/` and route
segments may import `application/` (use-case DTOs/hooks) but **never** reach into
another context's `domain/`. Enforce with an ESLint import-boundary rule (e.g.
`eslint-plugin-boundaries`) so violations fail CI.

---

## 6. Ports & Adapters Catalog

### 6.1 Output ports (driven — domain/app needs these)

| Port (interface) | Phase-0 adapter | Backend-later adapter |
|---|---|---|
| `PersonRepository`, `RelationshipRepository` | `LocalStoragePersonRepository` (+ in-memory cache) | `HttpPersonRepository` |
| `MemoryRepository`, `AlbumRepository` | localStorage (metadata) + **IndexedDB** (media blobs) | HTTP + object storage |
| `EngagementRepository` | localStorage | HTTP |
| `ReminderQueryPort` | derives from repos in-browser | server-computed |
| `NotificationSender` (outbound) | **`StubNotificationSender`** (logs/queues; surfaces a "would send" toast) | WhatsApp/email channel adapter |
| `GedcomPort` (import/export — PRD F1.6) | browser file read/write | server-side, same interface |
| `Clock`, `IdGenerator` | `SystemClock`, `UuidGenerator` | unchanged |

### 6.2 Input ports (driving — use cases)

Use cases are the application's public surface, e.g. `AddPerson`,
`ProposeRelationshipChange`, `ApproveRelationshipChange`, `AddMemory`,
`TagPersonInMemory`, `BuildTimeline`, `ListUpcomingReminders`, `ReactToMemory`,
`PostWish`, `RedeemInvite`. UI calls these — never repositories directly.

---

## 7. State Management & Data Flow

We use Redux Toolkit, but keep the hexagon intact by treating RTK Query as a
**driving adapter**, not as the data source.

```
React component
   │  (hook)
   ▼
RTK Query endpoint  ──queryFn──▶  Application use case  ──port──▶  Repository adapter
   │  (cache, loading, invalidation)        │                         │
   ▼                                        ▼                         ▼
UI re-render                          Domain logic            localStorage / IndexedDB
```

- **RTK Query** endpoints use a **custom `queryFn`** (with `fakeBaseQuery()`), which
  resolves the relevant use case from the composition root and invokes it. RTK Query
  still gives us caching, loading/error states, and tag-based invalidation — but the
  *work* happens in the application layer, not over HTTP. When the backend lands,
  endpoints switch to `fetchBaseQuery` **or** keep `queryFn` and let the use case
  call an HTTP repository — either way the components don't change.
- **RTK slices** hold purely local UI state: tree zoom/pan, selected person, upload
  drafts, modal state, filters. No domain rules live here.
- **Selectors / mappers** translate domain DTOs → view models for components.
  Components receive plain serializable DTOs (never live domain entities — keeps the
  Redux store serializable and the UI decoupled).

---

## 8. Persistence Strategy (Phase 0)

- **In-memory + localStorage/IndexedDB.** Repositories keep an in-memory map for
  speed and write through to storage. Small structured records → localStorage;
  media blobs and large collections → IndexedDB.
- **Seeding.** A fixtures module seeds a believable starter family on first run so
  the app is "alive" immediately (PRD activation metric).
- **Schema versioning.** Each storage namespace carries a `schemaVersion`; a tiny
  migration runner upgrades older payloads. This rehearses real migrations and
  protects the irreplaceable-data principle (PRD N3) even in the local phase.
- **Export/portability (N3, F1.6).** GEDCOM export for the tree and a JSON+media
  archive export are available from day one via `GedcomPort` / an export use case —
  data is never locked in, and this validates the export contract before a backend
  exists.
- **Privacy boundary.** Visibility rules (`Restricted`/`Unlisted`, minors) are
  enforced in the **domain/application** layer, not the UI, so they survive the
  backend swap unchanged.

---

## 9. Cross-Cutting Concerns

1. **Identity & access (stub).** `identity` context models `Member`, `Invite`, and
   `Role`. Phase 0 uses a local stub auth adapter (pick-a-member / magic-link
   simulation) behind an `AuthPort`, so route guards and role checks are real code
   now and the swap to passwordless auth later is adapter-only.
2. **Authorization.** Role checks (`Admin` approves structural tree changes — F1.5)
   live in use cases, enforced centrally, not scattered in components.
3. **i18n & locale (N6).** `next-intl`; all dates run through `ApproximateDate` +
   locale formatting; festival calendar is data-driven and locale-aware.
4. **Accessibility (N5).** shadcn/ui (Radix) primitives; a shared a11y checklist for
   focus management, target size, and contrast; an "elder mode" theme token set
   (larger type/targets).
5. **Error handling.** Use cases return a `Result<T, DomainError>` (no thrown
   control-flow); RTK Query surfaces errors as typed states; a global error boundary
   catches the unexpected.
6. **Composition root (`src/bootstrap`).** Builds repositories, wraps them in use
   cases, and exposes a typed registry the RTK Query `queryFn`s resolve from. This
   is the single seam where "local adapters" become "HTTP adapters" later.
7. **Future biometric boundary.** Face recognition (Phase 1) is reserved as its own
   context with its own consent-gated ports; nothing in Phase 0 touches biometric
   data, but the seam is named so it slots in without reshaping the archive.

---

## 10. Phase-0 Feature Slices

Each slice lists its context, key aggregates/use cases, the ports it needs, and its
routes/UI. All follow the identical layered path of §7.

### 10.1 Family Tree (Genealogy) — *the reference slice*

- **Aggregates:** `Person`, `Relationship`, `RelationshipChangeRequest`.
- **Use cases:** `AddPerson`, `EditPerson`, `ProposeRelationshipChange`,
  `ApproveRelationshipChange` (Admin), `GetTree(branchFilter)`,
  `GetPersonProfile(personId)`, `ExplainRelationship(a, b)`,
  `ImportGedcom` / `ExportGedcom`.
- **Ports:** `PersonRepository`, `RelationshipRepository`, `GedcomPort`,
  `IdGenerator`, `Clock`.
- **Routes/UI:** `/tree` (zoomable dual-sided graph, branch filter),
  `/tree/[personId]` (profile: dates, relationships, linked memories). Tree
  rendering sits behind a presentation port so the viz lib is replaceable.
- **Invariants demonstrated:** structural edits require Admin approval; unlisted
  members hidden; deceased/living handling.

### 10.2 Photo / Memory Archive (Memories)

- **Aggregates:** `Memory`, `Album`, `Event`.
- **Use cases:** `AddMemory` (single + bulk), `EditMemory`, `TagPersonInMemory`,
  `CreateAlbum`, `LinkMemoryToEvent`, `ListMemoriesFor(personId | album | filter)`.
- **Ports:** `MemoryRepository` (localStorage metadata), `MediaStore` (IndexedDB
  blobs + on-upload thumbnail generation), `IdGenerator`, `Clock`.
- **Routes/UI:** `/memories` (grid + filters by person/year/event/branch), album
  pages, one-tap "add a memory", bulk upload for Admin. **Manual person-tagging**
  now; the tag/confirm UX is built so Phase-1 face recognition reuses it.

### 10.3 Timeline (read model)

- **Domain service:** `TimelineProjectionService` composes ordered entries from
  people (births, passings, life events) + memories.
- **Use cases:** `BuildTimeline(scope: WholeFamily | Branch | Person)`,
  `GetOnThisDay(date)` (Phase 1 surfaces it; the projection supports it now).
- **Ports:** read access to `PersonRepository`, `MemoryRepository` via a
  `TimelineQueryPort`.
- **Routes/UI:** `/timeline` with scope switcher and lazy-loaded media.

### 10.4 Reminders (Calendar)

- **Aggregates/services:** `ReminderRule`, `NextOccurrenceService`,
  `FestivalCalendar` (data-driven, lunar/solar + regional).
- **Use cases:** `ListUpcomingReminders(window)`, `GetSuggestedGreeting(occasion)`.
- **Ports:** `ReminderQueryPort` (derives from Genealogy), `Clock` (TZ-aware),
  `NotificationSender` (stub — "would send to WhatsApp").
- **Routes/UI:** `/calendar` (birthdays/anniversaries/festivals), reminder cards
  with one-tap "send wish" → outbound stub + deep-link share.

### 10.5 Engagement (Activity Feed & Social)

- **Aggregates:** `Reaction`, `Comment`, `Wish`; an `ActivityFeed` projection.
- **Use cases:** `ReactToMemory`, `CommentOnMemory`, `PostWish`,
  `GetActivityFeed(memberId)`.
- **Ports:** `EngagementRepository`, plus read access to Memories/Genealogy.
- **Routes/UI:** `/feed` (light activity feed — "3 new photos…", "It's Meena's
  birthday"), inline reactions/comments on memories and profiles.

### 10.6 Identity & Onboarding (stub)

- **Aggregates:** `Member`, `Invite`, `Role`.
- **Use cases:** `CreateInvite` (expiring), `RedeemInvite`, `ApproveMember` (Admin),
  `GetCurrentMember`.
- **Ports:** `AuthPort` (local stub now → passwordless later), `MemberRepository`.
- **Routes/UI:** `/invite/[token]` onboarding, role-gated navigation.

### 10.7 Notifications (outbound stub)

- **Use case:** `SendOutbound(notification)` — invoked by Reminders/Engagement.
- **Port/adapter:** `NotificationSender` → `StubNotificationSender` (records intent,
  shows a "would send" toast, supports manual WhatsApp deep-link share per PRD F6.1/
  F6.2). **No group scraping** — explicitly excluded (PRD F6.3).

---

## 11. Backend-Later Migration Path

Adding the backend touches **only the outer ring**:

1. Implement HTTP adapters for each output port
   (`HttpPersonRepository`, `HttpMemoryRepository`, real `NotificationSender`, …)
   against the contract the ports already define.
2. In `src/bootstrap` (composition root), bind ports to the HTTP adapters instead of
   the localStorage/IndexedDB ones — environment-switchable so local-only mode still
   works for development/offline.
3. RTK Query endpoints either keep their `queryFn` (now calling use cases backed by
   HTTP repos) or move to `fetchBaseQuery`. Components, hooks, domain, and use cases
   are **unchanged**.
4. The existing port interfaces and the GEDCOM/JSON export already define the data
   contract, so the backend API can be specified directly from them — the frontend
   effectively authors the contract first.

**Untouched by the backend swap:** every `domain/`, every `application/` use case,
all UI components, all routes. That isolation is the entire point of choosing
hexagonal here.

---

## 12. Testing Strategy

- **Domain (Vitest):** pure unit tests for entities, value objects, invariants, and
  domain services (`RelationshipPathService`, `TimelineProjectionService`,
  `NextOccurrenceService`). No DOM, no mocks of frameworks. Highest coverage target.
- **Application (Vitest):** use-case tests against **in-memory** port fakes — the
  same fakes used in fixtures, so tests exercise real wiring minus storage.
- **UI (React Testing Library):** component behavior + accessibility assertions
  (roles, focus, labels), with RTK Query/store provided via a test harness.
- **E2E (Playwright, later):** invite → view tree → add a memory → see it on the
  timeline (mirrors the PRD activation metric).
- **TDD** per repo conventions: write the failing test for the use case/domain rule
  before the implementation.

---

## 13. Open Questions (deferred)

1. **Tree visualization library** — React Flow vs a custom D3 layout for large dual-
   sided trees; decide behind the presentation port after a spike.
2. **localStorage vs IndexedDB split** — exact threshold and wrapper (idb vs Dexie)
   for media; confirm during the Memories slice.
3. **Auth stub fidelity** — how closely the local `AuthPort` should mimic the future
   passwordless/magic-link flow.
4. **i18n scope for MVP** — which languages beyond English ship first (ties to PRD
   open question 6).
5. **Offline depth** — how far to push offline-tolerant viewing (N5) in Phase 0 vs
   later.

---

> **Relationship to the PRD.** This document realizes the PRD's Phase-0 scope (§9 of
> `PRD.md`) under a DDD + hexagonal frontend. Product requirements, success metrics,
> and privacy governance remain owned by the PRD; this document owns *how* the
> browser app is structured to deliver them and to accept a backend later.
