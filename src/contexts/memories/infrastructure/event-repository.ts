import {
  ApproximateDate,
  type ApproximateDateJSON,
  EventId,
  unwrap,
} from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { FamilyEvent } from "../domain";
import type { EventRepository } from "../application";

interface StoredEvent {
  id: string;
  title: string;
  date: ApproximateDateJSON | null;
  dateRange: { start: ApproximateDateJSON; end: ApproximateDateJSON } | null;
}

const NAMESPACE = "ff:memories:events";
const SCHEMA_VERSION = 1;

function dehydrate(e: FamilyEvent): StoredEvent {
  return {
    id: e.id,
    title: e.title,
    date: e.date ? e.date.toJSON() : null,
    dateRange: e.dateRange
      ? { start: e.dateRange.start.toJSON(), end: e.dateRange.end.toJSON() }
      : null,
  };
}

function hydrate(s: StoredEvent): FamilyEvent {
  return unwrap(
    FamilyEvent.create({
      id: EventId(s.id),
      title: s.title,
      date: s.date ? ApproximateDate.fromJSON(s.date) : undefined,
      dateRange: s.dateRange
        ? {
            start: ApproximateDate.fromJSON(s.dateRange.start),
            end: ApproximateDate.fromJSON(s.dateRange.end),
          }
        : undefined,
    }),
  );
}

export class LocalStorageEventRepository implements EventRepository {
  private readonly collection: Collection<StoredEvent, FamilyEvent>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredEvent, FamilyEvent>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
      hydrate,
      dehydrate,
    });
  }

  async get(id: EventId): Promise<FamilyEvent | null> {
    return this.collection.get(id);
  }

  async all(): Promise<FamilyEvent[]> {
    return this.collection.all();
  }

  async save(event: FamilyEvent): Promise<void> {
    this.collection.upsert(event);
  }
}
