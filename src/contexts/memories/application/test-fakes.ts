import type { AlbumId, EventId, MemoryId } from "@/shared/kernel";
import type { Album, FamilyEvent, Memory } from "../domain";
import type {
  AlbumRepository,
  EventRepository,
  MediaStore,
  MemoryRepository,
} from "./ports";

/** In-memory port fakes for use-case tests (TECHNICAL_DESIGN §12 application tier). */

export class FakeMemoryRepository implements MemoryRepository {
  private readonly map = new Map<string, Memory>();
  async get(id: MemoryId): Promise<Memory | null> {
    return this.map.get(id) ?? null;
  }
  async all(): Promise<Memory[]> {
    return Array.from(this.map.values());
  }
  async save(memory: Memory): Promise<void> {
    this.map.set(memory.id, memory);
  }
  async saveMany(memories: Memory[]): Promise<void> {
    for (const m of memories) this.map.set(m.id, m);
  }
}

export class FakeAlbumRepository implements AlbumRepository {
  private readonly map = new Map<string, Album>();
  async get(id: AlbumId): Promise<Album | null> {
    return this.map.get(id) ?? null;
  }
  async all(): Promise<Album[]> {
    return Array.from(this.map.values());
  }
  async save(album: Album): Promise<void> {
    this.map.set(album.id, album);
  }
}

export class FakeEventRepository implements EventRepository {
  private readonly map = new Map<string, FamilyEvent>();
  async get(id: EventId): Promise<FamilyEvent | null> {
    return this.map.get(id) ?? null;
  }
  async all(): Promise<FamilyEvent[]> {
    return Array.from(this.map.values());
  }
  async save(event: FamilyEvent): Promise<void> {
    this.map.set(event.id, event);
  }
}

export class FakeMediaStore implements MediaStore {
  private readonly map = new Map<string, string>();
  private counter = 0;
  async put(blobOrDataUrl: string): Promise<string> {
    this.counter += 1;
    const key = `media-${this.counter}`;
    this.map.set(key, blobOrDataUrl);
    return key;
  }
  async get(key: string): Promise<string | null> {
    return this.map.get(key) ?? null;
  }
  async putThumbnail(key: string): Promise<string> {
    return key;
  }
}
