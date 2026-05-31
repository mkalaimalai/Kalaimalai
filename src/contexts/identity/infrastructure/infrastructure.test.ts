import { beforeEach, describe, expect, it } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { InviteId, MemberId, PersonId, unwrap } from "@/shared/kernel";
import { Invite } from "../domain/invite";
import { Member } from "../domain/member";
import { LocalAuthAdapter } from "./local-auth-adapter";
import { LocalStorageInviteRepository } from "./invite-repository";
import { LocalStorageMemberRepository } from "./member-repository";

describe("LocalStorageMemberRepository", () => {
  let store: InMemoryKeyValueStore;
  let repo: LocalStorageMemberRepository;
  beforeEach(() => {
    store = new InMemoryKeyValueStore();
    repo = new LocalStorageMemberRepository(store);
  });

  it("round-trips a member including optional fields", async () => {
    const m = unwrap(
      Member.create({
        id: MemberId("m1"),
        displayName: "Meena",
        email: "meena@example.com",
        role: "Admin",
        linkedPersonId: PersonId("p1"),
        status: "Active",
      }),
    );
    await repo.save(m);

    // a fresh repo over the same store re-reads from persistence
    const fresh = new LocalStorageMemberRepository(store);
    const got = await fresh.get("m1");
    expect(got).not.toBeNull();
    expect(got?.displayName).toBe("Meena");
    expect(got?.email).toBe("meena@example.com");
    expect(got?.role).toBe("Admin");
    expect(got?.linkedPersonId).toBe("p1");
    expect(got?.status).toBe("Active");
  });

  it("omits optional fields when absent", async () => {
    const m = unwrap(
      Member.create({
        id: MemberId("m2"),
        displayName: "Ravi",
        role: "Member",
        status: "Pending",
      }),
    );
    await repo.save(m);
    const got = await repo.get("m2");
    expect(got?.email).toBeUndefined();
    expect(got?.linkedPersonId).toBeUndefined();
  });

  it("lists saved members and returns null for unknown ids", async () => {
    await repo.save(
      unwrap(
        Member.create({
          id: MemberId("a"),
          displayName: "A",
          role: "Member",
          status: "Active",
        }),
      ),
    );
    expect((await repo.list()).length).toBe(1);
    expect(await repo.get("missing")).toBeNull();
  });
});

describe("LocalStorageInviteRepository", () => {
  let store: InMemoryKeyValueStore;
  let repo: LocalStorageInviteRepository;
  beforeEach(() => {
    store = new InMemoryKeyValueStore();
    repo = new LocalStorageInviteRepository(store);
  });

  const make = () =>
    unwrap(
      Invite.create({
        id: InviteId("i1"),
        token: "tok-1",
        invitedByMemberId: MemberId("admin"),
        role: "Member",
        createdAtMs: 1_000,
        expiresAtMs: 2_000,
        redeemed: false,
      }),
    );

  it("round-trips and finds by token", async () => {
    await repo.save(make());
    const fresh = new LocalStorageInviteRepository(store);
    const byToken = await fresh.findByToken("tok-1");
    expect(byToken?.id).toBe("i1");
    expect(byToken?.role).toBe("Member");
    expect(await fresh.findByToken("nope")).toBeNull();
  });

  it("persists the redeemed flag", async () => {
    await repo.save(make());
    const inv = unwrap((await repo.findByToken("tok-1"))!.redeem(1_500));
    await repo.save(inv);
    const fresh = new LocalStorageInviteRepository(store);
    expect((await fresh.findByToken("tok-1"))?.redeemed).toBe(true);
  });
});

describe("LocalAuthAdapter", () => {
  it("persists the current member id in the session namespace", () => {
    const store = new InMemoryKeyValueStore();
    const auth = new LocalAuthAdapter(store);
    expect(auth.getCurrentMemberId()).toBeNull();
    auth.setCurrentMember("m1");
    expect(auth.getCurrentMemberId()).toBe("m1");
    // a fresh adapter over the same store sees it
    expect(new LocalAuthAdapter(store).getCurrentMemberId()).toBe("m1");
  });
});
