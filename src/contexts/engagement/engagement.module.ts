import type { SharedDeps } from "@/bootstrap/container";
import type { Result } from "@/shared/kernel";
import { LocalStorageReactionRepository } from "./infrastructure/local-storage-reaction-repository";
import { LocalStorageCommentRepository } from "./infrastructure/local-storage-comment-repository";
import { LocalStorageWishRepository } from "./infrastructure/local-storage-wish-repository";
import type { MemoriesReadPort, PeopleReadPort } from "./application/ports";
import {
  makeReactToMemory,
  type ReactToMemoryInput,
} from "./application/react-to-memory";
import {
  makeCommentOnMemory,
  type CommentOnMemoryInput,
} from "./application/comment-on-memory";
import { makePostWish, type PostWishInput } from "./application/post-wish";
import {
  makeGetActivityFeed,
  type GetActivityFeedInput,
} from "./application/get-activity-feed";
import {
  makeListReactionsFor,
  makeListCommentsFor,
} from "./application/list-engagement";
import type {
  CommentDTO,
  FeedItemDTO,
  ReactionDTO,
  TargetInput,
  WishDTO,
} from "./application/dtos";

/**
 * Public surface of the Engagement context (AGENT_CONTRACTS "The module
 * factory"). All use cases as async methods. Writes return Result; reads resolve
 * plain values.
 */
export interface EngagementModule {
  reactToMemory(input: ReactToMemoryInput): Promise<Result<ReactionDTO>>;
  commentOnMemory(input: CommentOnMemoryInput): Promise<Result<CommentDTO>>;
  postWish(input: PostWishInput): Promise<Result<WishDTO>>;
  getActivityFeed(input?: GetActivityFeedInput): Promise<FeedItemDTO[]>;
  listReactionsFor(target: TargetInput): Promise<ReactionDTO[]>;
  listCommentsFor(target: TargetInput): Promise<CommentDTO[]>;
}

/**
 * Factory. The SECOND arg (`reads`) is injected by the integrator — it wires the
 * Memories / Genealogy modules' query methods behind these ports so Engagement
 * never imports another context's code.
 */
export function createEngagementModule(
  deps: SharedDeps,
  reads: { memories: MemoriesReadPort; people: PeopleReadPort },
): EngagementModule {
  const reactions = new LocalStorageReactionRepository(deps.store);
  const comments = new LocalStorageCommentRepository(deps.store);
  const wishes = new LocalStorageWishRepository(deps.store);

  const reactToMemory = makeReactToMemory({
    reactions,
    memories: reads.memories,
    clock: deps.clock,
    ids: deps.ids,
  });
  const commentOnMemory = makeCommentOnMemory({
    comments,
    memories: reads.memories,
    clock: deps.clock,
    ids: deps.ids,
  });
  const postWish = makePostWish({
    wishes,
    people: reads.people,
    clock: deps.clock,
    ids: deps.ids,
  });
  const getActivityFeed = makeGetActivityFeed({
    reactions,
    comments,
    wishes,
    memories: reads.memories,
  });
  const listReactionsFor = makeListReactionsFor(reactions);
  const listCommentsFor = makeListCommentsFor(comments);

  return {
    reactToMemory,
    commentOnMemory,
    postWish,
    getActivityFeed,
    listReactionsFor,
    listCommentsFor,
  };
}
