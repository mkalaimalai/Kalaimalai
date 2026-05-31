import {
  ApproximateDate,
  Branch,
  PersonId,
  RelationshipId,
  ChangeRequestId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import type { Clock, IdGenerator } from "@/shared/ports";
import type { PersonView, RelationshipView } from "@/shared/views";
import { Person, type PersonChanges } from "../domain/person";
import { Relationship } from "../domain/relationship";
import { RelationshipChangeRequest } from "../domain/relationship-change-request";
import { RelationshipPathService } from "../domain/relationship-path-service";
import type {
  ChangeRequestRepository,
  PersonRepository,
  RelationshipRepository,
} from "./ports";
import type {
  AddPersonInput,
  ApproveRelationshipChangeInput,
  EditPersonInput,
  ProposeRelationshipChangeInput,
} from "./inputs";
import type {
  ChangeRequestDTO,
  PersonDTO,
  PersonProfileDTO,
  RelationshipDTO,
  ResolvedRelationshipDTO,
  TreeDTO,
} from "./dtos";
import {
  toChangeRequestDTO,
  toPersonDTO,
  toPersonView,
  toRelationshipDTO,
  toRelationshipView,
} from "./mappers";

export interface UseCaseDeps {
  people: PersonRepository;
  relationships: RelationshipRepository;
  changeRequests: ChangeRequestRepository;
  ids: IdGenerator;
  clock: Clock;
}

function dateFromJSON(
  json: { year: number; month: number | null; day: number | null } | null | undefined,
): ApproximateDate | undefined {
  if (!json) return undefined;
  return ApproximateDate.fromJSON(json);
}

// ── AddPerson ───────────────────────────────────────────────────────────────
export function addPerson(deps: UseCaseDeps) {
  return async (input: AddPersonInput): Promise<Result<PersonDTO>> => {
    if (!Branch.is(input.branch)) {
      return fail("BRANCH_INVALID", `Invalid branch: ${input.branch}.`);
    }
    const created = Person.create({
      id: PersonId(deps.ids.next()),
      legalName: input.legalName,
      nickname: input.nickname,
      gender: input.gender,
      birth: dateFromJSON(input.birth),
      passing: dateFromJSON(input.passing),
      birthplace: input.birthplace,
      currentLocation: input.currentLocation,
      bio: input.bio,
      photoUrl: input.photoUrl,
      visibility: input.visibility,
      branch: input.branch,
    });
    if (!created.ok) return created;
    await deps.people.save(created.value);
    return ok(toPersonDTO(created.value));
  };
}

// ── EditPerson ────────────────────────────────────────────────────────────--
export function editPerson(deps: UseCaseDeps) {
  return async (input: EditPersonInput): Promise<Result<PersonDTO>> => {
    const existing = await deps.people.get(PersonId(input.id));
    if (!existing) {
      return fail("PERSON_NOT_FOUND", `No person with id ${input.id}.`);
    }
    const changes: PersonChanges = {};
    if (input.legalName !== undefined) changes.legalName = input.legalName;
    if (input.nickname !== undefined)
      changes.nickname = input.nickname ?? undefined;
    if (input.gender !== undefined) changes.gender = input.gender;
    if (input.birth !== undefined) changes.birth = dateFromJSON(input.birth);
    if (input.passing !== undefined)
      changes.passing = dateFromJSON(input.passing);
    if (input.birthplace !== undefined)
      changes.birthplace = input.birthplace ?? undefined;
    if (input.currentLocation !== undefined)
      changes.currentLocation = input.currentLocation ?? undefined;
    if (input.bio !== undefined) changes.bio = input.bio ?? undefined;
    if (input.photoUrl !== undefined)
      changes.photoUrl = input.photoUrl ?? undefined;
    if (input.visibility !== undefined) changes.visibility = input.visibility;
    if (input.branch !== undefined) {
      if (!Branch.is(input.branch)) {
        return fail("BRANCH_INVALID", `Invalid branch: ${input.branch}.`);
      }
      changes.branch = input.branch;
    }
    const updated = existing.withChanges(changes);
    if (!updated.ok) return updated;
    await deps.people.save(updated.value);
    return ok(toPersonDTO(updated.value));
  };
}

// ── ProposeRelationshipChange ─────────────────────────────────────────────--
export function proposeRelationshipChange(deps: UseCaseDeps) {
  return async (
    input: ProposeRelationshipChangeInput,
  ): Promise<Result<ChangeRequestDTO>> => {
    const from = await deps.people.get(PersonId(input.fromPersonId));
    const to = await deps.people.get(PersonId(input.toPersonId));
    if (!from || !to) {
      return fail(
        "PERSON_NOT_FOUND",
        "Both people in a relationship proposal must exist.",
      );
    }
    const proposed = RelationshipChangeRequest.propose({
      id: ChangeRequestId(deps.ids.next()),
      proposedBy: PersonId(input.proposedBy),
      edit: {
        action: input.action,
        type: input.type,
        from: PersonId(input.fromPersonId),
        to: PersonId(input.toPersonId),
        qualifier: input.qualifier,
        relationshipId: input.relationshipId
          ? RelationshipId(input.relationshipId)
          : undefined,
      },
    });
    if (!proposed.ok) return proposed;
    await deps.changeRequests.save(proposed.value);
    return ok(toChangeRequestDTO(proposed.value));
  };
}

// ── ApproveRelationshipChange (Admin only) ────────────────────────────────--
export function approveRelationshipChange(deps: UseCaseDeps) {
  return async (
    input: ApproveRelationshipChangeInput,
  ): Promise<Result<ChangeRequestDTO>> => {
    if (input.actorRole !== "Admin") {
      return fail(
        "NOT_AUTHORIZED",
        "Only an Admin may approve structural tree changes.",
      );
    }
    const request = await deps.changeRequests.get(input.changeRequestId);
    if (!request) {
      return fail(
        "CHANGE_REQUEST_NOT_FOUND",
        `No change request with id ${input.changeRequestId}.`,
      );
    }
    const approved = request.approve();
    if (!approved.ok) return approved;

    // Apply the structural edit now that it is approved.
    const { edit } = approved.value;
    if (edit.action === "add") {
      const rel = Relationship.create({
        id: RelationshipId(deps.ids.next()),
        type: edit.type,
        from: edit.from,
        to: edit.to,
        qualifier: edit.qualifier,
      });
      if (!rel.ok) return rel;
      await deps.relationships.save(rel.value);
    } else if (edit.relationshipId) {
      await deps.relationships.delete(edit.relationshipId as string);
    }

    await deps.changeRequests.save(approved.value);
    return ok(toChangeRequestDTO(approved.value));
  };
}

// ── GetTree ───────────────────────────────────────────────────────────────--
export function getTree(deps: UseCaseDeps) {
  return async (branch?: Branch): Promise<TreeDTO> => {
    const allPeople = await deps.people.list();
    const allRels = await deps.relationships.list();
    const people = branch
      ? allPeople.filter((p) => p.branch === branch)
      : allPeople;
    const includedIds = new Set(people.map((p) => p.id as string));
    const edges = allRels.filter(
      (r) =>
        includedIds.has(r.from as string) && includedIds.has(r.to as string),
    );
    return {
      nodes: people.map(toPersonDTO),
      edges: edges.map(toRelationshipDTO),
    };
  };
}

// ── GetPersonProfile ──────────────────────────────────────────────────────--
export function getPersonProfile(deps: UseCaseDeps) {
  return async (personId: string): Promise<PersonProfileDTO | null> => {
    const subject = await deps.people.get(PersonId(personId));
    if (!subject) return null;
    const allPeople = await deps.people.list();
    const allRels = await deps.relationships.list();
    const byId = new Map(allPeople.map((p) => [p.id as string, p]));

    const resolved: ResolvedRelationshipDTO[] = [];
    for (const rel of allRels) {
      const fromId = rel.from as string;
      const toId = rel.to as string;
      if (fromId !== personId && toId !== personId) continue;
      const otherId = fromId === personId ? toId : fromId;
      const other = byId.get(otherId);
      if (!other) continue;
      resolved.push({
        relationship: toRelationshipDTO(rel),
        relation: RelationshipPathService.explain(
          subject.id,
          other.id,
          allPeople,
          allRels,
        ),
        person: toPersonDTO(other),
      });
    }
    return { person: toPersonDTO(subject), relationships: resolved };
  };
}

// ── ExplainRelationship ───────────────────────────────────────────────────--
export function explainRelationship(deps: UseCaseDeps) {
  return async (a: string, b: string): Promise<string> => {
    const people = await deps.people.list();
    const relationships = await deps.relationships.list();
    return RelationshipPathService.explain(
      PersonId(a),
      PersonId(b),
      people,
      relationships,
    );
  };
}

// ── Producer query methods (cross-context views) ──────────────────────────--
export function listPeopleViews(deps: UseCaseDeps) {
  return async (): Promise<PersonView[]> =>
    (await deps.people.list()).map(toPersonView);
}

export function listRelationshipViews(deps: UseCaseDeps) {
  return async (): Promise<RelationshipView[]> =>
    (await deps.relationships.list()).map(toRelationshipView);
}

// ── Listing change requests (for Admin review UI) ─────────────────────────--
export function listChangeRequests(deps: UseCaseDeps) {
  return async (): Promise<ChangeRequestDTO[]> =>
    (await deps.changeRequests.list()).map(toChangeRequestDTO);
}

export { type RelationshipDTO };
