# Memories context

Photo/memory archive (TECHNICAL_DESIGN §4.3, §10.2). A small hexagon: pure domain,
use cases returning `Result`, localStorage-backed repositories, and a Phase-0
`MediaStore` that stores data URLs (stand-in for IndexedDB). Producer context — it
exposes `listMemoryViews()` for downstream consumers (Timeline, Engagement).

## Module — `createMemoriesModule(deps: SharedDeps): MemoriesModule`

Wired into the container under the `memories` key. Public methods:

| Method | Returns | Purpose |
|---|---|---|
| `addMemory(input)` | `Result<MemoryDTO>` | Add one memory. Set `storeMedia: true` to persist a data URL via the MediaStore; otherwise `media` is treated as an existing key. |
| `addMemories(inputs)` | `Result<MemoryDTO[]>` | Bulk add (all-or-nothing; fails the batch on the first invalid item). |
| `editMemory(input)` | `Result<MemoryDTO>` | Edit caption/date/place. |
| `tagPersonInMemory(memoryId, personId)` | `Result<MemoryDTO>` | Tag a person (unique set). |
| `untagPersonInMemory(memoryId, personId)` | `Result<MemoryDTO>` | Remove a tag. |
| `createAlbum(input)` | `Result<AlbumDTO>` | Create a grouping album. |
| `createEvent(input)` | `Result<EventDTO>` | Create an event (single date or date range). |
| `linkMemoryToEvent(memoryId, eventId)` | `Result<MemoryDTO>` | Link a memory to an existing event. |
| `listMemoriesFor(filter?)` | `MemoryDTO[]` | Read, filtered by `{ personId?, albumId?, eventId?, year? }`, sorted by date ascending. |
| `getMemory(id)` | `MemoryDTO \| null` | Single read. |
| `listAlbums()` | `AlbumDTO[]` | All albums. |
| `listEvents()` | `EventDTO[]` | All events. |
| `resolveMedia(key)` | `string \| null` | Resolve a media key to its data URL. |
| `listMemoryViews()` | `MemoryView[]` | **Cross-context producer query** (`@/shared/views`). |

## Hooks (`ui/api.ts`)

Queries: `useListMemoriesQuery(filter?)`, `useGetMemoryQuery(id)`, `useListAlbumsQuery()`.
Mutations: `useAddMemoryMutation()`, `useTagPersonInMemoryMutation()`, `useCreateAlbumMutation()`.

Tags used: `Memory`, `Album` (add-memory also invalidates `Timeline`/`Feed`).

## Route components (for the integrator)

| Component | Suggested route | Notes |
|---|---|---|
| `MemoryGrid` | `/memories` | Responsive card grid with person/year/album filters. Pass `albumId` to scope it. |
| `AddMemoryForm` | `/memories` (e.g. a dialog/section) | One-tap add: caption, date, place, file→data URL, and a tag-chip confirm/remove UI (reusable by Phase-1 face recognition). |
| `AlbumView` | album pages (e.g. `/memories/album/[albumId]`) | Album heading + its memories. |
| `MemoryCard` | — | Presentational; exported for reuse. |

All UI components are `"use client"`. Inputs are labelled via `Field`, targets are
≥44px, image `alt` text comes from the caption, and the grid uses keyboard-navigable
links (N5).
