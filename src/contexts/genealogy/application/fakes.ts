import type { PersonId } from "@/shared/kernel";
import type { Person } from "../domain/person";
import type { Relationship } from "../domain/relationship";
import type { RelationshipChangeRequest } from "../domain/relationship-change-request";
import type {
  ChangeRequestRepository,
  PersonRepository,
  RelationshipRepository,
} from "./ports";

/** In-memory port fakes for use-case tests (TECHNICAL_DESIGN §12). */

export class FakePersonRepository implements PersonRepository {
  private readonly map = new Map<string, Person>();
  async get(id: PersonId): Promise<Person | null> {
    return this.map.get(id as string) ?? null;
  }
  async list(): Promise<Person[]> {
    return Array.from(this.map.values());
  }
  async save(person: Person): Promise<void> {
    this.map.set(person.id as string, person);
  }
  async delete(id: PersonId): Promise<void> {
    this.map.delete(id as string);
  }
}

export class FakeRelationshipRepository implements RelationshipRepository {
  private readonly map = new Map<string, Relationship>();
  async get(id: string): Promise<Relationship | null> {
    return this.map.get(id) ?? null;
  }
  async list(): Promise<Relationship[]> {
    return Array.from(this.map.values());
  }
  async save(relationship: Relationship): Promise<void> {
    this.map.set(relationship.id as string, relationship);
  }
  async delete(id: string): Promise<void> {
    this.map.delete(id);
  }
}

export class FakeChangeRequestRepository implements ChangeRequestRepository {
  private readonly map = new Map<string, RelationshipChangeRequest>();
  async get(id: string): Promise<RelationshipChangeRequest | null> {
    return this.map.get(id) ?? null;
  }
  async list(): Promise<RelationshipChangeRequest[]> {
    return Array.from(this.map.values());
  }
  async save(request: RelationshipChangeRequest): Promise<void> {
    this.map.set(request.id as string, request);
  }
}
