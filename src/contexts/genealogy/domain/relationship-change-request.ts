import {
  type ChangeRequestId,
  type PersonId,
  type RelationshipId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import {
  type RelationshipQualifier,
  type RelationshipType,
} from "./relationship";

export type ChangeRequestState = "Pending" | "Approved" | "Rejected";
export type StructuralEditAction = "add" | "remove";

/** The proposed structural edit carried by a change request. */
export interface ProposedEdit {
  readonly action: StructuralEditAction;
  readonly type: RelationshipType;
  readonly from: PersonId;
  readonly to: PersonId;
  readonly qualifier?: RelationshipQualifier;
  /** For a remove action, the id of the relationship to remove. */
  readonly relationshipId?: RelationshipId;
}

export interface ChangeRequestProps {
  readonly id: ChangeRequestId;
  readonly edit: ProposedEdit;
  readonly proposedBy: PersonId;
  readonly state: ChangeRequestState;
}

/**
 * RelationshipChangeRequest — a proposed structural tree edit. Structural edits
 * are PROPOSALS until an Admin approves them (PRD F1.5; TECHNICAL_DESIGN §4.3).
 * Immutable: approve/reject return a new instance.
 */
export class RelationshipChangeRequest {
  private constructor(private readonly props: ChangeRequestProps) {}

  static propose(input: {
    id: ChangeRequestId;
    edit: ProposedEdit;
    proposedBy: PersonId;
  }): Result<RelationshipChangeRequest> {
    if (input.edit.action === "add" && input.edit.from === input.edit.to) {
      return fail(
        "CHANGE_REQUEST_SELF_EDGE",
        "Cannot propose a relationship of a person to themselves.",
      );
    }
    if (input.edit.action === "remove" && !input.edit.relationshipId) {
      return fail(
        "CHANGE_REQUEST_MISSING_TARGET",
        "A removal proposal must reference a relationship id.",
      );
    }
    return ok(
      new RelationshipChangeRequest({
        id: input.id,
        edit: input.edit,
        proposedBy: input.proposedBy,
        state: "Pending",
      }),
    );
  }

  static rehydrate(props: ChangeRequestProps): RelationshipChangeRequest {
    return new RelationshipChangeRequest(props);
  }

  get id(): ChangeRequestId {
    return this.props.id;
  }
  get edit(): ProposedEdit {
    return this.props.edit;
  }
  get proposedBy(): PersonId {
    return this.props.proposedBy;
  }
  get state(): ChangeRequestState {
    return this.props.state;
  }
  get isPending(): boolean {
    return this.props.state === "Pending";
  }

  approve(): Result<RelationshipChangeRequest> {
    if (this.props.state !== "Pending") {
      return fail(
        "CHANGE_REQUEST_NOT_PENDING",
        `Cannot approve a ${this.props.state} change request.`,
      );
    }
    return ok(
      new RelationshipChangeRequest({ ...this.props, state: "Approved" }),
    );
  }

  reject(): Result<RelationshipChangeRequest> {
    if (this.props.state !== "Pending") {
      return fail(
        "CHANGE_REQUEST_NOT_PENDING",
        `Cannot reject a ${this.props.state} change request.`,
      );
    }
    return ok(
      new RelationshipChangeRequest({ ...this.props, state: "Rejected" }),
    );
  }
}
