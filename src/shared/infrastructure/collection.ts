import type { KeyValueStore } from "./key-value-store";

/**
 * Collection<T> — a namespace-scoped, schema-versioned, write-through map over a
 * KeyValueStore (TECHNICAL_DESIGN §8). Repositories wrap one of these per
 * aggregate. Holds an in-memory cache for speed and persists on every mutation.
 *
 * `T` must be a plain serializable record keyed by `id`.
 */

interface Envelope<T> {
  schemaVersion: number;
  records: Record<string, T>;
}

export interface CollectionOptions<TStored, TCurrent> {
  store: KeyValueStore;
  namespace: string;
  schemaVersion: number;
  /** Upgrade an older payload to the current shape (TECHNICAL_DESIGN §8). */
  migrate?: (raw: unknown, fromVersion: number) => Record<string, TStored>;
  /** Map a stored record to the in-memory current shape (default: identity). */
  hydrate?: (stored: TStored) => TCurrent;
  /** Map a current record back to its stored shape (default: identity). */
  dehydrate?: (current: TCurrent) => TStored;
}

export class Collection<TStored extends { id: string }, TCurrent extends { id: string } = TStored> {
  private cache: Map<string, TCurrent> | null = null;

  constructor(private readonly opts: CollectionOptions<TStored, TCurrent>) {}

  private hydrate(stored: TStored): TCurrent {
    return this.opts.hydrate
      ? this.opts.hydrate(stored)
      : (stored as unknown as TCurrent);
  }

  private dehydrate(current: TCurrent): TStored {
    return this.opts.dehydrate
      ? this.opts.dehydrate(current)
      : (current as unknown as TStored);
  }

  private load(): Map<string, TCurrent> {
    if (this.cache) return this.cache;
    const raw = this.opts.store.read(this.opts.namespace);
    const map = new Map<string, TCurrent>();
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Envelope<TStored>;
        let records = parsed.records ?? {};
        if (
          parsed.schemaVersion !== this.opts.schemaVersion &&
          this.opts.migrate
        ) {
          records = this.opts.migrate(parsed.records, parsed.schemaVersion);
        }
        for (const stored of Object.values(records)) {
          map.set(stored.id, this.hydrate(stored));
        }
      } catch {
        // Corrupt payload: start clean rather than crash (irreplaceable-data
        // principle means we never *overwrite* until a successful write).
      }
    }
    this.cache = map;
    return map;
  }

  private persist(): void {
    const map = this.load();
    const records: Record<string, TStored> = {};
    for (const [id, current] of map) {
      records[id] = this.dehydrate(current);
    }
    const envelope: Envelope<TStored> = {
      schemaVersion: this.opts.schemaVersion,
      records,
    };
    this.opts.store.write(this.opts.namespace, JSON.stringify(envelope));
  }

  get(id: string): TCurrent | null {
    return this.load().get(id) ?? null;
  }

  all(): TCurrent[] {
    return Array.from(this.load().values());
  }

  find(predicate: (record: TCurrent) => boolean): TCurrent[] {
    return this.all().filter(predicate);
  }

  upsert(record: TCurrent): void {
    this.load().set(record.id, record);
    this.persist();
  }

  upsertMany(records: TCurrent[]): void {
    const map = this.load();
    for (const record of records) map.set(record.id, record);
    this.persist();
  }

  delete(id: string): void {
    if (this.load().delete(id)) this.persist();
  }

  clear(): void {
    this.cache = new Map();
    this.persist();
  }
}
