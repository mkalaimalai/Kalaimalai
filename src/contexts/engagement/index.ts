/**
 * Public barrel for the Engagement context (AGENT_CONTRACTS "Module + barrel").
 * Exports the module factory, the read-port interfaces the integrator must
 * supply, the DTOs the UI/integrator consume, and the inline UI widgets.
 */
export {
  createEngagementModule,
  type EngagementModule,
} from "./engagement.module";

export type {
  MemoriesReadPort,
  PeopleReadPort,
  ReactionRepository,
  CommentRepository,
  WishRepository,
} from "./application/ports";

export type {
  ReactionDTO,
  CommentDTO,
  WishDTO,
  FeedItemDTO,
  TargetInput,
} from "./application/dtos";

export type { ReactToMemoryInput } from "./application/react-to-memory";
export type { CommentOnMemoryInput } from "./application/comment-on-memory";
export type { PostWishInput } from "./application/post-wish";
export type { GetActivityFeedInput } from "./application/get-activity-feed";

export type { TargetType } from "./domain/target";
export type { FeedItemKind } from "./domain/activity-feed";

// UI: the /feed route component + reusable inline widgets.
export { ActivityFeed } from "./ui/ActivityFeed";
export { ReactionsBar, type EngagementTarget } from "./ui/ReactionsBar";
export { CommentList } from "./ui/CommentList";
export {
  useGetActivityFeedQuery,
  useListReactionsQuery,
  useListCommentsQuery,
  useReactToMemoryMutation,
  useCommentOnMemoryMutation,
  usePostWishMutation,
} from "./ui/api";

import type { EngagementModule } from "./engagement.module";

declare module "@/bootstrap/container" {
  interface AppContainer {
    engagement: EngagementModule;
  }
}
