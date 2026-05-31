import { describe, expect, it } from "vitest";
import { PersonId, RelationshipId } from "@/shared/kernel";
import { Person, type Gender } from "./person";
import { Relationship } from "./relationship";
import { RelationshipPathService } from "./relationship-path-service";

let relSeq = 0;
function person(id: string, gender: Gender = "Unknown"): Person {
  const r = Person.create({
    id: PersonId(id),
    legalName: id,
    gender,
    visibility: "Public",
    branch: "Paternal",
  });
  if (!r.ok) throw new Error("setup");
  return r.value;
}
function parentOf(parent: string, child: string): Relationship {
  relSeq += 1;
  const r = Relationship.create({
    id: RelationshipId(`r${relSeq}`),
    type: "ParentOf",
    from: PersonId(parent),
    to: PersonId(child),
  });
  if (!r.ok) throw new Error("setup");
  return r.value;
}
function spouseOf(a: string, b: string): Relationship {
  relSeq += 1;
  const r = Relationship.create({
    id: RelationshipId(`r${relSeq}`),
    type: "SpouseOf",
    from: PersonId(a),
    to: PersonId(b),
  });
  if (!r.ok) throw new Error("setup");
  return r.value;
}

const explain = (a: string, b: string, people: Person[], rels: Relationship[]) =>
  RelationshipPathService.explain(PersonId(a), PersonId(b), people, rels);

describe("RelationshipPathService.explain", () => {
  it("returns self for the same person", () => {
    const p = [person("a")];
    expect(explain("a", "a", p, [])).toBe("self");
  });

  it("returns no known relationship for unrelated / unknown people", () => {
    const p = [person("a"), person("b")];
    expect(explain("a", "b", p, [])).toBe("no known relationship");
    expect(explain("a", "zzz", p, [])).toBe("no known relationship");
  });

  it("identifies father / mother", () => {
    const people = [person("dad", "Male"), person("mom", "Female"), person("kid")];
    const rels = [parentOf("dad", "kid"), parentOf("mom", "kid")];
    expect(explain("kid", "dad", people, rels)).toBe("father");
    expect(explain("kid", "mom", people, rels)).toBe("mother");
  });

  it("identifies son / daughter", () => {
    const people = [person("dad", "Male"), person("son", "Male"), person("dau", "Female")];
    const rels = [parentOf("dad", "son"), parentOf("dad", "dau")];
    expect(explain("dad", "son", people, rels)).toBe("son");
    expect(explain("dad", "dau", people, rels)).toBe("daughter");
  });

  it("identifies grandfather and grandchild", () => {
    const people = [person("gp", "Male"), person("p"), person("c", "Female")];
    const rels = [parentOf("gp", "p"), parentOf("p", "c")];
    expect(explain("c", "gp", people, rels)).toBe("grandfather");
    expect(explain("gp", "c", people, rels)).toBe("granddaughter");
  });

  it("identifies great-grandparent", () => {
    const people = [person("g3"), person("g2"), person("g1"), person("c")];
    const rels = [parentOf("g3", "g2"), parentOf("g2", "g1"), parentOf("g1", "c")];
    expect(explain("c", "g3", people, rels)).toBe("great-grandparent");
  });

  it("identifies siblings via shared parent", () => {
    const people = [person("p"), person("x", "Male"), person("y", "Female")];
    const rels = [parentOf("p", "x"), parentOf("p", "y")];
    expect(explain("x", "y", people, rels)).toBe("sister");
    expect(explain("y", "x", people, rels)).toBe("brother");
  });

  it("identifies spouse", () => {
    const people = [person("h", "Male"), person("w", "Female")];
    const rels = [spouseOf("h", "w")];
    expect(explain("w", "h", people, rels)).toBe("husband");
    expect(explain("h", "w", people, rels)).toBe("wife");
  });

  it("identifies aunt / uncle and niece / nephew", () => {
    // gp -> parent, gp -> aunt; parent -> me
    const people = [
      person("gp"),
      person("parent"),
      person("aunt", "Female"),
      person("me", "Male"),
    ];
    const rels = [
      parentOf("gp", "parent"),
      parentOf("gp", "aunt"),
      parentOf("parent", "me"),
    ];
    expect(explain("me", "aunt", people, rels)).toBe("aunt");
    expect(explain("aunt", "me", people, rels)).toBe("nephew");
  });

  it("identifies first cousins", () => {
    const people = [
      person("gp"),
      person("p1"),
      person("p2"),
      person("c1"),
      person("c2"),
    ];
    const rels = [
      parentOf("gp", "p1"),
      parentOf("gp", "p2"),
      parentOf("p1", "c1"),
      parentOf("p2", "c2"),
    ];
    expect(explain("c1", "c2", people, rels)).toBe("first cousin");
  });

  it("identifies first cousin once removed", () => {
    const people = [
      person("gp"),
      person("p1"),
      person("p2"),
      person("c1"),
      person("c2"),
      person("c2child"),
    ];
    const rels = [
      parentOf("gp", "p1"),
      parentOf("gp", "p2"),
      parentOf("p1", "c1"),
      parentOf("p2", "c2"),
      parentOf("c2", "c2child"),
    ];
    expect(explain("c1", "c2child", people, rels)).toBe(
      "first cousin once removed",
    );
  });
});
