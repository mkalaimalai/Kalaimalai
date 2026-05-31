import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { CommentId, MemberId, unwrap } from "@/shared/kernel";
import { Comment } from "../domain/comment";
import { type TargetType, isTargetType } from "../domain/target";
import type { CommentRepository } from "../application/ports";
import type { Target } from "../domain/target";

interface StoredComment {
  id: string;
  targetType: TargetType;
  targetId: string;
  memberId: string;
  text: string;
  createdAtMs: number;
}

const NAMESPACE = "ff:engagement:comments";
const SCHEMA_VERSION = 1;

function toStored(comment: Comment): StoredComment {
  return {
    id: comment.id,
    targetType: comment.targetType,
    targetId: comment.targetId,
    memberId: comment.memberId,
    text: comment.text,
    createdAtMs: comment.createdAtMs,
  };
}

function fromStored(stored: StoredComment): Comment {
  const targetType: TargetType = isTargetType(stored.targetType)
    ? stored.targetType
    : "Memory";
  return unwrap(
    Comment.create({
      id: CommentId(stored.id),
      targetType,
      targetId: stored.targetId,
      memberId: MemberId(stored.memberId),
      text: stored.text,
      createdAtMs: stored.createdAtMs,
    }),
  );
}

/** localStorage-backed CommentRepository over a Collection (§8, §10.5). */
export class LocalStorageCommentRepository implements CommentRepository {
  private readonly collection: Collection<StoredComment>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredComment>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async save(comment: Comment): Promise<void> {
    this.collection.upsert(toStored(comment));
  }

  async listAll(): Promise<Comment[]> {
    return this.collection.all().map(fromStored);
  }

  async listFor(target: Target): Promise<Comment[]> {
    return this.collection
      .find(
        (c) => c.targetType === target.targetType && c.targetId === target.targetId,
      )
      .map(fromStored);
  }
}
