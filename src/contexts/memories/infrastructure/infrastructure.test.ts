import { describe, expect, it } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { SequentialIdGenerator } from "@/shared/ports";
import {
  ApproximateDate,
  AlbumId,
  EventId,
  MemoryId,
  PersonId,
  unwrap,
} from "@/shared/kernel";
import { Album, FamilyEvent, Memory } from "../domain";
import { LocalStorageMemoryRepository } from "./memory-repository";
import { LocalStorageAlbumRepository } from "./album-repository";
import { LocalStorageEventRepository } from "./event-repository";
import { KeyValueMediaStore } from "./key-value-media-store";

describe("LocalStorageMemoryRepository", () => {
  it("persists and rehydrates a memory across instances", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageMemoryRepository(store);
    const memory = unwrap(
      Memory.create({
        id: MemoryId("m1"),
        caption: "Diwali",
        mediaRef: "k1",
        date: ApproximateDate.day(2019, 11, 1),
        place: "Chennai",
        taggedPeople: [PersonId("p1")],
        albumId: AlbumId("a1"),
        eventId: EventId("e1"),
      }),
    );
    await repo.save(memory);

    const fresh = new LocalStorageMemoryRepository(store);
    const got = await fresh.get(MemoryId("m1"));
    expect(got).not.toBeNull();
    expect(got?.caption).toBe("Diwali");
    expect(got?.date?.precision).toBe("day");
    expect(got?.taggedPeople).toEqual([PersonId("p1")]);
    expect(got?.albumId).toBe("a1");
  });

  it("saveMany then all returns every record", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageMemoryRepository(store);
    await repo.saveMany([
      unwrap(Memory.create({ id: MemoryId("m1"), caption: "a", mediaRef: "k" })),
      unwrap(Memory.create({ id: MemoryId("m2"), caption: "b", mediaRef: "k" })),
    ]);
    expect(await repo.all()).toHaveLength(2);
  });
});

describe("LocalStorageAlbumRepository", () => {
  it("persists and rehydrates an album", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageAlbumRepository(store);
    await repo.save(
      unwrap(
        Album.create({
          id: AlbumId("a1"),
          title: "Trip",
          date: ApproximateDate.year(2019),
        }),
      ),
    );
    const got = await new LocalStorageAlbumRepository(store).get(AlbumId("a1"));
    expect(got?.title).toBe("Trip");
    expect(got?.date?.year).toBe(2019);
  });
});

describe("LocalStorageEventRepository", () => {
  it("persists an event with a date range", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStorageEventRepository(store);
    await repo.save(
      unwrap(
        FamilyEvent.create({
          id: EventId("e1"),
          title: "Trek",
          dateRange: {
            start: ApproximateDate.day(2019, 1, 1),
            end: ApproximateDate.day(2019, 1, 7),
          },
        }),
      ),
    );
    const got = await new LocalStorageEventRepository(store).get(EventId("e1"));
    expect(got?.dateRange?.end.day).toBe(7);
  });
});

describe("KeyValueMediaStore", () => {
  it("stores a data URL and returns it by key", async () => {
    const store = new InMemoryKeyValueStore();
    const media = new KeyValueMediaStore(store, new SequentialIdGenerator("k"));
    const key = await media.put("data:image/png;base64,AAA");
    expect(await media.get(key)).toBe("data:image/png;base64,AAA");
    // putThumbnail is a no-op seam returning the same key.
    expect(await media.putThumbnail(key)).toBe(key);
  });

  it("persists across instances", async () => {
    const store = new InMemoryKeyValueStore();
    const key = await new KeyValueMediaStore(
      store,
      new SequentialIdGenerator("k"),
    ).put("data:x");
    const fresh = new KeyValueMediaStore(store, new SequentialIdGenerator("k"));
    expect(await fresh.get(key)).toBe("data:x");
  });

  it("returns null for an unknown key", async () => {
    const store = new InMemoryKeyValueStore();
    const media = new KeyValueMediaStore(store, new SequentialIdGenerator("k"));
    expect(await media.get("missing")).toBeNull();
  });
});
