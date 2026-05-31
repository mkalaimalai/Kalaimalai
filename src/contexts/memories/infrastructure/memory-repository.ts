import {
  AlbumId,
  ApproximateDate,
  type ApproximateDateJSON,
  EventId,
  MemoryId,
  PersonId,
} from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { Memory } from "../domain";
import { unwrap } from "@/shared/kernel";
import type { MemoryRepository } from "../application";

/** Persisted shape — plain & serializable (no class instances, no Date). */
interface StoredMemory {
  id: string;
  caption: string;
  mediaRef: string;
  date: ApproximateDateJSON | null;
  place: string | null;
  taggedPeople: string[];
  albumId: string | null;
  eventId: string | null;
}

const NAMESPACE = "ff:memories:memories";
const SCHEMA_VERSION = 1;

function dehydrate(m: Memory): StoredMemory {
  return {
    id: m.id,
    caption: m.caption,
    mediaRef: m.mediaRef,
    date: m.date ? m.date.toJSON() : null,
    place: m.place,
    taggedPeople: [...m.taggedPeople],
    albumId: m.albumId,
    eventId: m.eventId,
  };
}

function hydrate(s: StoredMemory): Memory {
  // Persisted records were validated on write, so unwrap is safe here.
  return unwrap(
    Memory.create({
      id: MemoryId(s.id),
      caption: s.caption,
      mediaRef: s.mediaRef,
      date: s.date ? ApproximateDate.fromJSON(s.date) : undefined,
      place: s.place ?? undefined,
      taggedPeople: s.taggedPeople.map((p) => PersonId(p)),
      albumId: s.albumId ? AlbumId(s.albumId) : undefined,
      eventId: s.eventId ? EventId(s.eventId) : undefined,
    }),
  );
}

export class LocalStorageMemoryRepository implements MemoryRepository {
  private readonly collection: Collection<StoredMemory, Memory>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredMemory, Memory>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
      hydrate,
      dehydrate,
    });
  }

  async get(id: MemoryId): Promise<Memory | null> {
    return this.collection.get(id);
  }

  async all(): Promise<Memory[]> {
    return this.collection.all();
  }

  async save(memory: Memory): Promise<void> {
    this.collection.upsert(memory);
  }

  async saveMany(memories: Memory[]): Promise<void> {
    this.collection.upsertMany(memories);
  }
}
