import type { ApproximateDateJSON } from "@/shared/kernel";
import type { Gender, Visibility } from "../domain/person";
import type {
  RelationshipQualifier,
  RelationshipType,
} from "../domain/relationship";

/**
 * Plain, serializable DTOs (AGENT_CONTRACTS §6): the UI and the store never see
 * live domain entities. Dates are `ApproximateDateJSON`, never `Date`.
 */

export interface PersonDTO {
  id: string;
  legalName: string;
  nickname: string | null;
  displayName: string;
  gender: Gender;
  birth: ApproximateDateJSON | null;
  passing: ApproximateDateJSON | null;
  birthplace: string | null;
  currentLocation: string | null;
  bio: string | null;
  visibility: Visibility;
  branch: "Maternal" | "Paternal";
  isDeceased: boolean;
  isUnlisted: boolean;
}

export interface RelationshipDTO {
  id: string;
  type: RelationshipType;
  fromPersonId: string;
  toPersonId: string;
  qualifier: RelationshipQualifier | null;
}

export interface TreeDTO {
  nodes: PersonDTO[];
  edges: RelationshipDTO[];
}

/** A person plus the relationships they participate in, resolved to people. */
export interface ResolvedRelationshipDTO {
  relationship: RelationshipDTO;
  /** Plain-language label for the related person relative to the subject. */
  relation: string;
  person: PersonDTO;
}

export interface PersonProfileDTO {
  person: PersonDTO;
  relationships: ResolvedRelationshipDTO[];
}

export interface ChangeRequestDTO {
  id: string;
  action: "add" | "remove";
  type: RelationshipType;
  fromPersonId: string;
  toPersonId: string;
  qualifier: RelationshipQualifier | null;
  relationshipId: string | null;
  proposedBy: string;
  state: "Pending" | "Approved" | "Rejected";
}
