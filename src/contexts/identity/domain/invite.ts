import type { InviteId, MemberId, Result } from "@/shared/kernel";
import { fail, ok } from "@/shared/kernel";
import type { Role } from "./role";

export interface InviteProps {
  readonly id: InviteId;
  readonly token: string;
  readonly invitedByMemberId: MemberId;
  /** The role this invite grants once redeemed. */
  readonly role: Role;
  readonly createdAtMs: number;
  readonly expiresAtMs: number;
  readonly redeemed: boolean;
}

/**
 * Invite (aggregate root) — an expiring, single-use invitation to join the
 * family (PRD F1 invite-only; TECHNICAL_DESIGN §10.6). Immutable; `redeem`
 * returns a new redeemed instance via Result so expiry/reuse are enforced here.
 */
export class Invite {
  private constructor(private readonly props: InviteProps) {}

  static create(props: InviteProps): Result<Invite> {
    if (props.token.trim() === "") {
      return fail("INVITE_INVALID_TOKEN", "Invite token must not be empty.");
    }
    if (props.expiresAtMs <= props.createdAtMs) {
      return fail(
        "INVITE_INVALID_EXPIRY",
        "Invite expiry must be after creation.",
      );
    }
    return ok(new Invite(props));
  }

  get id(): InviteId {
    return this.props.id;
  }

  get token(): string {
    return this.props.token;
  }

  get invitedByMemberId(): MemberId {
    return this.props.invitedByMemberId;
  }

  get role(): Role {
    return this.props.role;
  }

  get createdAtMs(): number {
    return this.props.createdAtMs;
  }

  get expiresAtMs(): number {
    return this.props.expiresAtMs;
  }

  get redeemed(): boolean {
    return this.props.redeemed;
  }

  isExpired(nowMs: number): boolean {
    return nowMs >= this.props.expiresAtMs;
  }

  /**
   * Redeem this invite. Fails if already redeemed or expired — a single-use,
   * time-boxed grant.
   */
  redeem(nowMs: number): Result<Invite> {
    if (this.props.redeemed) {
      return fail("INVITE_ALREADY_REDEEMED", "Invite has already been redeemed.");
    }
    if (this.isExpired(nowMs)) {
      return fail("INVITE_EXPIRED", "Invite has expired.");
    }
    return ok(new Invite({ ...this.props, redeemed: true }));
  }

  toProps(): InviteProps {
    return { ...this.props };
  }
}
