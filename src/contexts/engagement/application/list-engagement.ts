import type { Target } from "../domain/target";
import type { CommentRepository, ReactionRepository } from "./ports";
import {
  type CommentDTO,
  type ReactionDTO,
  type TargetInput,
  toCommentDTO,
  toReactionDTO,
} from "./dtos";

/**
 * Read use cases for inline reaction/comment widgets (TECHNICAL_DESIGN §10.5).
 * Reusable on both memories and profiles via a {targetType,targetId} arg.
 */

export function makeListReactionsFor(reactions: ReactionRepository) {
  return async function listReactionsFor(
    target: TargetInput,
  ): Promise<ReactionDTO[]> {
    const found = await reactions.listFor(target as Target);
    return found
      .slice()
      .sort((a, b) => a.createdAtMs - b.createdAtMs)
      .map(toReactionDTO);
  };
}

export function makeListCommentsFor(comments: CommentRepository) {
  return async function listCommentsFor(
    target: TargetInput,
  ): Promise<CommentDTO[]> {
    const found = await comments.listFor(target as Target);
    return found
      .slice()
      .sort((a, b) => a.createdAtMs - b.createdAtMs)
      .map(toCommentDTO);
  };
}
