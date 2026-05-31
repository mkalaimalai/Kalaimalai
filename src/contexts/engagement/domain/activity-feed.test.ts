import { describe, it, expect } from "vitest";
import { CommentId, MemberId, PersonId, ReactionId, WishId } from "@/shared/kernel";
import type { MemoryView } from "@/shared/views";
import { unwrap } from "@/shared/kernel";
import { Reaction } from "./reaction";
import { Comment } from "./comment";
import { Wish } from "./wish";
import { ActivityFeed, type MemoryActivity } from "./activity-feed";

const memoryView = (id: string, caption: string): MemoryView => ({
  id,
  caption,
  date: null,
  place: null,
  taggedPersonIds: [],
  albumId: null,
  mediaRef: null,
});

const memory = (id: string, caption: string, createdAtMs: number): MemoryActivity => ({
  view: memoryView(id, caption),
  createdAtMs,
});

const reaction = (id: string, createdAtMs: number) =>
  unwrap(
    Reaction.create({
      id: ReactionId(id),
      targetType: "Memory",
      targetId: "m1",
      memberId: MemberId("mem1"),
      kind: "heart",
      createdAtMs,
    }),
  );

const comment = (id: string, text: string, createdAtMs: number) =>
  unwrap(
    Comment.create({
      id: CommentId(id),
      targetType: "Memory",
      targetId: "m1",
      memberId: MemberId("mem1"),
      text,
      createdAtMs,
    }),
  );

const wish = (id: string, message: string, createdAtMs: number, occasion?: string) =>
  unwrap(
    Wish.create({
      id: WishId(id),
      toPersonId: PersonId("p1"),
      fromMemberId: MemberId("mem1"),
      message,
      occasion,
      createdAtMs,
    }),
  );

describe("ActivityFeed.build", () => {
  it("composes items from all sources, newest first", () => {
    const feed = ActivityFeed.build({
      memories: [memory("m1", "Beach day", 100)],
      reactions: [reaction("r1", 400)],
      comments: [comment("c1", "Nice!", 200)],
      wishes: [wish("w1", "Happy birthday!", 300)],
    });

    expect(feed.map((i) => i.kind)).toEqual([
      "reaction",
      "wish",
      "comment",
      "new-memory",
    ]);
    expect(feed.map((i) => i.createdAtMs)).toEqual([400, 300, 200, 100]);
  });

  it("produces readable summaries and ref ids", () => {
    const feed = ActivityFeed.build({
      memories: [memory("m9", "Diwali 2019", 10)],
      reactions: [],
      comments: [],
      wishes: [],
    });
    expect(feed[0]?.summary).toBe("New photo: Diwali 2019");
    expect(feed[0]?.refId).toBe("m9");
    expect(feed[0]?.kind).toBe("new-memory");
  });

  it("includes the occasion in a wish summary when present", () => {
    const feed = ActivityFeed.build({
      memories: [],
      reactions: [],
      comments: [],
      wishes: [wish("w1", "Many happy returns", 5, "Birthday")],
    });
    expect(feed[0]?.summary).toBe("Sent a wish (Birthday): Many happy returns");
  });

  it("sorts ties deterministically by kind then id", () => {
    const feed = ActivityFeed.build({
      memories: [memory("m1", "A", 100)],
      reactions: [reaction("r1", 100)],
      comments: [comment("c1", "B", 100)],
      wishes: [wish("w1", "C", 100)],
    });
    // same timestamp -> kind ascending: comment, new-memory, reaction, wish
    expect(feed.map((i) => i.kind)).toEqual([
      "comment",
      "new-memory",
      "reaction",
      "wish",
    ]);
  });

  it("respects a limit", () => {
    const feed = ActivityFeed.build(
      {
        memories: [memory("m1", "A", 1), memory("m2", "B", 2)],
        reactions: [reaction("r1", 3)],
        comments: [],
        wishes: [],
      },
      2,
    );
    expect(feed).toHaveLength(2);
    expect(feed.map((i) => i.createdAtMs)).toEqual([3, 2]);
  });

  it("returns an empty feed when there is no activity", () => {
    const feed = ActivityFeed.build({
      memories: [],
      reactions: [],
      comments: [],
      wishes: [],
    });
    expect(feed).toEqual([]);
  });
});
