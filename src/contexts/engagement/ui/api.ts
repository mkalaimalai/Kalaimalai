import { api } from "@/store/api";
import { getContainer } from "@/bootstrap/container";
import { runResult, runValue } from "@/store/query-fn";
import type {
  CommentDTO,
  FeedItemDTO,
  ReactionDTO,
  TargetInput,
  WishDTO,
} from "../application/dtos";
import type { ReactToMemoryInput } from "../application/react-to-memory";
import type { CommentOnMemoryInput } from "../application/comment-on-memory";
import type { PostWishInput } from "../application/post-wish";
import type { GetActivityFeedInput } from "../application/get-activity-feed";

/**
 * RTK Query endpoints for Engagement (AGENT_CONTRACTS "RTK Query endpoints").
 * Treated as a DRIVING adapter: each `queryFn` resolves the bound use case from
 * the composition root. Tags: Reaction / Comment / Wish / Feed.
 */
export const engagementApi = api.injectEndpoints({
  endpoints: (build) => ({
    getActivityFeed: build.query<FeedItemDTO[], GetActivityFeedInput | void>({
      queryFn: (arg) =>
        runValue(getContainer().engagement.getActivityFeed(arg ?? undefined)),
      providesTags: ["Feed"],
    }),
    listReactions: build.query<ReactionDTO[], TargetInput>({
      queryFn: (target) =>
        runValue(getContainer().engagement.listReactionsFor(target)),
      providesTags: ["Reaction"],
    }),
    listComments: build.query<CommentDTO[], TargetInput>({
      queryFn: (target) =>
        runValue(getContainer().engagement.listCommentsFor(target)),
      providesTags: ["Comment"],
    }),
    reactToMemory: build.mutation<ReactionDTO, ReactToMemoryInput>({
      queryFn: (input) =>
        runResult(getContainer().engagement.reactToMemory(input)),
      invalidatesTags: ["Reaction", "Feed"],
    }),
    commentOnMemory: build.mutation<CommentDTO, CommentOnMemoryInput>({
      queryFn: (input) =>
        runResult(getContainer().engagement.commentOnMemory(input)),
      invalidatesTags: ["Comment", "Feed"],
    }),
    postWish: build.mutation<WishDTO, PostWishInput>({
      queryFn: (input) => runResult(getContainer().engagement.postWish(input)),
      invalidatesTags: ["Wish", "Feed"],
    }),
  }),
});

export const {
  useGetActivityFeedQuery,
  useListReactionsQuery,
  useListCommentsQuery,
  useReactToMemoryMutation,
  useCommentOnMemoryMutation,
  usePostWishMutation,
} = engagementApi;
