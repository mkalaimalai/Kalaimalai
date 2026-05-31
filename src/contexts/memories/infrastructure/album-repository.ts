import {
  AlbumId,
  ApproximateDate,
  type ApproximateDateJSON,
  unwrap,
} from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { Album } from "../domain";
import type { AlbumRepository } from "../application";

interface StoredAlbum {
  id: string;
  title: string;
  date: ApproximateDateJSON | null;
}

const NAMESPACE = "ff:memories:albums";
const SCHEMA_VERSION = 1;

function dehydrate(a: Album): StoredAlbum {
  return { id: a.id, title: a.title, date: a.date ? a.date.toJSON() : null };
}

function hydrate(s: StoredAlbum): Album {
  return unwrap(
    Album.create({
      id: AlbumId(s.id),
      title: s.title,
      date: s.date ? ApproximateDate.fromJSON(s.date) : undefined,
    }),
  );
}

export class LocalStorageAlbumRepository implements AlbumRepository {
  private readonly collection: Collection<StoredAlbum, Album>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredAlbum, Album>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
      hydrate,
      dehydrate,
    });
  }

  async get(id: AlbumId): Promise<Album | null> {
    return this.collection.get(id);
  }

  async all(): Promise<Album[]> {
    return this.collection.all();
  }

  async save(album: Album): Promise<void> {
    this.collection.upsert(album);
  }
}
