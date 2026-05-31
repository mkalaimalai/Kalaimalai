# Engagement context

Reactions, comments, wishes, and the light activity feed (TECHNICAL_DESIGN §10.5).
Owns its own persistence (`ff:engagement:*`) and READS Memories/People through
injected ports — it never imports another context's code.

## Module — `createEngagementModule(deps, reads)`

```ts
import { createEngagementModule } from "@/contexts/engagement";

const engagement = createEngagementModule(deps /* SharedDeps */, {
  memories, // MemoriesReadPort: { listMemories(): Promise<MemoryView[]> }
  people,   // PeopleReadPort:   { listPeople():   Promise<PersonView[]> }
});
```

The integrator (composition root) supplies the second `reads` argument by
delegating to the Memories module's `listMemoryViews()` and the Genealogy
module's `listPeopleViews()`, then registers the module on the container:
`container.engagement = engagement`.

### Read ports the integrator MUST supply

| Port | Shape | Bind to |
|---|---|---|
| `MemoriesReadPort` | `listMemories(): Promise<MemoryView[]>` | Memories module `listMemoryViews()` |
| `PeopleReadPort` | `listPeople(): Promise<PersonView[]>` | Genealogy module `listPeopleViews()` |

## Public methods (`EngagementModule`)

| Method | Kind | Returns |
|---|---|---|
| `reactToMemory({ memberId, memoryId, kind })` | write | `Result<ReactionDTO>` |
| `commentOnMemory({ memberId, memoryId, text })` | write | `Result<CommentDTO>` |
| `postWish({ fromMemberId, toPersonId, message, occasion? })` | write | `Result<WishDTO>` |
| `getActivityFeed({ limit? })` | read | `FeedItemDTO[]` (newest first) |
| `listReactionsFor({ targetType, targetId })` | read | `ReactionDTO[]` |
| `listCommentsFor({ targetType, targetId })` | read | `CommentDTO[]` |

Writes validate the referenced memory/person exists via the read ports
(`MEMORY_NOT_FOUND` / `PERSON_NOT_FOUND`) and enforce non-empty content.

## Hooks (`ui/api.ts`, RTK Query, tags Reaction/Comment/Wish/Feed)

- `useGetActivityFeedQuery({ limit? } | void)`
- `useListReactionsQuery({ targetType, targetId })`
- `useListCommentsQuery({ targetType, targetId })`
- `useReactToMemoryMutation()`
- `useCommentOnMemoryMutation()`
- `usePostWishMutation()`

## UI

- **`ActivityFeed`** — the `/feed` route component. Renders the chronological
  light activity feed ("New memory…", reactions, comments, wishes). Accepts an
  optional `limit`.
- **`ReactionsBar`** — inline reactions widget. Props: `target: { type, id }`,
  optional `memberId`. Reusable on memories and profiles; posting is enabled for
  `Memory` targets when a `memberId` is given (read-only otherwise).
- **`CommentList`** — inline comments widget. Same `target` / `memberId` props.

## Notes

- Birthday/festival feed items are intentionally OUT OF SCOPE — Reminders owns
  those. This context covers engagement + new-memory activity only.
- `MemoryView` has no creation timestamp, so feed recency for memories is
  approximated from each memory's `date` (undated memories sort last,
  deterministically).
