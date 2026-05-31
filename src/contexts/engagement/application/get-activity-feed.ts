import { ApproximateDate } from "@/shared/kernel";
import { ActivityFeed, type MemoryActivity } from "../domain/activity-feed";
import type {
  CommentRepository,
  MemoriesReadPort,
  ReactionRepository,
  WishRepository,
} from "./ports";
import { type FeedItemDTO, toFeedItemDTO } from "./dtos";

export interface GetActivityFeedInput {
  limit?: number;
}

export interface GetActivityFeedDeps {
  reactions: ReactionRepository;
  comments: CommentRepository;
  wishes: WishRepository;
  memories: MemoriesReadPort;
}

/**
 * GetActivityFeed (TECHNICAL_DESIGN §10.5). Read use case: composes the light
 * activity feed from recent memories + engagement. A read — resolves a plain
 * value (never a Result/failure).
 *
 * `MemoryView` carries no creation timestamp (it is a cross-context read shape),
 * so we approximate memory recency from its `date` when present; undated
 * memories sort to the bottom (createdAtMs = 0) deterministically.
 */
export function makeGetActivityFeed(deps: GetActivityFeedDeps) {
  return async function getActivityFeed(
    input: GetActivityFeedInput = {},
  ): Promise<FeedItemDTO[]> {
    const [memoryViews, reactions, comments, wishes] = await Promise.all([
      deps.memories.listMemories(),
      deps.reactions.listAll(),
      deps.comments.listAll(),
      deps.wishes.listAll(),
    ]);

    const memories: MemoryActivity[] = memoryViews.map((view) => ({
      view,
      createdAtMs: view.date ? ApproximateDate.fromJSON(view.date).sortKey() : 0,
    }));

    const items = ActivityFeed.build(
      { memories, reactions, comments, wishes },
      input.limit,
    );
    return items.map(toFeedItemDTO);
  };
}
