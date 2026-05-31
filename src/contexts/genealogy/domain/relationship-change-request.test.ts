import { describe, expect, it } from "vitest";
import { ChangeRequestId, PersonId, RelationshipId } from "@/shared/kernel";
import { RelationshipChangeRequest } from "./relationship-change-request";

const addEdit = {
  action: "add" as const,
  type: "ParentOf" as const,
  from: PersonId("a"),
  to: PersonId("b"),
};

function propose() {
  const r = RelationshipChangeRequest.propose({
    id: ChangeRequestId("cr1"),
    edit: addEdit,
    proposedBy: PersonId("u1"),
  });
  if (!r.ok) throw new Error("setup");
  return r.value;
}

describe("RelationshipChangeRequest", () => {
  it("starts Pending", () => {
    expect(propose().state).toBe("Pending");
    expect(propose().isPending).toBe(true);
  });

  it("rejects a self-edge add proposal", () => {
    const r = RelationshipChangeRequest.propose({
      id: ChangeRequestId("cr1"),
      edit: { ...addEdit, to: PersonId("a") },
      proposedBy: PersonId("u1"),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("CHANGE_REQUEST_SELF_EDGE");
  });

  it("requires a relationship id for removal", () => {
    const r = RelationshipChangeRequest.propose({
      id: ChangeRequestId("cr2"),
      edit: { action: "remove", type: "ParentOf", from: PersonId("a"), to: PersonId("b") },
      proposedBy: PersonId("u1"),
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("CHANGE_REQUEST_MISSING_TARGET");
  });

  it("allows removal with a relationship id", () => {
    const r = RelationshipChangeRequest.propose({
      id: ChangeRequestId("cr2"),
      edit: {
        action: "remove",
        type: "ParentOf",
        from: PersonId("a"),
        to: PersonId("b"),
        relationshipId: RelationshipId("r1"),
      },
      proposedBy: PersonId("u1"),
    });
    expect(r.ok).toBe(true);
  });

  it("transitions to Approved", () => {
    const r = propose().approve();
    expect(r.ok && r.value.state).toBe("Approved");
  });

  it("transitions to Rejected", () => {
    const r = propose().reject();
    expect(r.ok && r.value.state).toBe("Rejected");
  });

  it("cannot approve a non-pending request", () => {
    const approved = propose().approve();
    if (!approved.ok) throw new Error("setup");
    const r = approved.value.approve();
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("CHANGE_REQUEST_NOT_PENDING");
  });
});
