import { describe, expect, it } from "vitest";
import { MemberId, PersonId, isErr, isOk, unwrap } from "@/shared/kernel";
import { Member } from "./member";

const base = {
  id: MemberId("m1"),
  displayName: "Meena",
  role: "Member" as const,
  status: "Pending" as const,
};

describe("Member", () => {
  it("creates a valid member", () => {
    const r = Member.create(base);
    expect(isOk(r)).toBe(true);
    const m = unwrap(r);
    expect(m.id).toBe("m1");
    expect(m.displayName).toBe("Meena");
    expect(m.role).toBe("Member");
    expect(m.status).toBe("Pending");
    expect(m.isActive).toBe(false);
  });

  it("rejects an empty id", () => {
    const r = Member.create({ ...base, id: MemberId("  ") });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_INVALID_ID");
  });

  it("rejects an empty display name", () => {
    const r = Member.create({ ...base, displayName: "   " });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_INVALID_NAME");
  });

  it("approves a pending member to active", () => {
    const m = unwrap(Member.create(base));
    const approved = unwrap(m.approve());
    expect(approved.status).toBe("Active");
    expect(approved.isActive).toBe(true);
    // original is untouched (immutability)
    expect(m.status).toBe("Pending");
  });

  it("fails to approve an already-active member", () => {
    const m = unwrap(Member.create({ ...base, status: "Active" }));
    const r = m.approve();
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_ALREADY_ACTIVE");
  });

  it("links a person without mutating the original", () => {
    const m = unwrap(Member.create(base));
    const linked = m.linkPerson(PersonId("p9"));
    expect(linked.linkedPersonId).toBe("p9");
    expect(m.linkedPersonId).toBeUndefined();
  });
});
