import { describe, it, expect } from "vitest";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import {
  FakeCommentRepository,
  FakeMemoriesReadPort,
  FakePeopleReadPort,
  FakeReactionRepository,
  FakeWishRepository,
  memoryView,
  personView,
} from "./test-fakes";
import { makeReactToMemory } from "./react-to-memory";
import { makeCommentOnMemory } from "./comment-on-memory";
import { makePostWish } from "./post-wish";
import { makeGetActivityFeed } from "./get-activity-feed";
import { makeListCommentsFor, makeListReactionsFor } from "./list-engagement";

const clock = () => new FixedClock(1_700_000_000_000);

describe("ReactToMemory", () => {
  it("saves a reaction to an existing memory", async () => {
    const reactions = new FakeReactionRepository();
    const reactToMemory = makeReactToMemory({
      reactions,
      memories: new FakeMemoriesReadPort([memoryView("m1")]),
      clock: clock(),
      ids: new SequentialIdGenerator("r"),
    });
    const r = await reactToMemory({ memberId: "mem1", memoryId: "m1", kind: "heart" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({
      id: "r-1",
      targetType: "Memory",
      targetId: "m1",
      memberId: "mem1",
      kind: "heart",
      createdAtMs: 1_700_000_000_000,
    });
    expect(reactions.items).toHaveLength(1);
  });

  it("fails for an unknown memory", async () => {
    const reactions = new FakeReactionRepository();
    const reactToMemory = makeReactToMemory({
      reactions,
      memories: new FakeMemoriesReadPort([]),
      clock: clock(),
      ids: new SequentialIdGenerator("r"),
    });
    const r = await reactToMemory({ memberId: "mem1", memoryId: "ghost", kind: "heart" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("MEMORY_NOT_FOUND");
    expect(reactions.items).toHaveLength(0);
  });

  it("fails for a blank kind", async () => {
    const reactToMemory = makeReactToMemory({
      reactions: new FakeReactionRepository(),
      memories: new FakeMemoriesReadPort([memoryView("m1")]),
      clock: clock(),
      ids: new SequentialIdGenerator("r"),
    });
    const r = await reactToMemory({ memberId: "mem1", memoryId: "m1", kind: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("REACTION_KIND_REQUIRED");
  });
});

describe("CommentOnMemory", () => {
  it("saves a comment to an existing memory", async () => {
    const comments = new FakeCommentRepository();
    const commentOnMemory = makeCommentOnMemory({
      comments,
      memories: new FakeMemoriesReadPort([memoryView("m1")]),
      clock: clock(),
      ids: new SequentialIdGenerator("c"),
    });
    const r = await commentOnMemory({ memberId: "mem1", memoryId: "m1", text: "Nice!" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({ id: "c-1", text: "Nice!", targetId: "m1" });
    expect(comments.items).toHaveLength(1);
  });

  it("fails for an unknown memory", async () => {
    const commentOnMemory = makeCommentOnMemory({
      comments: new FakeCommentRepository(),
      memories: new FakeMemoriesReadPort([]),
      clock: clock(),
      ids: new SequentialIdGenerator("c"),
    });
    const r = await commentOnMemory({ memberId: "mem1", memoryId: "ghost", text: "Hi" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("MEMORY_NOT_FOUND");
  });

  it("fails for blank text", async () => {
    const commentOnMemory = makeCommentOnMemory({
      comments: new FakeCommentRepository(),
      memories: new FakeMemoriesReadPort([memoryView("m1")]),
      clock: clock(),
      ids: new SequentialIdGenerator("c"),
    });
    const r = await commentOnMemory({ memberId: "mem1", memoryId: "m1", text: "  " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("COMMENT_TEXT_REQUIRED");
  });
});

describe("PostWish", () => {
  it("saves a wish to an existing person", async () => {
    const wishes = new FakeWishRepository();
    const postWish = makePostWish({
      wishes,
      people: new FakePeopleReadPort([personView("p1", "Meena")]),
      clock: clock(),
      ids: new SequentialIdGenerator("w"),
    });
    const r = await postWish({
      fromMemberId: "mem1",
      toPersonId: "p1",
      message: "Happy birthday!",
      occasion: "Birthday",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toMatchObject({
      id: "w-1",
      toPersonId: "p1",
      message: "Happy birthday!",
      occasion: "Birthday",
    });
    expect(wishes.items).toHaveLength(1);
  });

  it("fails for an unknown person", async () => {
    const postWish = makePostWish({
      wishes: new FakeWishRepository(),
      people: new FakePeopleReadPort([]),
      clock: clock(),
      ids: new SequentialIdGenerator("w"),
    });
    const r = await postWish({ fromMemberId: "mem1", toPersonId: "ghost", message: "Hi" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PERSON_NOT_FOUND");
  });

  it("fails for a blank message", async () => {
    const postWish = makePostWish({
      wishes: new FakeWishRepository(),
      people: new FakePeopleReadPort([personView("p1")]),
      clock: clock(),
      ids: new SequentialIdGenerator("w"),
    });
    const r = await postWish({ fromMemberId: "mem1", toPersonId: "p1", message: " " });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("WISH_MESSAGE_REQUIRED");
  });
});

describe("GetActivityFeed", () => {
  it("composes a feed across engagement + new memories, newest first", async () => {
    const reactions = new FakeReactionRepository();
    const comments = new FakeCommentRepository();
    const wishes = new FakeWishRepository();
    const memories = new FakeMemoriesReadPort([
      memoryView("m1", "Beach day", { year: 2020, month: 6, day: 1 }),
    ]);

    const ids = new SequentialIdGenerator("c");
    // Comment stamped well after the 2020-dated memory's sortKey.
    const commentOnMemory = makeCommentOnMemory({
      comments,
      memories,
      clock: new FixedClock(Date.UTC(2023, 0, 1)),
      ids,
    });
    await commentOnMemory({ memberId: "mem1", memoryId: "m1", text: "Lovely" });

    const getFeed = makeGetActivityFeed({ reactions, comments, wishes, memories });
    const feed = await getFeed();
    expect(feed.length).toBe(2);
    // comment (2023) is newer than the 2020-dated memory
    expect(feed[0]?.kind).toBe("comment");
    expect(feed[1]?.kind).toBe("new-memory");
  });

  it("respects a limit", async () => {
    const memories = new FakeMemoriesReadPort([
      memoryView("m1", "A", { year: 2019, month: 1, day: 1 }),
      memoryView("m2", "B", { year: 2021, month: 1, day: 1 }),
    ]);
    const getFeed = makeGetActivityFeed({
      reactions: new FakeReactionRepository(),
      comments: new FakeCommentRepository(),
      wishes: new FakeWishRepository(),
      memories,
    });
    const feed = await getFeed({ limit: 1 });
    expect(feed).toHaveLength(1);
    expect(feed[0]?.refId).toBe("m2");
  });
});

describe("ListReactionsFor / ListCommentsFor", () => {
  it("lists reactions for a target chronologically", async () => {
    const reactions = new FakeReactionRepository();
    const react = (kind: string, at: number) =>
      makeReactToMemory({
        reactions,
        memories: new FakeMemoriesReadPort([memoryView("m1")]),
        clock: new FixedClock(at),
        ids: new SequentialIdGenerator(`r${at}`),
      })({ memberId: "mem1", memoryId: "m1", kind });
    await react("heart", 200);
    await react("laugh", 100);

    const list = makeListReactionsFor(reactions);
    const out = await list({ targetType: "Memory", targetId: "m1" });
    expect(out.map((r) => r.kind)).toEqual(["laugh", "heart"]);
  });

  it("lists comments only for the requested target", async () => {
    const comments = new FakeCommentRepository();
    const memories = new FakeMemoriesReadPort([memoryView("m1"), memoryView("m2")]);
    const comment = (memoryId: string) =>
      makeCommentOnMemory({
        comments,
        memories,
        clock: clock(),
        ids: new SequentialIdGenerator(`c-${memoryId}`),
      })({ memberId: "mem1", memoryId, text: `on ${memoryId}` });
    await comment("m1");
    await comment("m2");

    const list = makeListCommentsFor(comments);
    const out = await list({ targetType: "Memory", targetId: "m1" });
    expect(out).toHaveLength(1);
    expect(out[0]?.text).toBe("on m1");
  });
});
