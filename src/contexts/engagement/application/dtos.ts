import type { FeedItem, FeedItemKind } from "../domain/activity-feed";
import type { TargetType } from "../domain/target";
import type { Reaction } from "../domain/reaction";
import type { Comment } from "../domain/comment";
import type { Wish } from "../domain/wish";

/**
 * Plain, serializable DTOs (AGENT_CONTRACTS rule 6). The UI and store never see
 * live domain entities — use cases map to these.
 */

export interface ReactionDTO {
  id: string;
  targetType: TargetType;
  targetId: string;
  memberId: string;
  kind: string;
  createdAtMs: number;
}

export interface CommentDTO {
  id: string;
  targetType: TargetType;
  targetId: string;
  memberId: string;
  text: string;
  createdAtMs: number;
}

export interface WishDTO {
  id: string;
  toPersonId: string;
  fromMemberId: string;
  message: string;
  occasion: string | null;
  createdAtMs: number;
}

export interface FeedItemDTO {
  id: string;
  kind: FeedItemKind;
  summary: string;
  createdAtMs: number;
  refId: string;
}

export interface TargetInput {
  targetType: TargetType;
  targetId: string;
}

export function toReactionDTO(reaction: Reaction): ReactionDTO {
  return {
    id: reaction.id,
    targetType: reaction.targetType,
    targetId: reaction.targetId,
    memberId: reaction.memberId,
    kind: reaction.kind,
    createdAtMs: reaction.createdAtMs,
  };
}

export function toCommentDTO(comment: Comment): CommentDTO {
  return {
    id: comment.id,
    targetType: comment.targetType,
    targetId: comment.targetId,
    memberId: comment.memberId,
    text: comment.text,
    createdAtMs: comment.createdAtMs,
  };
}

export function toWishDTO(wish: Wish): WishDTO {
  return {
    id: wish.id,
    toPersonId: wish.toPersonId,
    fromMemberId: wish.fromMemberId,
    message: wish.message,
    occasion: wish.occasion,
    createdAtMs: wish.createdAtMs,
  };
}

export function toFeedItemDTO(item: FeedItem): FeedItemDTO {
  return {
    id: item.id,
    kind: item.kind,
    summary: item.summary,
    createdAtMs: item.createdAtMs,
    refId: item.refId,
  };
}
