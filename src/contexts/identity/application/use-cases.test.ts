import { beforeEach, describe, expect, it } from "vitest";
import { FixedClock, SequentialIdGenerator } from "@/shared/ports";
import { MemberId, isErr, isOk, unwrap } from "@/shared/kernel";
import { Member } from "../domain/member";
import {
  InMemoryAuthPort,
  InMemoryInviteRepository,
  InMemoryMemberRepository,
} from "./fakes";
import {
  type IdentityDeps,
  makeApproveMember,
  makeCreateInvite,
  makeEnsureSeedAdmin,
  makeGetCurrentMember,
  makeListMembers,
  makeRedeemInvite,
  makeSignInAs,
} from "./use-cases";

const NOW = 10_000;

function setup(): IdentityDeps {
  return {
    members: new InMemoryMemberRepository(),
    invites: new InMemoryInviteRepository(),
    auth: new InMemoryAuthPort(),
    clock: new FixedClock(NOW),
    ids: new SequentialIdGenerator("id"),
  };
}

async function seedAdmin(deps: IdentityDeps, id = "admin"): Promise<void> {
  const admin = unwrap(
    Member.create({
      id: MemberId(id),
      displayName: "Admin",
      role: "Admin",
      status: "Active",
    }),
  );
  await deps.members.save(admin);
}

describe("CreateInvite", () => {
  let deps: IdentityDeps;
  beforeEach(() => {
    deps = setup();
  });

  it("mints an expiring invite for an existing inviter", async () => {
    await seedAdmin(deps);
    const r = await makeCreateInvite(deps)({
      invitedBy: "admin",
      role: "Member",
      ttlMs: 5_000,
    });
    expect(isOk(r)).toBe(true);
    const inv = unwrap(r);
    expect(inv.role).toBe("Member");
    expect(inv.createdAtMs).toBe(NOW);
    expect(inv.expiresAtMs).toBe(NOW + 5_000);
    expect(inv.redeemed).toBe(false);
    expect(inv.token).not.toBe("");
    // persisted
    expect((await deps.invites.list()).length).toBe(1);
  });

  it("rejects a non-positive ttl", async () => {
    await seedAdmin(deps);
    const r = await makeCreateInvite(deps)({
      invitedBy: "admin",
      role: "Member",
      ttlMs: 0,
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_INVALID_TTL");
  });

  it("rejects an unknown inviter", async () => {
    const r = await makeCreateInvite(deps)({
      invitedBy: "ghost",
      role: "Member",
      ttlMs: 5_000,
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_NOT_FOUND");
  });
});

describe("RedeemInvite", () => {
  let deps: IdentityDeps;
  beforeEach(() => {
    deps = setup();
  });

  it("creates a Pending member and marks the invite redeemed", async () => {
    await seedAdmin(deps);
    const inv = unwrap(
      await makeCreateInvite(deps)({
        invitedBy: "admin",
        role: "Member",
        ttlMs: 5_000,
      }),
    );
    const r = await makeRedeemInvite(deps)({
      token: inv.token,
      displayName: "Meena",
    });
    expect(isOk(r)).toBe(true);
    const member = unwrap(r);
    expect(member.displayName).toBe("Meena");
    expect(member.role).toBe("Member");
    expect(member.status).toBe("Pending");

    const stored = await deps.invites.findByToken(inv.token);
    expect(stored?.redeemed).toBe(true);
  });

  it("rejects an unknown token", async () => {
    const r = await makeRedeemInvite(deps)({
      token: "nope",
      displayName: "X",
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_NOT_FOUND");
  });

  it("rejects an expired invite", async () => {
    await seedAdmin(deps);
    const inv = unwrap(
      await makeCreateInvite(deps)({
        invitedBy: "admin",
        role: "Member",
        ttlMs: 1_000,
      }),
    );
    // advance clock past expiry
    deps.clock = new FixedClock(NOW + 2_000);
    const r = await makeRedeemInvite(deps)({
      token: inv.token,
      displayName: "Late",
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_EXPIRED");
  });

  it("rejects a second redemption of the same token", async () => {
    await seedAdmin(deps);
    const inv = unwrap(
      await makeCreateInvite(deps)({
        invitedBy: "admin",
        role: "Member",
        ttlMs: 5_000,
      }),
    );
    await makeRedeemInvite(deps)({ token: inv.token, displayName: "First" });
    const r = await makeRedeemInvite(deps)({
      token: inv.token,
      displayName: "Second",
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("INVITE_ALREADY_REDEEMED");
  });
});

describe("ApproveMember", () => {
  let deps: IdentityDeps;
  beforeEach(() => {
    deps = setup();
  });

  async function seedPending(): Promise<string> {
    const m = unwrap(
      Member.create({
        id: MemberId("pending-1"),
        displayName: "Ravi",
        role: "Member",
        status: "Pending",
      }),
    );
    await deps.members.save(m);
    return m.id;
  }

  it("lets an Admin approve a Pending member", async () => {
    const id = await seedPending();
    const r = await makeApproveMember(deps)({
      actorRole: "Admin",
      memberId: id,
    });
    expect(isOk(r)).toBe(true);
    expect(unwrap(r).status).toBe("Active");
  });

  it("rejects a non-Admin actor", async () => {
    const id = await seedPending();
    const r = await makeApproveMember(deps)({
      actorRole: "Member",
      memberId: id,
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("NOT_AUTHORIZED");
  });

  it("rejects an ElderViewer actor", async () => {
    const id = await seedPending();
    const r = await makeApproveMember(deps)({
      actorRole: "ElderViewer",
      memberId: id,
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("NOT_AUTHORIZED");
  });

  it("rejects an unknown member", async () => {
    const r = await makeApproveMember(deps)({
      actorRole: "Admin",
      memberId: "ghost",
    });
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_NOT_FOUND");
  });
});

describe("GetCurrentMember / SignInAs / ListMembers", () => {
  let deps: IdentityDeps;
  beforeEach(() => {
    deps = setup();
  });

  it("returns null when no one is signed in", async () => {
    expect(await makeGetCurrentMember(deps)()).toBeNull();
  });

  it("signs in as an existing member and resolves the current member", async () => {
    await seedAdmin(deps);
    const r = await makeSignInAs(deps)("admin");
    expect(isOk(r)).toBe(true);
    const current = await makeGetCurrentMember(deps)();
    expect(current?.id).toBe("admin");
  });

  it("rejects signing in as an unknown member", async () => {
    const r = await makeSignInAs(deps)("ghost");
    expect(isErr(r)).toBe(true);
    if (isErr(r)) expect(r.error.code).toBe("MEMBER_NOT_FOUND");
  });

  it("lists all members", async () => {
    await seedAdmin(deps, "a1");
    await seedAdmin(deps, "a2");
    const list = await makeListMembers(deps)();
    expect(list.map((m) => m.id).sort()).toEqual(["a1", "a2"]);
  });
});

describe("EnsureSeedAdmin", () => {
  let deps: IdentityDeps;
  beforeEach(() => {
    deps = setup();
  });

  it("creates an Active Admin and signs them in on first call", async () => {
    const r = await makeEnsureSeedAdmin(deps)({
      displayName: "Founder",
      linkedPersonId: "p1",
    });
    expect(isOk(r)).toBe(true);
    const admin = unwrap(r);
    expect(admin.displayName).toBe("Founder");
    expect(admin.role).toBe("Admin");
    expect(admin.status).toBe("Active");
    expect(admin.linkedPersonId).toBe("p1");
    // persisted and signed in
    expect((await makeListMembers(deps)()).length).toBe(1);
    expect((await makeGetCurrentMember(deps)())?.id).toBe(admin.id);
  });

  it("is idempotent: a second call no-ops and returns the same admin", async () => {
    const first = unwrap(
      await makeEnsureSeedAdmin(deps)({ displayName: "Founder" }),
    );
    const second = unwrap(
      await makeEnsureSeedAdmin(deps)({ displayName: "Someone Else" }),
    );
    expect(second.id).toBe(first.id);
    expect(second.displayName).toBe("Founder");
    // no duplicate member created
    expect((await makeListMembers(deps)()).length).toBe(1);
  });

  it("no-ops when an Active Admin already exists from another path", async () => {
    await seedAdmin(deps, "existing-admin");
    const r = await makeEnsureSeedAdmin(deps)({ displayName: "Founder" });
    expect(isOk(r)).toBe(true);
    expect(unwrap(r).id).toBe("existing-admin");
    expect((await makeListMembers(deps)()).length).toBe(1);
  });
});
