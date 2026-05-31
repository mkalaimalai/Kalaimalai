import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { MemberId, PersonId, unwrap } from "@/shared/kernel";
import { Member, type MemberProps, type MemberStatus } from "../domain/member";
import type { Role } from "../domain/role";
import type { MemberRepository } from "../application/ports";

/** Stored shape — plain serializable record (no class instances, no branded ids). */
interface StoredMember {
  id: string;
  displayName: string;
  email: string | null;
  role: Role;
  linkedPersonId: string | null;
  status: MemberStatus;
}

const NAMESPACE = "ff:identity:members";
const SCHEMA_VERSION = 1;

function toStored(member: Member): StoredMember {
  return {
    id: member.id,
    displayName: member.displayName,
    email: member.email ?? null,
    role: member.role,
    linkedPersonId: member.linkedPersonId ?? null,
    status: member.status,
  };
}

function toDomain(stored: StoredMember): Member {
  const props: MemberProps = {
    id: MemberId(stored.id),
    displayName: stored.displayName,
    role: stored.role,
    status: stored.status,
    ...(stored.email !== null ? { email: stored.email } : {}),
    ...(stored.linkedPersonId !== null
      ? { linkedPersonId: PersonId(stored.linkedPersonId) }
      : {}),
  };
  // Trusted persisted data — created through validated constructors originally.
  return unwrap(Member.create(props));
}

export class LocalStorageMemberRepository implements MemberRepository {
  private readonly collection: Collection<StoredMember>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredMember>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async get(id: string): Promise<Member | null> {
    const stored = this.collection.get(id);
    return stored ? toDomain(stored) : null;
  }

  async list(): Promise<Member[]> {
    return this.collection.all().map(toDomain);
  }

  async save(member: Member): Promise<void> {
    this.collection.upsert(toStored(member));
  }
}
