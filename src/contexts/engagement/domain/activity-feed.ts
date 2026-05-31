import type { MemoryView } from "@/shared/views";
import type { Reaction } from "./reaction";
import type { Comment } from "./comment";
import type { Wish } from "./wish";

/**
 * ActivityFeed projection (TECHNICAL_DESIGN §10.5). A pure domain service that
 * composes a single chronological feed from recent memories plus engagement
 * (reactions, comments, wishes). Birthday/festival items are OUT OF SCOPE here —
 * Reminders owns those. Newest first.
 *
 * MemoryView carries no creation timestamp (it is a cross-context read shape), so
 * memory recency is provided alongside each view by the caller via
 * `MemoryActivity { view, createdAtMs }`. This keeps the projection pure and
 * deterministic without reaching into Memories' internals.
 */

export type FeedItemKind = "new-memory" | "reaction" | "comment" | "wish";

export interface FeedItem {
  readonly id: string;
  readonly kind: FeedItemKind;
  readonly summary: string;
  readonly createdAtMs: number;
  /** Id of the underlying entity (memory/reaction/comment/wish). */
  readonly refId: string;
}

export interface MemoryActivity {
  readonly view: MemoryView;
  readonly createdAtMs: number;
}

export interface ActivityFeedInput {
  readonly memories: readonly MemoryActivity[];
  readonly reactions: readonly Reaction[];
  readonly comments: readonly Comment[];
  readonly wishes: readonly Wish[];
}

function describeTarget(targetType: string): string {
  return targetType === "Person" ? "a profile" : "a memory";
}

function newMemoryItem(activity: MemoryActivity): FeedItem {
  const caption = activity.view.caption.trim();
  const summary = caption.length > 0 ? `New photo: ${caption}` : "New photo added";
  return {
    id: `feed:new-memory:${activity.view.id}`,
    kind: "new-memory",
    summary,
    createdAtMs: activity.createdAtMs,
    refId: activity.view.id,
  };
}

function reactionItem(reaction: Reaction): FeedItem {
  return {
    id: `feed:reaction:${reaction.id}`,
    kind: "reaction",
    summary: `Reacted ${reaction.kind} to ${describeTarget(reaction.targetType)}`,
    createdAtMs: reaction.createdAtMs,
    refId: reaction.id,
  };
}

function commentItem(comment: Comment): FeedItem {
  return {
    id: `feed:comment:${comment.id}`,
    kind: "comment",
    summary: `Commented on ${describeTarget(comment.targetType)}: ${comment.text}`,
    createdAtMs: comment.createdAtMs,
    refId: comment.id,
  };
}

function wishItem(wish: Wish): FeedItem {
  const occasion = wish.occasion ? ` (${wish.occasion})` : "";
  return {
    id: `feed:wish:${wish.id}`,
    kind: "wish",
    summary: `Sent a wish${occasion}: ${wish.message}`,
    createdAtMs: wish.createdAtMs,
    refId: wish.id,
  };
}

export const ActivityFeed = {
  /**
   * Build the feed, newest first. Ties are broken deterministically by kind then
   * id so output is stable across runs.
   */
  build(input: ActivityFeedInput, limit?: number): FeedItem[] {
    const items: FeedItem[] = [
      ...input.memories.map(newMemoryItem),
      ...input.reactions.map(reactionItem),
      ...input.comments.map(commentItem),
      ...input.wishes.map(wishItem),
    ];

    items.sort((a, b) => {
      if (b.createdAtMs !== a.createdAtMs) return b.createdAtMs - a.createdAtMs;
      if (a.kind !== b.kind) return a.kind < b.kind ? -1 : 1;
      return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
    });

    if (limit !== undefined && limit >= 0) {
      return items.slice(0, limit);
    }
    return items;
  },
};
