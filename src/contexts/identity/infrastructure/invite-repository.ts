import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { InviteId, MemberId, unwrap } from "@/shared/kernel";
import { Invite, type InviteProps } from "../domain/invite";
import type { Role } from "../domain/role";
import type { InviteRepository } from "../application/ports";

interface StoredInvite {
  id: string;
  token: string;
  invitedByMemberId: string;
  role: Role;
  createdAtMs: number;
  expiresAtMs: number;
  redeemed: boolean;
}

const NAMESPACE = "ff:identity:invites";
const SCHEMA_VERSION = 1;

function toStored(invite: Invite): StoredInvite {
  return {
    id: invite.id,
    token: invite.token,
    invitedByMemberId: invite.invitedByMemberId,
    role: invite.role,
    createdAtMs: invite.createdAtMs,
    expiresAtMs: invite.expiresAtMs,
    redeemed: invite.redeemed,
  };
}

function toDomain(stored: StoredInvite): Invite {
  const props: InviteProps = {
    id: InviteId(stored.id),
    token: stored.token,
    invitedByMemberId: MemberId(stored.invitedByMemberId),
    role: stored.role,
    createdAtMs: stored.createdAtMs,
    expiresAtMs: stored.expiresAtMs,
    redeemed: stored.redeemed,
  };
  return unwrap(Invite.create(props));
}

export class LocalStorageInviteRepository implements InviteRepository {
  private readonly collection: Collection<StoredInvite>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredInvite>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async get(id: string): Promise<Invite | null> {
    const stored = this.collection.get(id);
    return stored ? toDomain(stored) : null;
  }

  async findByToken(token: string): Promise<Invite | null> {
    const matches = this.collection.find((r) => r.token === token);
    const first = matches[0];
    return first ? toDomain(first) : null;
  }

  async list(): Promise<Invite[]> {
    return this.collection.all().map(toDomain);
  }

  async save(invite: Invite): Promise<void> {
    this.collection.upsert(toStored(invite));
  }
}
