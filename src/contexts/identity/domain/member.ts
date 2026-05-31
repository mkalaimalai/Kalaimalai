import type { MemberId, PersonId, Result } from "@/shared/kernel";
import { fail, ok } from "@/shared/kernel";
import type { Role } from "./role";

/**
 * MemberStatus — a member redeemed via invite starts `Pending` and becomes
 * `Active` once an Admin approves them (PRD F1.5, TECHNICAL_DESIGN §10.6).
 */
export type MemberStatus = "Active" | "Pending";

export interface MemberProps {
  readonly id: MemberId;
  readonly displayName: string;
  readonly email?: string;
  readonly role: Role;
  readonly linkedPersonId?: PersonId;
  readonly status: MemberStatus;
}

/**
 * Member (aggregate root) — a person with access to the family fabric.
 * Immutable value-style entity: mutations return a new instance via Result so
 * invariants are enforced in the domain, not the UI.
 */
export class Member {
  private constructor(private readonly props: MemberProps) {}

  static create(props: MemberProps): Result<Member> {
    if (props.id.trim() === "") {
      return fail("MEMBER_INVALID_ID", "Member id must not be empty.");
    }
    if (props.displayName.trim() === "") {
      return fail(
        "MEMBER_INVALID_NAME",
        "Member display name must not be empty.",
      );
    }
    return ok(new Member(props));
  }

  get id(): MemberId {
    return this.props.id;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get email(): string | undefined {
    return this.props.email;
  }

  get role(): Role {
    return this.props.role;
  }

  get linkedPersonId(): PersonId | undefined {
    return this.props.linkedPersonId;
  }

  get status(): MemberStatus {
    return this.props.status;
  }

  get isActive(): boolean {
    return this.props.status === "Active";
  }

  /**
   * Approve a Pending member into the family. Fails if already Active so the
   * operation is explicit and idempotency violations surface (PRD F1.5).
   */
  approve(): Result<Member> {
    if (this.props.status === "Active") {
      return fail("MEMBER_ALREADY_ACTIVE", "Member is already active.");
    }
    return ok(new Member({ ...this.props, status: "Active" }));
  }

  /** Link this member to a Genealogy person (cross-context reference by id). */
  linkPerson(personId: PersonId): Member {
    return new Member({ ...this.props, linkedPersonId: personId });
  }

  toProps(): MemberProps {
    return { ...this.props };
  }
}
