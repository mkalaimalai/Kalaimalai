import type { IdGenerator } from "@/shared/ports";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import type { MediaStore } from "../application";

/** A stored media blob: its key and the data URL (stand-in for an IndexedDB blob). */
interface StoredMedia {
  id: string;
  dataUrl: string;
}

const NAMESPACE = "ff:memories:media";
const SCHEMA_VERSION = 1;

/**
 * KeyValueMediaStore — Phase-0 MediaStore adapter. Persists data URLs in a
 * Collection over the shared KeyValueStore (stand-in for IndexedDB/object
 * storage). The interface is kept narrow so a real IndexedDB adapter swaps in
 * later (TECHNICAL_DESIGN §10.2). Thumbnail generation is a no-op seam that
 * returns the same key.
 */
export class KeyValueMediaStore implements MediaStore {
  private readonly collection: Collection<StoredMedia>;

  constructor(
    store: KeyValueStore,
    private readonly ids: IdGenerator,
  ) {
    this.collection = new Collection<StoredMedia>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async put(blobOrDataUrl: string): Promise<string> {
    const id = `media-${this.ids.next()}`;
    this.collection.upsert({ id, dataUrl: blobOrDataUrl });
    return id;
  }

  async get(key: string): Promise<string | null> {
    return this.collection.get(key)?.dataUrl ?? null;
  }

  async putThumbnail(key: string): Promise<string> {
    // Phase-0 stub: real adapter will derive and store a downscaled thumbnail.
    return key;
  }
}
