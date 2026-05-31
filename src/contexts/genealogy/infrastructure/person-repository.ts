import {
  ApproximateDate,
  type ApproximateDateJSON,
  type Branch,
  PersonId,
} from "@/shared/kernel";
import { Collection, type KeyValueStore } from "@/shared/infrastructure";
import { Person, type Gender, type Visibility } from "../domain/person";
import type { PersonRepository } from "../application/ports";

interface StoredPerson {
  id: string;
  legalName: string;
  nickname: string | null;
  gender: Gender;
  birth: ApproximateDateJSON | null;
  passing: ApproximateDateJSON | null;
  birthplace: string | null;
  currentLocation: string | null;
  bio: string | null;
  visibility: Visibility;
  branch: Branch;
}

const NAMESPACE = "ff:genealogy:people";
const SCHEMA_VERSION = 1;

function toStored(person: Person): StoredPerson {
  return {
    id: person.id as string,
    legalName: person.legalName,
    nickname: person.nickname ?? null,
    gender: person.gender,
    birth: person.birth ? person.birth.toJSON() : null,
    passing: person.passing ? person.passing.toJSON() : null,
    birthplace: person.birthplace ?? null,
    currentLocation: person.currentLocation ?? null,
    bio: person.bio ?? null,
    visibility: person.visibility,
    branch: person.branch,
  };
}

function fromStored(stored: StoredPerson): Person {
  const result = Person.create({
    id: PersonId(stored.id),
    legalName: stored.legalName,
    nickname: stored.nickname ?? undefined,
    gender: stored.gender,
    birth: stored.birth ? ApproximateDate.fromJSON(stored.birth) : undefined,
    passing: stored.passing
      ? ApproximateDate.fromJSON(stored.passing)
      : undefined,
    birthplace: stored.birthplace ?? undefined,
    currentLocation: stored.currentLocation ?? undefined,
    bio: stored.bio ?? undefined,
    visibility: stored.visibility,
    branch: stored.branch,
  });
  if (!result.ok) {
    throw new Error(
      `Corrupt stored person ${stored.id}: ${result.error.message}`,
    );
  }
  return result.value;
}

export class LocalStoragePersonRepository implements PersonRepository {
  private readonly collection: Collection<StoredPerson>;

  constructor(store: KeyValueStore) {
    this.collection = new Collection<StoredPerson>({
      store,
      namespace: NAMESPACE,
      schemaVersion: SCHEMA_VERSION,
    });
  }

  async get(id: PersonId): Promise<Person | null> {
    const stored = this.collection.get(id as string);
    return stored ? fromStored(stored) : null;
  }

  async list(): Promise<Person[]> {
    return this.collection.all().map(fromStored);
  }

  async save(person: Person): Promise<void> {
    this.collection.upsert(toStored(person));
  }

  async delete(id: PersonId): Promise<void> {
    this.collection.delete(id as string);
  }
}
