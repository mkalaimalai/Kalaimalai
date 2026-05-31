import { PersonId, RelationshipId } from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import {
  Relationship,
  type RelationshipQualifier,
  type RelationshipType,
} from "../domain/relationship";
import type { RelationshipRepository } from "../application/ports";

interface StoredRelationship {
  id: string;
  type: RelationshipType;
  from: string;
  to: string;
  qualifier: RelationshipQualifier | null;
}

const NAMESPACE = "ff:genealogy:relationships";
const SCHEMA_VERSION = 1;

function toStored(rel: Relationship): StoredRelationship {
  return {
    id: rel.id as string,
    type: rel.type,
    from: rel.from as string,
    to: rel.to as string,
    qualifier: rel.qualifier ?? null,
  };
}

function fromStored(stored: StoredRelationship): Relationship {
  const result = Relationship.create({
    id: RelationshipId(stored.id),
    type: stored.type,
    from: PersonId(stored.from),
    to: PersonId(stored.to),
    qualifier: stored.qualifier ?? undefined,
  });
  if (!result.ok) {
    throw new Error(
      `Corrupt stored relationship ${stored.id}: ${result.error.message}`,
    );
  }
  return result.value;
}

export class LocalStorageRelationshipRepository
  implements RelationshipRepository
{
  private readonly collection: Collection<StoredRelationship>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredRelationship>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async get(id: string): Promise<Relationship | null> {
    const stored = this.collection.get(id);
    return stored ? fromStored(stored) : null;
  }

  async list(): Promise<Relationship[]> {
    return this.collection.all().map(fromStored);
  }

  async save(relationship: Relationship): Promise<void> {
    this.collection.upsert(toStored(relationship));
  }

  async delete(id: string): Promise<void> {
    this.collection.delete(id);
  }
}
