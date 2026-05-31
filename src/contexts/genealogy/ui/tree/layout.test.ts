import { describe, expect, it } from "vitest";
import type { PersonDTO, RelationshipDTO, TreeDTO } from "../../application/dtos";
import { layoutTree } from "./layout";

let nodeSeq = 0;
function node(id: string, over: Partial<PersonDTO> = {}): PersonDTO {
  nodeSeq += 1;
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
    branch: "Paternal",
    isDeceased: false,
    isUnlisted: false,
    ...over,
  };
}
function parentEdge(id: string, parent: string, child: string): RelationshipDTO {
  return {
    id,
    type: "ParentOf",
    fromPersonId: parent,
    toPersonId: child,
    qualifier: null,
  };
}
function spouseEdge(id: string, a: string, b: string): RelationshipDTO {
  return { id, type: "SpouseOf", fromPersonId: a, toPersonId: b, qualifier: null };
}

const find = (l: ReturnType<typeof layoutTree>, id: string) =>
  l.nodes.find((n) => n.person.id === id);

describe("layoutTree generations", () => {
  it("places a single root at generation 0", () => {
    const tree: TreeDTO = { nodes: [node("a")], edges: [] };
    const l = layoutTree(tree);
    expect(find(l, "a")?.generation).toBe(0);
    expect(find(l, "a")?.y).toBe(0);
  });

  it("places a child one generation below its parent", () => {
    const tree: TreeDTO = {
      nodes: [node("p"), node("c")],
      edges: [parentEdge("e1", "p", "c")],
    };
    const l = layoutTree(tree);
    expect(find(l, "p")?.generation).toBe(0);
    expect(find(l, "c")?.generation).toBe(1);
    expect(find(l, "c")!.y).toBeGreaterThan(find(l, "p")!.y);
  });

  it("uses the longest path for generation (grandparent → grandchild = 2)", () => {
    const tree: TreeDTO = {
      nodes: [node("gp"), node("p"), node("c")],
      edges: [parentEdge("e1", "gp", "p"), parentEdge("e2", "p", "c")],
    };
    const l = layoutTree(tree);
    expect(find(l, "gp")?.generation).toBe(0);
    expect(find(l, "p")?.generation).toBe(1);
    expect(find(l, "c")?.generation).toBe(2);
  });

  it("aligns spouses to the same generation", () => {
    // a is a root; b is a's spouse but also has a parent → would be gen 1.
    const tree: TreeDTO = {
      nodes: [node("a"), node("b"), node("bParent")],
      edges: [parentEdge("e1", "bParent", "b"), spouseEdge("e2", "a", "b")],
    };
    const l = layoutTree(tree);
    expect(find(l, "a")?.generation).toBe(find(l, "b")?.generation);
    expect(find(l, "b")?.generation).toBe(1);
  });
});

describe("layoutTree edges & geometry", () => {
  it("emits a parent edge from parent bottom to child top", () => {
    const tree: TreeDTO = {
      nodes: [node("p"), node("c")],
      edges: [parentEdge("e1", "p", "c")],
    };
    const l = layoutTree(tree);
    const edge = l.edges.find((e) => e.id === "e1");
    expect(edge?.kind).toBe("parent");
    expect(edge!.toY).toBeGreaterThan(edge!.fromY);
  });

  it("classifies a spouse edge", () => {
    const tree: TreeDTO = {
      nodes: [node("a"), node("b")],
      edges: [spouseEdge("e1", "a", "b")],
    };
    const l = layoutTree(tree);
    expect(l.edges.find((e) => e.id === "e1")?.kind).toBe("spouse");
  });

  it("drops edges with a missing endpoint", () => {
    const tree: TreeDTO = {
      nodes: [node("a")],
      edges: [parentEdge("e1", "a", "ghost")],
    };
    const l = layoutTree(tree);
    expect(l.edges.length).toBe(0);
  });

  it("reports positive width and height for a populated tree", () => {
    const tree: TreeDTO = {
      nodes: [node("p"), node("c1"), node("c2")],
      edges: [parentEdge("e1", "p", "c1"), parentEdge("e2", "p", "c2")],
    };
    const l = layoutTree(tree);
    expect(l.width).toBeGreaterThan(0);
    expect(l.height).toBeGreaterThan(0);
    // Two children share a row → distinct columns / x positions.
    expect(find(l, "c1")!.x).not.toBe(find(l, "c2")!.x);
  });

  it("handles an empty tree", () => {
    const l = layoutTree({ nodes: [], edges: [] });
    expect(l.nodes.length).toBe(0);
    expect(l.height).toBe(0);
  });
});
