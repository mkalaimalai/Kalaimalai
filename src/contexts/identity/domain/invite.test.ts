import { describe, expect, it } from "vitest";
import { InviteId, MemberId, isErr, isOk, unwrap } from "@/shared/kernel";
import { Invite } from "./invite";

const base = {
  id: InviteId("i1"),
  token: "tok-abc",
  invitedByMemberId: MemberId("admin"),
  role: "Member" as const,
  createdAtMs: 1_000,
  expiresAtMs: 2_000,
  redeemed: false,
};

describe("Invite", () => {
  it("creates a valid invite", () => {
    const r = Invite.create(base);
    expect(isOk(r)).toBe(true);
    const inv = unwrap(r);
    expect(inv.token).toBe("tok-abc");
    expect(inv.role).toBe("Member");
    expect(inv.redeemed).toBe(false);
  });

  it("rejects an empty token", () => {
    const r = Invite.create({ ...base, token: "" });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_INVALID_TOKEN");
  });

  it("rejects expiry not after creation", () => {
    const r = Invite.create({ ...base, expiresAtMs: 1_000 });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_INVALID_EXPIRY");
  });

  it("reports expiry relative to now (boundary is expired)", () => {
    const inv = unwrap(Invite.create(base));
    expect(inv.isExpired(1_999)).toBe(false);
    expect(inv.isExpired(2_000)).toBe(true);
    expect(inv.isExpired(2_500)).toBe(true);
  });

  it("redeems a valid, unexpired invite", () => {
    const inv = unwrap(Invite.create(base));
    const redeemed = unwrap(inv.redeem(1_500));
    expect(redeemed.redeemed).toBe(true);
    // original untouched
    expect(inv.redeemed).toBe(false);
  });

  it("fails to redeem an expired invite", () => {
    const inv = unwrap(Invite.create(base));
    const r = inv.redeem(2_000);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_EXPIRED");
  });

  it("fails to redeem an already-redeemed invite", () => {
    const inv = unwrap(Invite.create({ ...base, redeemed: true }));
    const r = inv.redeem(1_500);
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_ALREADY_REDEEMED");
  });
});
