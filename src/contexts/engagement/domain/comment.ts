import {
  type CommentId,
  type MemberId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import type { Target, TargetType } from "./target";

/**
 * Comment (TECHNICAL_DESIGN §4.3, §10.5). A member's free-text note on a Memory
 * or Person. Text is required (non-empty). Immutable value object.
 */

export interface CommentProps {
  readonly id: CommentId;
  readonly targetType: TargetType;
  readonly targetId: string;
  readonly memberId: MemberId;
  readonly text: string;
  readonly createdAtMs: number;
}

export class Comment {
  private constructor(
    readonly id: CommentId,
    readonly targetType: TargetType,
    readonly targetId: string,
    readonly memberId: MemberId,
    readonly text: string,
    readonly createdAtMs: number,
  ) {}

  static create(props: CommentProps): Result<Comment> {
    const text = props.text.trim();
    if (text.length === 0) {
      return fail("COMMENT_TEXT_REQUIRED", "A comment needs text.");
    }
    if (props.targetId.trim().length === 0) {
      return fail("COMMENT_TARGET_REQUIRED", "A comment needs a target.");
    }
    return ok(
      new Comment(
        props.id,
        props.targetType,
        props.targetId,
        props.memberId,
        text,
        props.createdAtMs,
      ),
    );
  }

  get target(): Target {
    return { targetType: this.targetType, targetId: this.targetId };
  }
}
