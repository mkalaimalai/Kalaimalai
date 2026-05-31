import type { Branch, Result } from "@/shared/kernel";
import type { SharedDeps } from "@/bootstrap/container";
import type { PersonView, RelationshipView } from "@/shared/views";
import {
  LocalStoragePersonRepository,
  LocalStorageRelationshipRepository,
  LocalStorageChangeRequestRepository,
} from "./infrastructure";
import {
  addPerson,
  approveRelationshipChange,
  editPerson,
  explainRelationship,
  getPersonProfile,
  getTree,
  listChangeRequests,
  listPeopleViews,
  listRelationshipViews,
  proposeRelationshipChange,
  type UseCaseDeps,
} from "./application/use-cases";
import { exportGedcom, importGedcom } from "./application/gedcom";
import type {
  ChangeRequestDTO,
  PersonDTO,
  PersonProfileDTO,
  TreeDTO,
} from "./application/dtos";
import type {
  AddPersonInput,
  ApproveRelationshipChangeInput,
  EditPersonInput,
  ProposeRelationshipChangeInput,
} from "./application/inputs";

/**
 * Public surface of the Genealogy context (AGENT_CONTRACTS "module factory").
 * All use cases as bound async methods, plus the cross-context producer query
 * methods (`list*Views`).
 */
export interface GenealogyModule {
  addPerson(input: AddPersonInput): Promise<Result<PersonDTO>>;
  editPerson(input: EditPersonInput): Promise<Result<PersonDTO>>;
  proposeRelationshipChange(
    input: ProposeRelationshipChangeInput,
  ): Promise<Result<ChangeRequestDTO>>;
  approveRelationshipChange(
    input: ApproveRelationshipChangeInput,
  ): Promise<Result<ChangeRequestDTO>>;
  getTree(branch?: Branch): Promise<TreeDTO>;
  getPersonProfile(personId: string): Promise<PersonProfileDTO | null>;
  explainRelationship(a: string, b: string): Promise<string>;
  listChangeRequests(): Promise<ChangeRequestDTO[]>;
  importGedcom(
    text: string,
  ): Promise<Result<{ peopleAdded: number; relationshipsAdded: number }>>;
  exportGedcom(): Promise<string>;

  /** Cross-context producer queries (consumed by downstream contexts). */
  listPeopleViews(): Promise<PersonView[]>;
  listRelationshipViews(): Promise<RelationshipView[]>;
}

export function createGenealogyModule(deps: SharedDeps): GenealogyModule {
  const ucDeps: UseCaseDeps = {
    people: new LocalStoragePersonRepository(deps.store),
    relationships: new LocalStorageRelationshipRepository(deps.store),
    changeRequests: new LocalStorageChangeRequestRepository(deps.store),
    ids: deps.ids,
    clock: deps.clock,
  };

  const gedcomDeps = {
    people: ucDeps.people,
    relationships: ucDeps.relationships,
    ids: ucDeps.ids,
  };

  return {
    addPerson: addPerson(ucDeps),
    editPerson: editPerson(ucDeps),
    proposeRelationshipChange: proposeRelationshipChange(ucDeps),
    approveRelationshipChange: approveRelationshipChange(ucDeps),
    getTree: getTree(ucDeps),
    getPersonProfile: getPersonProfile(ucDeps),
    explainRelationship: explainRelationship(ucDeps),
    listChangeRequests: listChangeRequests(ucDeps),
    importGedcom: (text: string) => importGedcom(text, gedcomDeps),
    exportGedcom: () => exportGedcom(gedcomDeps),
    listPeopleViews: listPeopleViews(ucDeps),
    listRelationshipViews: listRelationshipViews(ucDeps),
  };
}
