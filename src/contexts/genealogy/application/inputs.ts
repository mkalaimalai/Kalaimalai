import type { ApproximateDateJSON, Branch } from "@/shared/kernel";
import type { Gender, Visibility } from "../domain/person";
import type {
  RelationshipQualifier,
  RelationshipType,
} from "../domain/relationship";

/** Use-case input shapes — plain & serializable (UI submits these). */

export interface AddPersonInput {
  legalName: string;
  nickname?: string;
  gender: Gender;
  birth?: ApproximateDateJSON | null;
  passing?: ApproximateDateJSON | null;
  birthplace?: string;
  currentLocation?: string;
  bio?: string;
  visibility: Visibility;
  branch: Branch;
}

export interface EditPersonInput {
  id: string;
  legalName?: string;
  nickname?: string | null;
  gender?: Gender;
  birth?: ApproximateDateJSON | null;
  passing?: ApproximateDateJSON | null;
  birthplace?: string | null;
  currentLocation?: string | null;
  bio?: string | null;
  visibility?: Visibility;
  branch?: Branch;
}

export interface ProposeRelationshipChangeInput {
  action: "add" | "remove";
  type: RelationshipType;
  fromPersonId: string;
  toPersonId: string;
  qualifier?: RelationshipQualifier;
  relationshipId?: string;
  proposedBy: string;
}

export interface ApproveRelationshipChangeInput {
  changeRequestId: string;
  actorRole: "Admin" | "Member" | "Elder";
}

export type ActorRole = "Admin" | "Member" | "Elder";
