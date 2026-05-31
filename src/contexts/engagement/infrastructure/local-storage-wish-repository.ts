import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { MemberId, PersonId, WishId, unwrap } from "@/shared/kernel";
import { Wish } from "../domain/wish";
import type { WishRepository } from "../application/ports";

interface StoredWish {
  id: string;
  toPersonId: string;
  fromMemberId: string;
  message: string;
  occasion: string | null;
  createdAtMs: number;
}

const NAMESPACE = "ff:engagement:wishes";
const SCHEMA_VERSION = 1;

function toStored(wish: Wish): StoredWish {
  return {
    id: wish.id,
    toPersonId: wish.toPersonId,
    fromMemberId: wish.fromMemberId,
    message: wish.message,
    occasion: wish.occasion,
    createdAtMs: wish.createdAtMs,
  };
}

function fromStored(stored: StoredWish): Wish {
  return unwrap(
    Wish.create({
      id: WishId(stored.id),
      toPersonId: PersonId(stored.toPersonId),
      fromMemberId: MemberId(stored.fromMemberId),
      message: stored.message,
      occasion: stored.occasion ?? undefined,
      createdAtMs: stored.createdAtMs,
    }),
  );
}

/** localStorage-backed WishRepository over a Collection (§8, §10.5). */
export class LocalStorageWishRepository implements WishRepository {
  private readonly collection: Collection<StoredWish>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredWish>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async save(wish: Wish): Promise<void> {
    this.collection.upsert(toStored(wish));
  }

  async listAll(): Promise<Wish[]> {
    return this.collection.all().map(fromStored);
  }
}
