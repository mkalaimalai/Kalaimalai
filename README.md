# Family Fabric

> **Phase-0 MVP · Frontend**

A private, lasting digital home for the whole extended family — preserving the family tree, faces, and history, and giving everyone a reason to keep showing up for each other.

**Next.js 14** (App Router) · **React 18** + TypeScript (strict) · **Redux Toolkit** + RTK Query · **Tailwind CSS** · **DDD** + Hexagonal · **319** tests

**Contents:** [What it is](#01--what-this-project-is) · [Features](#02--what-it-does-phase-0-mvp) · [Architecture](#03--how-its-built--ddd--hexagonal) · [Bounded contexts](#04--the-seven-bounded-contexts) · [Structure](#05--project-structure) · [Run it](#06--running-it) · [Deployment](#07--deployment) · [Roadmap](#08--phased-roadmap)

---

## 01 · What this project is

Large extended families — spanning maternal and paternal sides, scattered across cities, countries, and time zones — slowly drift apart. Birthdays get missed, photos scatter across phones and chat threads, and elders' stories go unrecorded. Public social media buries family moments under noise and ads, and is hostile to elders and to privacy.

**Family Fabric** is the antidote: a warm, closed, invite-only, multi-generational family _home_ on the web. It is deliberately **not** a public social network, not an Ancestry/MyHeritage genealogy research product, not a generic photo backup, and not a WhatsApp replacement.

| | |
| --- | --- |
| 🌳 **Preserve** | One permanent record of the dual-sided family tree — who we are, our faces, our history. |
| 📸 **Find** | Every memory (photo + context) findable by person, time, and event. |
| 🔒 **Private** | Strictly family-only. No public access, no indexing, no ads, no tracking. |
| 💛 **Connect** | Lightweight recurring reasons to stay in touch — reminders, reactions, wishes. |

> **Design north star:** the least-technical member — "Grandma/Grandpa," 60s–80s, possibly on an older phone — defines the product's success. Elder-first accessibility is a first-class constraint, not a polish pass.

---

## 02 · What it does (Phase-0 MVP)

- **🌳 Dual-sided family tree** — Both maternal & paternal sides in one connected, zoomable, pannable tree, rendered with the [`family-chart`](https://github.com/donatso/family-chart) (f3) D3 library. Each person can carry a photo avatar; tap a person → their profile, or re-root the tree on them. GEDCOM import/export keeps the data portable.
- **📸 Memory archive** — Photos & stories with date, place, event, and manual person-tagging; grouped into albums/events; filter by person, year, or branch.
- **🗓️ Chronological timeline** — A family-wide read model projecting memories and life events onto a horizontal year-axis — filterable by person, branch, or whole-family.
- **🎂 Reminders** — Birthday, anniversary & festival reminders auto-derived from the tree and a festival calendar.
- **💬 Engagement feed** — Reactions, comments, and "wishes" on memories and people's days, plus a light activity feed.
- **✉️ Invite-only access** — Stubbed identity & onboarding via expiring invite links; roles for Admin / Member / Elder-viewer. Outbound notifications are a stub adapter for now.

---

## 03 · How it's built — DDD + Hexagonal

The family is modeled as a rich domain — not CRUD over database tables. The app follows **Domain-Driven Design** with a **Hexagonal (Ports & Adapters)** architecture. Dependencies point **inward only**: nothing in an inner ring may import from an outer ring.

```
▸ Driving adapters
  Next.js route segments + React components + RTK Query. Thin — they delegate into use cases.
─────────────────────────────────────────────────────────────────────────────
▸ Application layer (use cases / input ports)
  Orchestrates use cases. Depends on the domain and on output-port interfaces. Contains no I/O itself.
─────────────────────────────────────────────────────────────────────────────
▸ Domain (entities, value objects, aggregates, services)
  Pure, framework-free TypeScript. No React, no Redux, no `window`. Fully unit-testable without a DOM.
─────────────────────────────────────────────────────────────────────────────
▸ Driven adapters
  localStorage / in-memory repositories, GEDCOM import/export, clock, notification stub — implement the output ports.
```

### Key architectural moves

- **Per-context hexagon.** Every bounded context is its own small hexagon: `domain/ · application/ · infrastructure/ · ui/`.
- **Self-wiring modules.** Each context exposes a `<context>.module.ts` factory plus an `index.ts` that augments the `AppContainer` interface via TypeScript declaration merging — so the composition root wires modules without central edits.
- **Composition root.** `src/bootstrap/compose.ts` is the _only_ place adapters meet use cases and cross-context read ports are bound. Swapping localStorage for a real HTTP backend later happens here — and nowhere else.
- **RTK Query as a driving adapter.** A single shared `api` (`src/store/api.ts`) whose endpoints' `queryFn`s call use cases via `getContainer()` — no HTTP yet.
- **Backend-swappable by design.** Persistence lives behind ports; the domain and UI never change when a server is added.
- **Cross-context reads.** No context imports another's domain. Downstream read models (Timeline, Reminders, Engagement) receive producer query methods through `@/shared/views` ports injected at composition.
- **Pure view adapters.** The tree UI keeps a side-effect-free adapter (`tree/family-chart-adapter.ts`) that maps our edge-based `TreeDTO` into the flat relationship-pointer format `family-chart` consumes — so the layout library can be reasoned about (and swapped) independently of the domain.

---

## 04 · The seven bounded contexts

| Context | Kind | Responsibility |
| --- | --- | --- |
| **Genealogy** | core | The family tree: people (with photos), relationships, dual maternal/paternal lineage, branches, change-requests, GEDCOM, and the `family-chart` tree visualization. The heart of the product. |
| **Memories** | core | Photo/memory archive: media, captions, albums/events, manual person-tagging, links to people. |
| **Timeline** | support | A chronological read model projecting memories + life events onto a year axis; per-person / per-branch / whole-family views. |
| **Reminders** | support | Birthdays, anniversaries & festivals derived from Genealogy + a festival calendar. |
| **Engagement** | support | Reactions, comments, wishes, and the activity feed. |
| **Identity & Access** | support | Members, invite-only onboarding, roles (Admin / Member / Elder-viewer). Stubbed locally. |
| **Notifications** | generic | Outbound delivery (WhatsApp/email) — a stub adapter only in Phase-0 (outbound-only). |

> Genealogy is upstream of nearly everything — a `PersonId` is the shared reference. A first-run seed (`src/bootstrap/seed.ts`) creates a 3-generation Sharma / Iyer family so the app is alive on first load.

---

## 05 · Project structure

```
Kalaimalai/
├─ app/                       # Next.js App Router — driving adapter (thin route segments)
│  ├─ page.tsx                # home
│  ├─ tree/ · tree/[personId] # family tree + person profile
│  ├─ memories/ · timeline/   # archive + chronological views
│  ├─ calendar/ · feed/       # reminders + activity feed
│  └─ (auth)/invite/[token]   # invite-only onboarding
│
├─ src/
│  ├─ contexts/<context>/     # one hexagon per bounded context
│  │  ├─ domain/              # pure entities, value objects, services
│  │  ├─ application/         # use cases, DTOs, ports, GEDCOM, mappers
│  │  ├─ infrastructure/      # localStorage / in-memory repositories
│  │  ├─ ui/                  # React components + RTK Query endpoints
│  │  ├─ <context>.module.ts  # factory
│  │  └─ index.ts             # augments AppContainer (declaration merging)
│  ├─ bootstrap/              # compose.ts (composition root), container, seed
│  ├─ shared/                 # kernel: ui primitives, infra (Collection), views ports
│  └─ store/                  # Redux store + shared RTK Query api
│
├─ public/avatars/            # seeded person avatar images
├─ test/                      # integration + snapshot tests (end-to-end proof)
├─ docs/                      # PRD.md, TECHNICAL_DESIGN.md, bulk template
└─ build_family_tree.py       # helper to build the tree from an Excel sheet
```

### Persistence

A schema-versioned `Collection` (`src/shared/infrastructure`) stores small structured data in **localStorage** in the browser and in-memory during SSR / tests — so data survives reloads today and a server can be slotted in later without touching the domain. Person photos are uploaded client-side, resized via a shared image-resize helper, and stored as data URLs alongside the person record.

---

## 06 · Running it

```bash
# install dependencies
npm install

# start the dev server → http://localhost:3000
npm run dev

# quality gates
npm test          # Vitest — 319 tests (domain, application, components, integration)
npm run typecheck # tsc --noEmit (strict mode, no `any`)
npm run build     # static production export → out/
npm run lint      # next lint
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Next.js dev server with hot reload |
| `npm run build` / `npm start` | Static export build & serve |
| `npm test` / `npm run test:watch` | Run / watch the Vitest suite |
| `npm run typecheck` | Strict TypeScript check, no emit |
| `npm run lint` | ESLint via `next lint` |

---

## 07 · Deployment

The app is a fully client-side SPA — data lives in the visitor's `localStorage`, with no API routes or server components — so it ships as a **static export to GitHub Pages** (`next.config.mjs` sets `output: "export"`).

GitHub Pages serves from a sub-path (`/<repo>/`), so the CI build sets `NEXT_PUBLIC_BASE_PATH=/Kalaimalai` to apply the `basePath`/`assetPrefix`; local `dev`/`build` leave it empty and run at the root unchanged. `trailingSlash: true` emits per-route `index.html` files so nested paths resolve cleanly, and `images.unoptimized` ships images as-is (export has no image server).

---

## 08 · Phased roadmap

| Phase | Theme | Highlights |
| --- | --- | --- |
| **0 — MVP** _(this repo)_ | "The family shows up and it's alive" | Dual-sided tree (GEDCOM) with photo avatars, memory archive with manual tagging, year-axis timeline, reminders, reactions/feed, outbound notification stub, invite-only onboarding. Privacy, security, durability & elder-usability built in from day one. |
| **1** | The headline feature | Face-recognition retrieval with a full biometric-consent flow (click a person → every photo they appear in), "On this day" resurfacing, memory prompts to elders. |
| **2** | Depth & reach | Native mobile apps, voice/video elder story capture with transcription, multi-language UI, richer collaborative tree editing. |
| **3** | Stretch / decisions | Deeper WhatsApp integration only if a compliant path emerges, AI features (relationship explainer, life-story summaries, semantic search), heritage recipe vault, geospatial family map. |

> **Note on this codebase:** Phase-0 is a **frontend-only** build. A real backend is deferred by design — the domain runs in the browser behind ports, with localStorage / in-memory adapters standing in for server persistence. Adding the backend later means writing HTTP driven adapters and rewiring the composition root; the hexagon stays untouched.

---

_Family Fabric · Phase-0 MVP · Built with Next.js, React & TypeScript following DDD + Hexagonal architecture._
_See `docs/PRD.md` and `docs/TECHNICAL_DESIGN.md` for the full product and engineering specs._
