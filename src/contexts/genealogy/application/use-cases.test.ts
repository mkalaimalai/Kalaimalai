import { beforeEach, describe, expect, it } from "vitest";
import { SequentialIdGenerator } from "@/shared/ports";
import { FixedClock } from "@/shared/ports";
import {
  FakeChangeRequestRepository,
  FakePersonRepository,
  FakeRelationshipRepository,
} from "./fakes";
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
} from "./use-cases";
import type { AddPersonInput } from "./inputs";

function makeDeps(): UseCaseDeps {
  return {
    people: new FakePersonRepository(),
    relationships: new FakeRelationshipRepository(),
    changeRequests: new FakeChangeRequestRepository(),
    ids: new SequentialIdGenerator("g"),
    clock: new FixedClock(Date.UTC(2026, 4, 31)),
  };
}

const personInput = (over: Partial<AddPersonInput> = {}): AddPersonInput => ({
  legalName: "Test Person",
  gender: "Unknown",
  visibility: "Public",
  branch: "Maternal",
  ...over,
});

describe("addPerson", () => {
  it("creates and persists a person", async () => {
    const deps = makeDeps();
    const r = await addPerson(deps)(personInput({ legalName: "Asha" }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.legalName).toBe("Asha");
    expect((await deps.people.list()).length).toBe(1);
  });

  it("rejects an empty name", async () => {
    const deps = makeDeps();
    const r = await addPerson(deps)(personInput({ legalName: "" }));
    expect(r.ok).toBe(false);
  });
});

describe("editPerson", () => {
  it("updates an existing person", async () => {
    const deps = makeDeps();
    const created = await addPerson(deps)(personInput());
    if (!created.ok) throw new Error("setup");
    const r = await editPerson(deps)({
      id: created.value.id,
      currentLocation: "Chennai",
    });
    expect(r.ok && r.value.currentLocation).toBe("Chennai");
  });

  it("fails for an unknown person", async () => {
    const deps = makeDeps();
    const r = await editPerson(deps)({ id: "nope" });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("PERSON_NOT_FOUND");
  });
});

describe("relationship change proposals", () => {
  async function seedTwo(deps: UseCaseDeps) {
    const a = await addPerson(deps)(personInput({ legalName: "A" }));
    const b = await addPerson(deps)(personInput({ legalName: "B" }));
    if (!a.ok || !b.ok) throw new Error("setup");
    return { a: a.value, b: b.value };
  }

  it("proposes a pending change", async () => {
    const deps = makeDeps();
    const { a, b } = await seedTwo(deps);
    const r = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: a.id,
      toPersonId: b.id,
      proposedBy: a.id,
    });
    expect(r.ok && r.value.state).toBe("Pending");
    expect((await listChangeRequests(deps)()).length).toBe(1);
    // No relationship created yet — it is only a proposal.
    expect((await deps.relationships.list()).length).toBe(0);
  });

  it("non-admin cannot approve", async () => {
    const deps = makeDeps();
    const { a, b } = await seedTwo(deps);
    const proposed = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: a.id,
      toPersonId: b.id,
      proposedBy: a.id,
    });
    if (!proposed.ok) throw new Error("setup");
    const r = await approveRelationshipChange(deps)({
      changeRequestId: proposed.value.id,
      actorRole: "Member",
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("NOT_AUTHORIZED");
  });

  it("admin approval applies the edge", async () => {
    const deps = makeDeps();
    const { a, b } = await seedTwo(deps);
    const proposed = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: a.id,
      toPersonId: b.id,
      proposedBy: a.id,
    });
    if (!proposed.ok) throw new Error("setup");
    const r = await approveRelationshipChange(deps)({
      changeRequestId: proposed.value.id,
      actorRole: "Admin",
    });
    expect(r.ok && r.value.state).toBe("Approved");
    const rels = await deps.relationships.list();
    expect(rels.length).toBe(1);
    expect(rels[0]?.type).toBe("ParentOf");
  });

  it("admin approval of a remove deletes the edge", async () => {
    const deps = makeDeps();
    const { a, b } = await seedTwo(deps);
    // First add an edge via approval.
    const add = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: a.id,
      toPersonId: b.id,
      proposedBy: a.id,
    });
    if (!add.ok) throw new Error("setup");
    await approveRelationshipChange(deps)({
      changeRequestId: add.value.id,
      actorRole: "Admin",
    });
    const relId = (await deps.relationships.list())[0]?.id as string;
    const remove = await proposeRelationshipChange(deps)({
      action: "remove",
      type: "ParentOf",
      fromPersonId: a.id,
      toPersonId: b.id,
      relationshipId: relId,
      proposedBy: a.id,
    });
    if (!remove.ok) throw new Error("setup");
    await approveRelationshipChange(deps)({
      changeRequestId: remove.value.id,
      actorRole: "Admin",
    });
    expect((await deps.relationships.list()).length).toBe(0);
  });
});

describe("getTree", () => {
  it("returns nodes and edges, filtered by branch", async () => {
    const deps = makeDeps();
    const m = await addPerson(deps)(personInput({ legalName: "M", branch: "Maternal" }));
    const p = await addPerson(deps)(personInput({ legalName: "P", branch: "Paternal" }));
    if (!m.ok || !p.ok) throw new Error("setup");
    const all = await getTree(deps)();
    expect(all.nodes.length).toBe(2);
    const maternal = await getTree(deps)("Maternal");
    expect(maternal.nodes.length).toBe(1);
    expect(maternal.nodes[0]?.legalName).toBe("M");
  });

  it("excludes edges whose endpoints are filtered out", async () => {
    const deps = makeDeps();
    const m = await addPerson(deps)(personInput({ legalName: "M", branch: "Maternal" }));
    const p = await addPerson(deps)(personInput({ legalName: "P", branch: "Paternal" }));
    if (!m.ok || !p.ok) throw new Error("setup");
    const prop = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: m.value.id,
      toPersonId: p.value.id,
      proposedBy: m.value.id,
    });
    if (!prop.ok) throw new Error("setup");
    await approveRelationshipChange(deps)({
      changeRequestId: prop.value.id,
      actorRole: "Admin",
    });
    const maternal = await getTree(deps)("Maternal");
    expect(maternal.edges.length).toBe(0); // p is filtered out
    const all = await getTree(deps)();
    expect(all.edges.length).toBe(1);
  });
});

describe("getPersonProfile & explainRelationship", () => {
  it("resolves relationships with relation labels", async () => {
    const deps = makeDeps();
    const dad = await addPerson(deps)(personInput({ legalName: "Dad", gender: "Male" }));
    const kid = await addPerson(deps)(personInput({ legalName: "Kid", gender: "Female" }));
    if (!dad.ok || !kid.ok) throw new Error("setup");
    const prop = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: dad.value.id,
      toPersonId: kid.value.id,
      proposedBy: dad.value.id,
    });
    if (!prop.ok) throw new Error("setup");
    await approveRelationshipChange(deps)({
      changeRequestId: prop.value.id,
      actorRole: "Admin",
    });

    const profile = await getPersonProfile(deps)(kid.value.id);
    expect(profile).not.toBeNull();
    expect(profile?.relationships.length).toBe(1);
    expect(profile?.relationships[0]?.relation).toBe("father");

    const label = await explainRelationship(deps)(kid.value.id, dad.value.id);
    expect(label).toBe("father");
  });

  it("returns null for an unknown person", async () => {
    const deps = makeDeps();
    expect(await getPersonProfile(deps)("missing")).toBeNull();
  });
});

describe("producer view methods", () => {
  it("maps people and relationships to view shapes", async () => {
    const deps = makeDeps();
    const a = await addPerson(deps)(personInput({ legalName: "A", gender: "Male" }));
    const b = await addPerson(deps)(personInput({ legalName: "B" }));
    if (!a.ok || !b.ok) throw new Error("setup");
    const prop = await proposeRelationshipChange(deps)({
      action: "add",
      type: "ParentOf",
      fromPersonId: a.value.id,
      toPersonId: b.value.id,
      proposedBy: a.value.id,
    });
    if (!prop.ok) throw new Error("setup");
    await approveRelationshipChange(deps)({
      changeRequestId: prop.value.id,
      actorRole: "Admin",
    });
    const peopleViews = await listPeopleViews(deps)();
    expect(peopleViews.length).toBe(2);
    expect(peopleViews[0]).toHaveProperty("displayName");
    expect(peopleViews[0]).toHaveProperty("isUnlisted");
    const relViews = await listRelationshipViews(deps)();
    expect(relViews.length).toBe(1);
    expect(relViews[0]?.type).toBe("ParentOf");
  });
});
