import { describe, it, expect } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import {
  MemberId,
  MemoryId,
  PersonId,
  ReactionId,
  CommentId,
  WishId,
  unwrap,
} from "@/shared/kernel";
import { Reaction } from "../domain/reaction";
import { Comment } from "../domain/comment";
import { Wish } from "../domain/wish";
import { LocalStorageReactionRepository } from "./local-storage-reaction-repository";
import { LocalStorageCommentRepository } from "./local-storage-comment-repository";
import { LocalStorageWishRepository } from "./local-storage-wish-repository";

describe("LocalStorageReactionRepository", () => {
  it("persists and reloads reactions, filtering by target", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageReactionRepository(store);
    await repo.save(
      unwrap(
        Reaction.create({
          id: ReactionId("r1"),
          targetType: "Memory",
          targetId: MemoryId("m1"),
          memberId: MemberId("mem1"),
          kind: "heart",
          createdAtMs: 1,
        }),
      ),
    );
    await repo.save(
      unwrap(
        Reaction.create({
          id: ReactionId("r2"),
          targetType: "Person",
          targetId: PersonId("p1"),
          memberId: MemberId("mem1"),
          kind: "clap",
          createdAtMs: 2,
        }),
      ),
    );

    // New repo over the same store → survives reload.
    const reloaded = new LocalStorageReactionRepository(store);
    expect(await reloaded.listAll()).toHaveLength(2);
    const forMemory = await reloaded.listFor({ targetType: "Memory", targetId: "m1" });
    expect(forMemory.map((r) => r.id)).toEqual(["r1"]);
  });
});

describe("LocalStorageCommentRepository", () => {
  it("persists and reloads comments", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageCommentRepository(store);
    await repo.save(
      unwrap(
        Comment.create({
          id: CommentId("c1"),
          targetType: "Memory",
          targetId: MemoryId("m1"),
          memberId: MemberId("mem1"),
          text: "Nice",
          createdAtMs: 1,
        }),
      ),
    );
    const reloaded = new LocalStorageCommentRepository(store);
    const forMemory = await reloaded.listFor({ targetType: "Memory", targetId: "m1" });
    expect(forMemory[0]?.text).toBe("Nice");
  });
});

describe("LocalStorageWishRepository", () => {
  it("persists and reloads wishes including occasion", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageWishRepository(store);
    await repo.save(
      unwrap(
        Wish.create({
          id: WishId("w1"),
          toPersonId: PersonId("p1"),
          fromMemberId: MemberId("mem1"),
          message: "Happy birthday!",
          occasion: "Birthday",
          createdAtMs: 1,
        }),
      ),
    );
    const reloaded = new LocalStorageWishRepository(store);
    const all = await reloaded.listAll();
    expect(all).toHaveLength(1);
    expect(all[0]?.occasion).toBe("Birthday");
  });
});
