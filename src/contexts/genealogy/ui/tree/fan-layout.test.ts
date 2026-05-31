import { describe, it, expect } from "vitest";
import type { PersonDTO, TreeDTO } from "../../application/dtos";
import { layoutFan } from "./fan-layout";

function person(id: string, gender: PersonDTO["gender"]): PersonDTO {
  return {
    id,
    legalName: id,
    nickname: null,
    displayName: id,
    gender,
    birth: null,
    passing: null,
    birthplace: null,
    currentLocation: null,
    bio: null,
    visibility: "Public",
    branch: "Paternal",
    isDeceased: false,
    isUnlisted: false,
  };
}

// Focal F married to P; F's parents GF/GM; P's parent PP; F+P have child C.
const tree: TreeDTO = {
  nodes: [
    person("F", "Male"),
    person("P", "Female"),
    person("GF", "Male"),
    person("GM", "Female"),
    person("PP", "Male"),
    person("C", "Female"),
  ],
  edges: [
    { id: "e1", type: "SpouseOf", fromPersonId: "F", toPersonId: "P", qualifier: null },
    { id: "e2", type: "ParentOf", fromPersonId: "GF", toPersonId: "F", qualifier: null },
    { id: "e3", type: "ParentOf", fromPersonId: "GM", toPersonId: "F", qualifier: null },
    { id: "e4", type: "ParentOf", fromPersonId: "PP", toPersonId: "P", qualifier: null },
    { id: "e5", type: "ParentOf", fromPersonId: "F", toPersonId: "C", qualifier: null },
    { id: "e6", type: "ParentOf", fromPersonId: "P", toPersonId: "C", qualifier: null },
  ],
};

describe("layoutFan", () => {
  it("places the focal person and partner at the base ring (generation 0)", () => {
    const layout = layoutFan(tree, { focalId: "F" });
    const focal = layout.nodes.find((n) => n.person.id === "F")!;
    const partner = layout.nodes.find((n) => n.person.id === "P")!;
    expect(focal.role).toBe("focal");
    expect(partner.role).toBe("partner");
    expect(focal.generation).toBe(0);
    expect(partner.generation).toBe(0);
  });

  it("fans ancestors above the trunk and drops children below it", () => {
    const layout = layoutFan(tree, { focalId: "F" });
    const trunkY = layout.trunk.y;
    const gf = layout.nodes.find((n) => n.person.id === "GF")!;
    const child = layout.nodes.find((n) => n.person.id === "C")!;
    expect(gf.role).toBe("ancestor");
    expect(gf.y).toBeLessThan(trunkY); // ancestors are above
    expect(child.role).toBe("child");
    expect(child.y).toBeGreaterThan(trunkY); // children are below
  });

  it("puts the focal's ancestors on the left and the partner's on the right", () => {
    const layout = layoutFan(tree, { focalId: "F" });
    const gf = layout.nodes.find((n) => n.person.id === "GF")!;
    const pp = layout.nodes.find((n) => n.person.id === "PP")!;
    expect(gf.side).toBe("left");
    expect(pp.side).toBe("right");
    expect(gf.x).toBeLessThan(layout.trunk.x);
    expect(pp.x).toBeGreaterThan(layout.trunk.x);
  });

  it("re-roots the fan on a different focal person", () => {
    const layout = layoutFan(tree, { focalId: "C" });
    const c = layout.nodes.find((n) => n.person.id === "C")!;
    expect(c.role).toBe("focal");
    // C's parents (F, P) now fan upward as ancestors.
    const f = layout.nodes.find((n) => n.person.id === "F")!;
    expect(f.role).toBe("ancestor");
    expect(f.y).toBeLessThan(layout.trunk.y);
  });

  it("keeps every node within the computed canvas bounds", () => {
    const layout = layoutFan(tree, { focalId: "F" });
    for (const n of layout.nodes) {
      expect(n.x).toBeGreaterThanOrEqual(0);
      expect(n.x).toBeLessThanOrEqual(layout.width);
      expect(n.y).toBeGreaterThanOrEqual(0);
      expect(n.y).toBeLessThanOrEqual(layout.height);
    }
  });
});
