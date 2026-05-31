import { describe, expect, it } from "vitest";
import type { TreeDTO, PersonDTO } from "../../application/dtos";
import { layoutPedigree } from "./pedigree-layout";

function person(id: string, over: Partial<PersonDTO> = {}): PersonDTO {
  return {
    id,
    legalName: id,
    nickname: null,
    displayName: id,
    gender: "Unknown",
    birth: null,
    passing: null,
    birthplace: null,
    currentLocation: null,
    bio: null,
    visibility: "Public",
    branch: "Maternal",
    isDeceased: false,
    isUnlisted: false,
    photoUrl: null,
    ...over,
  };
}

// focal F + spouse S; F's parents M(father)+N; F+S child C.
const tree: TreeDTO = {
  nodes: [
    person("F"),
    person("S"),
    person("M", { gender: "Male", branch: "Paternal" }),
    person("N", { gender: "Female" }),
    person("C"),
  ],
  edges: [
    { id: "e1", type: "SpouseOf", fromPersonId: "F", toPersonId: "S", qualifier: null },
    { id: "e2", type: "ParentOf", fromPersonId: "M", toPersonId: "F", qualifier: null },
    { id: "e3", type: "ParentOf", fromPersonId: "N", toPersonId: "F", qualifier: null },
    { id: "e4", type: "ParentOf", fromPersonId: "F", toPersonId: "C", qualifier: null },
    { id: "e5", type: "ParentOf", fromPersonId: "S", toPersonId: "C", qualifier: null },
  ],
};

describe("layoutPedigree", () => {
  it("places focal and partner in generation-0 row", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    expect(l.focalId).toBe("F");
    expect(l.partnerId).toBe("S");
    const row0 = l.rows.find((r) => r.generation === 0)!;
    expect(row0.nodes.map((n) => n.person.id).sort()).toEqual(["F", "S"]);
    expect(row0.nodes.find((n) => n.person.id === "F")!.role).toBe("focal");
    expect(row0.nodes.find((n) => n.person.id === "S")!.role).toBe("partner");
  });

  it("places parents in generation 1 with fathers first", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    const row1 = l.rows.find((r) => r.generation === 1)!;
    expect(row1.nodes.map((n) => n.person.id)).toEqual(["M", "N"]);
    expect(row1.nodes[0]!.role).toBe("ancestor");
  });

  it("places children in the bottom row (generation -1)", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    const kids = l.rows.find((r) => r.generation === -1)!;
    expect(kids.nodes.map((n) => n.person.id)).toEqual(["C"]);
    expect(kids.nodes[0]!.role).toBe("child");
  });

  it("orders rows oldest ancestors at the top, children at the bottom", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    expect(l.rows.map((r) => r.generation)).toEqual([1, 0, -1]);
  });

  it("re-roots on a different person", () => {
    const l = layoutPedigree(tree, { focalId: "C" });
    expect(l.focalId).toBe("C");
    expect(l.partnerId).toBeNull();
    const row1 = l.rows.find((r) => r.generation === 1)!;
    expect(row1.nodes.map((n) => n.person.id).sort()).toEqual(["F", "S"]);
  });

  it("handles a focal person with no spouse and no relations", () => {
    const lone: TreeDTO = { nodes: [person("X")], edges: [] };
    const l = layoutPedigree(lone, { focalId: "X" });
    expect(l.partnerId).toBeNull();
    expect(l.rows).toEqual([
      { generation: 0, nodes: [expect.objectContaining({ person: expect.objectContaining({ id: "X" }) })] },
    ]);
  });
});
