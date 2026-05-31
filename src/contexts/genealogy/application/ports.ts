import type { PersonId } from "@/shared/kernel";
import type { Person } from "../domain/person";
import type { Relationship } from "../domain/relationship";
import type { RelationshipChangeRequest } from "../domain/relationship-change-request";

/**
 * Output ports (driven side) for the Genealogy context. Implemented by
 * infrastructure adapters; consumed by use cases. Persistence is hidden behind
 * these interfaces so the backend can be swapped later (TECHNICAL_DESIGN §6.1).
 */

export interface PersonRepository {
  get(id: PersonId): Promise<Person | null>;
  list(): Promise<Person[]>;
  save(person: Person): Promise<void>;
  delete(id: PersonId): Promise<void>;
}

export interface RelationshipRepository {
  get(id: string): Promise<Relationship | null>;
  list(): Promise<Relationship[]>;
  save(relationship: Relationship): Promise<void>;
  delete(id: string): Promise<void>;
}

export interface ChangeRequestRepository {
  get(id: string): Promise<RelationshipChangeRequest | null>;
  list(): Promise<RelationshipChangeRequest[]>;
  save(request: RelationshipChangeRequest): Promise<void>;
}
