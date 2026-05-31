import {
  ChangeRequestId,
  PersonId,
  RelationshipId,
} from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import {
  RelationshipChangeRequest,
  type ChangeRequestState,
  type StructuralEditAction,
} from "../domain/relationship-change-request";
import type {
  RelationshipQualifier,
  RelationshipType,
} from "../domain/relationship";
import type { ChangeRequestRepository } from "../application/ports";

interface StoredChangeRequest {
  id: string;
  action: StructuralEditAction;
  type: RelationshipType;
  from: string;
  to: string;
  qualifier: RelationshipQualifier | null;
  relationshipId: string | null;
  proposedBy: string;
  state: ChangeRequestState;
}

const NAMESPACE = "ff:genealogy:change-requests";
const SCHEMA_VERSION = 1;

function toStored(req: RelationshipChangeRequest): StoredChangeRequest {
  const { edit } = req;
  return {
    id: req.id as string,
    action: edit.action,
    type: edit.type,
    from: edit.from as string,
    to: edit.to as string,
    qualifier: edit.qualifier ?? null,
    relationshipId: (edit.relationshipId as string | undefined) ?? null,
    proposedBy: req.proposedBy as string,
    state: req.state,
  };
}

function fromStored(stored: StoredChangeRequest): RelationshipChangeRequest {
  return RelationshipChangeRequest.rehydrate({
    id: ChangeRequestId(stored.id),
    proposedBy: PersonId(stored.proposedBy),
    state: stored.state,
    edit: {
      action: stored.action,
      type: stored.type,
      from: PersonId(stored.from),
      to: PersonId(stored.to),
      qualifier: stored.qualifier ?? undefined,
      relationshipId: stored.relationshipId
        ? RelationshipId(stored.relationshipId)
        : undefined,
    },
  });
}

export class LocalStorageChangeRequestRepository
  implements ChangeRequestRepository
{
  private readonly collection: Collection<StoredChangeRequest>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredChangeRequest>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async get(id: string): Promise<RelationshipChangeRequest | null> {
    const stored = this.collection.get(id);
    return stored ? fromStored(stored) : null;
  }

  async list(): Promise<RelationshipChangeRequest[]> {
    return this.collection.all().map(fromStored);
  }

  async save(request: RelationshipChangeRequest): Promise<void> {
    this.collection.upsert(toStored(request));
  }
}
