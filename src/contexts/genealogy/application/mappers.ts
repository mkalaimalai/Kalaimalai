import type { PersonView, RelationshipView } from "@/shared/views";
import type { Person } from "../domain/person";
import type { Relationship } from "../domain/relationship";
import type { RelationshipChangeRequest } from "../domain/relationship-change-request";
import type {
  ChangeRequestDTO,
  PersonDTO,
  RelationshipDTO,
} from "./dtos";

export function toPersonDTO(person: Person): PersonDTO {
  return {
    id: person.id as string,
    legalName: person.legalName,
    nickname: person.nickname ?? null,
    displayName: person.displayName,
    gender: person.gender,
    birth: person.birth ? person.birth.toJSON() : null,
    passing: person.passing ? person.passing.toJSON() : null,
    birthplace: person.birthplace ?? null,
    currentLocation: person.currentLocation ?? null,
    bio: person.bio ?? null,
    visibility: person.visibility,
    branch: person.branch,
    isDeceased: person.isDeceased,
    isUnlisted: person.isUnlisted,
  };
}

export function toRelationshipDTO(rel: Relationship): RelationshipDTO {
  return {
    id: rel.id as string,
    type: rel.type,
    fromPersonId: rel.from as string,
    toPersonId: rel.to as string,
    qualifier: rel.qualifier ?? null,
  };
}

export function toChangeRequestDTO(
  request: RelationshipChangeRequest,
): ChangeRequestDTO {
  const { edit } = request;
  return {
    id: request.id as string,
    action: edit.action,
    type: edit.type,
    fromPersonId: edit.from as string,
    toPersonId: edit.to as string,
    qualifier: edit.qualifier ?? null,
    relationshipId: (edit.relationshipId as string | undefined) ?? null,
    proposedBy: request.proposedBy as string,
    state: request.state,
  };
}

export function toPersonView(person: Person): PersonView {
  return {
    id: person.id as string,
    displayName: person.displayName,
    branch: person.branch,
    gender: person.gender,
    birth: person.birth ? person.birth.toJSON() : null,
    passing: person.passing ? person.passing.toJSON() : null,
    isDeceased: person.isDeceased,
    isUnlisted: person.isUnlisted,
  };
}

export function toRelationshipView(rel: Relationship): RelationshipView {
  return {
    id: rel.id as string,
    type: rel.type,
    fromPersonId: rel.from as string,
    toPersonId: rel.to as string,
  };
}
