import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { MemberId, ReactionId, unwrap } from "@/shared/kernel";
import { Reaction } from "../domain/reaction";
import { type TargetType, isTargetType } from "../domain/target";
import type { ReactionRepository } from "../application/ports";
import type { Target } from "../domain/target";

interface StoredReaction {
  id: string;
  targetType: TargetType;
  targetId: string;
  memberId: string;
  kind: string;
  createdAtMs: number;
}

const NAMESPACE = "ff:engagement:reactions";
const SCHEMA_VERSION = 1;

function toStored(reaction: Reaction): StoredReaction {
  return {
    id: reaction.id,
    targetType: reaction.targetType,
    targetId: reaction.targetId,
    memberId: reaction.memberId,
    kind: reaction.kind,
    createdAtMs: reaction.createdAtMs,
  };
}

function fromStored(stored: StoredReaction): Reaction {
  const targetType: TargetType = isTargetType(stored.targetType)
    ? stored.targetType
    : "Memory";
  return unwrap(
    Reaction.create({
      id: ReactionId(stored.id),
      targetType,
      targetId: stored.targetId,
      memberId: MemberId(stored.memberId),
      kind: stored.kind,
      createdAtMs: stored.createdAtMs,
    }),
  );
}

/** localStorage-backed ReactionRepository over a Collection (§8, §10.5). */
export class LocalStorageReactionRepository implements ReactionRepository {
  private readonly collection: Collection<StoredReaction>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredReaction>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async save(reaction: Reaction): Promise<void> {
    this.collection.upsert(toStored(reaction));
  }

  async listAll(): Promise<Reaction[]> {
    return this.collection.all().map(fromStored);
  }

  async listFor(target: Target): Promise<Reaction[]> {
    return this.collection
      .find(
        (r) => r.targetType === target.targetType && r.targetId === target.targetId,
      )
      .map(fromStored);
  }
}
