import type { PersonId } from "@/shared/kernel";
import type { Person, Gender } from "./person";
import type { Relationship } from "./relationship";

/**
 * RelationshipPathService — explains how two people are related
 * (TECHNICAL_DESIGN §4.3, §10.1). A pure domain service: given the full set of
 * people and relationship edges, it derives a human-readable label by walking
 * the graph.
 *
 * Strategy: build parent/child/spouse adjacency, then compute each person's
 * ancestor set with generational distance via BFS over ParentOf edges. The
 * relationship of B relative to A is classified from where their ancestor sets
 * meet (the lowest common ancestor) and the up/down distances — the standard
 * "kinship by common ancestor" algorithm. Spouse and sibling are handled
 * directly; in-laws and step links via spouse hops.
 */

interface Ancestor {
  /** Generations from the start person up to this ancestor (0 = self). */
  depth: number;
}

interface Graph {
  parentsOf: Map<string, Set<string>>;
  childrenOf: Map<string, Set<string>>;
  spousesOf: Map<string, Set<string>>;
  siblingsOf: Map<string, Set<string>>;
}

function buildGraph(relationships: readonly Relationship[]): Graph {
  const parentsOf = new Map<string, Set<string>>();
  const childrenOf = new Map<string, Set<string>>();
  const spousesOf = new Map<string, Set<string>>();
  const siblingsOf = new Map<string, Set<string>>();

  const add = (m: Map<string, Set<string>>, k: string, v: string): void => {
    const set = m.get(k) ?? new Set<string>();
    set.add(v);
    m.set(k, set);
  };

  for (const rel of relationships) {
    const from = rel.from as string;
    const to = rel.to as string;
    switch (rel.type) {
      case "ParentOf":
        add(parentsOf, to, from);
        add(childrenOf, from, to);
        break;
      case "SpouseOf":
        add(spousesOf, from, to);
        add(spousesOf, to, from);
        break;
      case "SiblingOf":
        add(siblingsOf, from, to);
        add(siblingsOf, to, from);
        break;
    }
  }

  // Derive siblings from shared parents (siblings are derived where possible).
  for (const [, kids] of childrenOf) {
    const arr = Array.from(kids);
    for (const a of arr) {
      for (const b of arr) {
        if (a !== b) add(siblingsOf, a, b);
      }
    }
  }

  return { parentsOf, childrenOf, spousesOf, siblingsOf };
}

/** Map of ancestorId -> nearest depth, including the person itself at depth 0. */
function ancestors(graph: Graph, start: string): Map<string, Ancestor> {
  const result = new Map<string, Ancestor>([[start, { depth: 0 }]]);
  const queue: Array<{ id: string; depth: number }> = [{ id: start, depth: 0 }];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) break;
    const parents = graph.parentsOf.get(node.id);
    if (!parents) continue;
    for (const parent of parents) {
      const existing = result.get(parent);
      if (existing === undefined || node.depth + 1 < existing.depth) {
        result.set(parent, { depth: node.depth + 1 });
        queue.push({ id: parent, depth: node.depth + 1 });
      }
    }
  }
  return result;
}

const NO_RELATION = "no known relationship";

function genderOf(people: Map<string, Person>, id: PersonId): Gender {
  return people.get(id as string)?.gender ?? "Unknown";
}

function gendered(gender: Gender, male: string, female: string, neutral: string): string {
  if (gender === "Male") return male;
  if (gender === "Female") return female;
  return neutral;
}

/** Ordinal-ish prefix for ancestor/descendant chains (great-great-…). */
function greats(distance: number): string {
  // distance: 2 = grand, 3 = great-grand, 4 = great-great-grand, …
  if (distance < 2) return "";
  if (distance === 2) return "grand";
  return `${"great-".repeat(distance - 2)}grand`;
}

function ordinal(n: number): string {
  const labels = ["zeroth", "first", "second", "third", "fourth", "fifth"];
  return labels[n] ?? `${n}th`;
}

export const RelationshipPathService = {
  /**
   * Returns a human-readable label for how `b` is related to `a`
   * (i.e. "B is A's ___"). Implements self, spouse, parent/child,
   * grandparent/grandchild (and greater), sibling, aunt/uncle, niece/nephew,
   * and cousins (with degree + removal). Falls back to {@link NO_RELATION}.
   */
  explain(
    a: PersonId,
    b: PersonId,
    people: readonly Person[],
    relationships: readonly Relationship[],
  ): string {
    const byId = new Map(people.map((p) => [p.id as string, p]));
    const aId = a as string;
    const bId = b as string;

    if (!byId.has(aId) || !byId.has(bId)) return NO_RELATION;
    if (aId === bId) return "self";

    const graph = buildGraph(relationships);
    const bGender = genderOf(byId, b);

    // Spouse.
    if (graph.spousesOf.get(aId)?.has(bId)) {
      return gendered(bGender, "husband", "wife", "spouse");
    }

    // Direct sibling (explicit or via shared parent).
    if (graph.siblingsOf.get(aId)?.has(bId)) {
      return gendered(bGender, "brother", "sister", "sibling");
    }

    const ancA = ancestors(graph, aId);
    const ancB = ancestors(graph, bId);

    // B is a direct ancestor of A (parent, grandparent, …).
    const bAsAncestorOfA = ancA.get(bId);
    if (bAsAncestorOfA && bAsAncestorOfA.depth > 0) {
      const d = bAsAncestorOfA.depth;
      if (d === 1) return gendered(bGender, "father", "mother", "parent");
      const g = greats(d);
      return gendered(bGender, `${g}father`, `${g}mother`, `${g}parent`);
    }

    // B is a direct descendant of A (child, grandchild, …).
    const aAsAncestorOfB = ancB.get(aId);
    if (aAsAncestorOfB && aAsAncestorOfB.depth > 0) {
      const d = aAsAncestorOfB.depth;
      if (d === 1) return gendered(bGender, "son", "daughter", "child");
      const g = greats(d);
      return gendered(bGender, `${g}son`, `${g}daughter`, `${g}grandchild`);
    }

    // Find the lowest common ancestor: minimise (depthA + depthB).
    let best: { up: number; down: number } | null = null;
    for (const [ancId, infoA] of ancA) {
      const infoB = ancB.get(ancId);
      if (!infoB) continue;
      const candidate = { up: infoA.depth, down: infoB.depth };
      if (
        best === null ||
        candidate.up + candidate.down < best.up + best.down
      ) {
        best = candidate;
      }
    }

    if (best === null || best.up === 0 || best.down === 0) {
      return NO_RELATION;
    }

    const { up, down } = best;

    // up=1 means A's parent is the common ancestor.
    // (up=1, down=1) => sibling (already handled, but keep as fallback).
    if (up === 1 && down === 1) {
      return gendered(bGender, "brother", "sister", "sibling");
    }

    // Aunt/Uncle: A's parent's sibling line — B is one generation up from A's
    // level relative to the common ancestor (up > down, down === 1).
    if (down === 1 && up >= 2) {
      const greatPrefix = up >= 3 ? `${"great-".repeat(up - 2)}` : "";
      const grand = up >= 3 ? "grand" : "";
      return gendered(
        bGender,
        `${greatPrefix}${grand}uncle`,
        `${greatPrefix}${grand}aunt`,
        `${greatPrefix}${grand}aunt or uncle`,
      );
    }

    // Niece/Nephew: mirror of aunt/uncle (up === 1, down >= 2).
    if (up === 1 && down >= 2) {
      const greatPrefix = down >= 3 ? `${"great-".repeat(down - 2)}` : "";
      const grand = down >= 3 ? "grand" : "";
      return gendered(
        bGender,
        `${greatPrefix}${grand}nephew`,
        `${greatPrefix}${grand}niece`,
        `${greatPrefix}${grand}niece or nephew`,
      );
    }

    // Cousins: both up >= 2 and down >= 2.
    const degree = Math.min(up, down) - 1;
    const removal = Math.abs(up - down);
    let label = `${ordinal(degree)} cousin`;
    if (removal === 1) label += " once removed";
    else if (removal === 2) label += " twice removed";
    else if (removal > 2) label += ` ${removal} times removed`;
    return label;
  },
};
