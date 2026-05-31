import type { AlbumId, EventId, MemoryId } from "@/shared/kernel";
import type { Album, FamilyEvent, Memory } from "../domain";

/**
 * Output ports (driven). The application depends on these interfaces; concrete
 * adapters live in `infrastructure/` and are wired at the composition root.
 */

export interface MemoryRepository {
  get(id: MemoryId): Promise<Memory | null>;
  all(): Promise<Memory[]>;
  save(memory: Memory): Promise<void>;
  saveMany(memories: Memory[]): Promise<void>;
}

export interface AlbumRepository {
  get(id: AlbumId): Promise<Album | null>;
  all(): Promise<Album[]>;
  save(album: Album): Promise<void>;
}

export interface EventRepository {
  get(id: EventId): Promise<FamilyEvent | null>;
  all(): Promise<FamilyEvent[]>;
  save(event: FamilyEvent): Promise<void>;
}

/**
 * MediaStore — persists a blob/data URL and returns an opaque key for later
 * retrieval. The Phase-0 adapter stores data URLs in a KeyValueStore-backed
 * collection (stand-in for IndexedDB); the interface is kept so a real
 * IndexedDB/object-store adapter swaps in later (TECHNICAL_DESIGN §10.2).
 * Thumbnail generation is a seam: `putThumbnail` may no-op and return the same
 * key in Phase 0.
 */
export interface MediaStore {
  put(blobOrDataUrl: string): Promise<string>;
  get(key: string): Promise<string | null>;
  putThumbnail(key: string): Promise<string>;
}
