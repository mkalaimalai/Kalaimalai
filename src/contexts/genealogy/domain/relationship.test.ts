import { describe, expect, it } from "vitest";
import { PersonId, RelationshipId } from "@/shared/kernel";
import { Relationship } from "./relationship";

const base = {
  id: RelationshipId("r1"),
  type: "ParentOf" as const,
  from: PersonId("parent"),
  to: PersonId("child"),
};

describe("Relationship.create", () => {
  it("creates a valid edge", () => {
    const r = Relationship.create(base);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.from).toBe(PersonId("parent"));
    expect(r.value.to).toBe(PersonId("child"));
  });

  it("rejects a self-edge", () => {
    const r = Relationship.create({ ...base, to: PersonId("parent") });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("RELATIONSHIP_SELF_EDGE");
  });

  it("accepts a valid qualifier", () => {
    const r = Relationship.create({ ...base, qualifier: "adoption" });
    expect(r.ok && r.value.qualifier).toBe("adoption");
  });

  it("connects ignores direction", () => {
    const r = Relationship.create(base);
    if (!r.ok) throw new Error("setup");
    expect(r.value.connects(PersonId("child"), PersonId("parent"))).toBe(true);
    expect(r.value.connects(PersonId("parent"), PersonId("other"))).toBe(false);
  });
});
