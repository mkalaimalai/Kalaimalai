import {
  type MemberId,
  type PersonId,
  type Result,
  type WishId,
  fail,
  ok,
} from "@/shared/kernel";

/**
 * Wish (TECHNICAL_DESIGN §4.3, §10.5). A greeting sent from a member to a person
 * (e.g. "Happy birthday!"), optionally tied to an occasion. Immutable value
 * object. The actual outbound delivery is owned by Notifications/Reminders — a
 * Wish here just records the engagement.
 */

export interface WishProps {
  readonly id: WishId;
  readonly toPersonId: PersonId;
  readonly fromMemberId: MemberId;
  readonly message: string;
  readonly occasion?: string;
  readonly createdAtMs: number;
}

export class Wish {
  private constructor(
    readonly id: WishId,
    readonly toPersonId: PersonId,
    readonly fromMemberId: MemberId,
    readonly message: string,
    readonly occasion: string | null,
    readonly createdAtMs: number,
  ) {}

  static create(props: WishProps): Result<Wish> {
    const message = props.message.trim();
    if (message.length === 0) {
      return fail("WISH_MESSAGE_REQUIRED", "A wish needs a message.");
    }
    if (props.toPersonId.trim().length === 0) {
      return fail("WISH_RECIPIENT_REQUIRED", "A wish needs a recipient.");
    }
    const occasion = props.occasion?.trim();
    return ok(
      new Wish(
        props.id,
        props.toPersonId,
        props.fromMemberId,
        message,
        occasion && occasion.length > 0 ? occasion : null,
        props.createdAtMs,
      ),
    );
  }
}
