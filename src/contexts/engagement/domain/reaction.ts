import {
  type MemberId,
  type ReactionId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import type { Target, TargetType } from "./target";

/**
 * Reaction (TECHNICAL_DESIGN §4.3, §10.5). A member's lightweight reaction
 * (emoji/kind) to a Memory or a Person. Immutable value object.
 */

export interface ReactionProps {
  readonly id: ReactionId;
  readonly targetType: TargetType;
  readonly targetId: string;
  readonly memberId: MemberId;
  readonly kind: string;
  readonly createdAtMs: number;
}

export class Reaction {
  private constructor(
    readonly id: ReactionId,
    readonly targetType: TargetType,
    readonly targetId: string,
    readonly memberId: MemberId,
    readonly kind: string,
    readonly createdAtMs: number,
  ) {}

  static create(props: ReactionProps): Result<Reaction> {
    const kind = props.kind.trim();
    if (kind.length === 0) {
      return fail("REACTION_KIND_REQUIRED", "A reaction needs a kind.");
    }
    if (props.targetId.trim().length === 0) {
      return fail("REACTION_TARGET_REQUIRED", "A reaction needs a target.");
    }
    return ok(
      new Reaction(
        props.id,
        props.targetType,
        props.targetId,
        props.memberId,
        kind,
        props.createdAtMs,
      ),
    );
  }

  get target(): Target {
    return { targetType: this.targetType, targetId: this.targetId };
  }
}
