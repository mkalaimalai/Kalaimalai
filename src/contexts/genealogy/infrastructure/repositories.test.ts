import { describe, expect, it } from "vitest";
import {
  ApproximateDate,
  ChangeRequestId,
  PersonId,
  RelationshipId,
} from "@/shared/kernel";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { Person } from "../domain/person";
import { Relationship } from "../domain/relationship";
import { RelationshipChangeRequest } from "../domain/relationship-change-request";
import { LocalStoragePersonRepository } from "./person-repository";
import { LocalStorageRelationshipRepository } from "./relationship-repository";
import { LocalStorageChangeRequestRepository } from "./change-request-repository";

function makePerson(id: string) {
  const r = Person.create({
    id: PersonId(id),
    legalName: "Asha",
    nickname: "Ash",
    gender: "Female",
    birth: ApproximateDate.day(1990, 5, 4),
    visibility: "Restricted",
    branch: "Maternal",
  });
  if (!r.ok) throw new Error("setup");
  return r.value;
}

describe("LocalStoragePersonRepository", () => {
  it("persists and reloads a person via a fresh repo over the same store", async () => {
    const store = new InMemoryKeyValueStore();
    const repo1 = new LocalStoragePersonRepository(store);
    await repo1.save(makePerson("p1"));

    const repo2 = new LocalStoragePersonRepository(store);
    const loaded = await repo2.get(PersonId("p1"));
    expect(loaded?.legalName).toBe("Asha");
    expect(loaded?.nickname).toBe("Ash");
    expect(loaded?.birth?.day).toBe(4);
    expect(loaded?.visibility).toBe("Restricted");
    expect((await repo2.list()).length).toBe(1);
  });

  it("deletes a person", async () => {
    const store = new InMemoryKeyValueStore();
    const repo = new LocalStoragePersonRepository(store);
    await repo.save(makePerson("p1"));
    await repo.delete(PersonId("p1"));
    expect(await repo.get(PersonId("p1"))).toBeNull();
  });
});

describe("LocalStorageRelationshipRepository", () => {
  it("persists and reloads a relationship", async () => {
    const store = new InMemoryKeyValueStore();
    const r = Relationship.create({
      id: RelationshipId("r1"),
      type: "ParentOf",
      from: PersonId("a"),
      to: PersonId("b"),
      qualifier: "adoption",
    });
    if (!r.ok) throw new Error("setup");
    await new LocalStorageRelationshipRepository(store).save(r.value);

    const loaded = await new LocalStorageRelationshipRepository(store).get("r1");
    expect(loaded?.type).toBe("ParentOf");
    expect(loaded?.qualifier).toBe("adoption");
    expect(loaded?.from).toBe(PersonId("a"));
  });
});

describe("LocalStorageChangeRequestRepository", () => {
  it("persists and reloads a change request with state", async () => {
    const store = new InMemoryKeyValueStore();
    const proposed = RelationshipChangeRequest.propose({
      id: ChangeRequestId("cr1"),
      proposedBy: PersonId("u1"),
      edit: {
        action: "add",
        type: "SpouseOf",
        from: PersonId("a"),
        to: PersonId("b"),
      },
    });
    if (!proposed.ok) throw new Error("setup");
    const approved = proposed.value.approve();
    if (!approved.ok) throw new Error("setup");
    await new LocalStorageChangeRequestRepository(store).save(approved.value);

    const loaded = await new LocalStorageChangeRequestRepository(store).get("cr1");
    expect(loaded?.state).toBe("Approved");
    expect(loaded?.edit.type).toBe("SpouseOf");
  });
});
