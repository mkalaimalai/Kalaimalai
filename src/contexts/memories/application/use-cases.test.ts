import { beforeEach, describe, expect, it } from "vitest";
import { SequentialIdGenerator, FixedClock } from "@/shared/ports";
import {
  createMemoriesUseCases,
  type MemoriesUseCases,
} from "./use-cases";
import {
  FakeAlbumRepository,
  FakeEventRepository,
  FakeMediaStore,
  FakeMemoryRepository,
} from "./test-fakes";

function setup(): {
  uc: MemoriesUseCases;
  media: FakeMediaStore;
} {
  const media = new FakeMediaStore();
  const uc = createMemoriesUseCases({
    memories: new FakeMemoryRepository(),
    albums: new FakeAlbumRepository(),
    events: new FakeEventRepository(),
    media,
    ids: new SequentialIdGenerator("m"),
    clock: new FixedClock(0),
  });
  return { uc, media };
}

describe("AddMemory", () => {
  let uc: MemoriesUseCases;
  beforeEach(() => ({ uc } = setup()));

  it("adds a memory with a media key", async () => {
    const r = await uc.addMemory({ caption: "Hi", media: "key-1" });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.caption).toBe("Hi");
    expect(r.value.mediaRef).toBe("key-1");
    expect(r.value.id).toBe("m-1");
  });

  it("stores a data URL via the MediaStore when storeMedia is set", async () => {
    const { uc: uc2, media } = setup();
    const r = await uc2.addMemory({
      caption: "Photo",
      media: "data:image/png;base64,AAA",
      storeMedia: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    const stored = await media.get(r.value.mediaRef);
    expect(stored).toBe("data:image/png;base64,AAA");
  });

  it("rejects an empty caption", async () => {
    const r = await uc.addMemory({ caption: " ", media: "key" });
    expect(r.ok).toBe(false);
  });

  it("carries tagged people, album, event, date, place", async () => {
    const r = await uc.addMemory({
      caption: "Diwali",
      media: "k",
      date: { year: 2019, month: null, day: null },
      place: "Chennai",
      taggedPeople: ["p1", "p2"],
      albumId: "a1",
      eventId: "e1",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.taggedPeople).toEqual(["p1", "p2"]);
    expect(r.value.date).toEqual({ year: 2019, month: null, day: null });
    expect(r.value.place).toBe("Chennai");
    expect(r.value.albumId).toBe("a1");
    expect(r.value.eventId).toBe("e1");
  });
});

describe("AddMemories (bulk)", () => {
  it("adds many at once", async () => {
    const { uc } = setup();
    const r = await uc.addMemories([
      { caption: "A", media: "k1" },
      { caption: "B", media: "k2" },
    ]);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value).toHaveLength(2);
    expect((await uc.listMemoriesFor())).toHaveLength(2);
  });

  it("fails the batch if any item is invalid", async () => {
    const { uc } = setup();
    const r = await uc.addMemories([
      { caption: "A", media: "k1" },
      { caption: "", media: "k2" },
    ]);
    expect(r.ok).toBe(false);
    expect(await uc.listMemoriesFor()).toHaveLength(0);
  });
});

describe("EditMemory", () => {
  it("edits caption/date/place", async () => {
    const { uc } = setup();
    const added = await uc.addMemory({ caption: "Old", media: "k" });
    if (!added.ok) return;
    const r = await uc.editMemory({
      id: added.value.id,
      caption: "New",
      place: "Goa",
      date: { year: 2020, month: 1, day: 2 },
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.caption).toBe("New");
    expect(r.value.place).toBe("Goa");
    expect(r.value.date).toEqual({ year: 2020, month: 1, day: 2 });
  });

  it("returns NOT_FOUND for a missing memory", async () => {
    const { uc } = setup();
    const r = await uc.editMemory({ id: "nope", caption: "x" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("MEMORY_NOT_FOUND");
  });
});

describe("Tagging", () => {
  it("tags and untags people, keeping uniqueness", async () => {
    const { uc } = setup();
    const added = await uc.addMemory({ caption: "x", media: "k" });
    if (!added.ok) return;
    const id = added.value.id;
    await uc.tagPersonInMemory(id, "p1");
    const dup = await uc.tagPersonInMemory(id, "p1");
    expect(dup.ok).toBe(true);
    if (!dup.ok) return;
    expect(dup.value.taggedPeople).toEqual(["p1"]);
    const untagged = await uc.untagPersonInMemory(id, "p1");
    expect(untagged.ok).toBe(true);
    if (!untagged.ok) return;
    expect(untagged.value.taggedPeople).toEqual([]);
  });
});

describe("Albums & Events", () => {
  it("creates and lists albums", async () => {
    const { uc } = setup();
    const r = await uc.createAlbum({
      title: "Diwali 2019",
      date: { year: 2019, month: null, day: null },
    });
    expect(r.ok).toBe(true);
    const albums = await uc.listAlbums();
    expect(albums).toHaveLength(1);
    expect(albums[0]?.title).toBe("Diwali 2019");
  });

  it("rejects an empty album title", async () => {
    const { uc } = setup();
    const r = await uc.createAlbum({ title: "" });
    expect(r.ok).toBe(false);
  });

  it("creates an event and links a memory to it", async () => {
    const { uc } = setup();
    const event = await uc.createEvent({ title: "Wedding" });
    if (!event.ok) return;
    const mem = await uc.addMemory({ caption: "x", media: "k" });
    if (!mem.ok) return;
    const linked = await uc.linkMemoryToEvent(mem.value.id, event.value.id);
    expect(linked.ok).toBe(true);
    if (!linked.ok) return;
    expect(linked.value.eventId).toBe(event.value.id);
  });

  it("fails linking to a missing event", async () => {
    const { uc } = setup();
    const mem = await uc.addMemory({ caption: "x", media: "k" });
    if (!mem.ok) return;
    const r = await uc.linkMemoryToEvent(mem.value.id, "missing");
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("EVENT_NOT_FOUND");
  });
});

describe("Reads: ListMemoriesFor / GetMemory", () => {
  async function seed(uc: MemoriesUseCases): Promise<void> {
    await uc.addMemory({
      caption: "2019 album-a person-p1",
      media: "k",
      date: { year: 2019, month: null, day: null },
      taggedPeople: ["p1"],
      albumId: "a1",
    });
    await uc.addMemory({
      caption: "2020 person-p2",
      media: "k",
      date: { year: 2020, month: null, day: null },
      taggedPeople: ["p2"],
    });
  }

  it("filters by person", async () => {
    const { uc } = setup();
    await seed(uc);
    const res = await uc.listMemoriesFor({ personId: "p1" });
    expect(res).toHaveLength(1);
    expect(res[0]?.taggedPeople).toContain("p1");
  });

  it("filters by album", async () => {
    const { uc } = setup();
    await seed(uc);
    const res = await uc.listMemoriesFor({ albumId: "a1" });
    expect(res).toHaveLength(1);
  });

  it("filters by year", async () => {
    const { uc } = setup();
    await seed(uc);
    const res = await uc.listMemoriesFor({ year: 2020 });
    expect(res).toHaveLength(1);
    expect(res[0]?.date?.year).toBe(2020);
  });

  it("sorts by date ascending", async () => {
    const { uc } = setup();
    await seed(uc);
    const res = await uc.listMemoriesFor();
    expect(res.map((m) => m.date?.year)).toEqual([2019, 2020]);
  });

  it("getMemory returns the DTO or null", async () => {
    const { uc } = setup();
    const added = await uc.addMemory({ caption: "x", media: "k" });
    if (!added.ok) return;
    expect((await uc.getMemory(added.value.id))?.caption).toBe("x");
    expect(await uc.getMemory("nope")).toBeNull();
  });
});

describe("listMemoryViews (cross-context producer)", () => {
  it("maps memories to MemoryView shapes", async () => {
    const { uc } = setup();
    await uc.addMemory({
      caption: "View me",
      media: "k",
      taggedPeople: ["p1"],
      place: "Goa",
    });
    const views = await uc.listMemoryViews();
    expect(views).toHaveLength(1);
    expect(views[0]).toMatchObject({
      caption: "View me",
      taggedPersonIds: ["p1"],
      place: "Goa",
      mediaRef: "k",
    });
  });
});
