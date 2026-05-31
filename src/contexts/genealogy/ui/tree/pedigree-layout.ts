import type { PersonDTO, TreeDTO } from "../../application/dtos";

/**
 * Pure generational layout for the photo family tree. Produces ordered rows —
 * oldest ancestors at the top, the focal couple in the middle (generation 0),
 * and children at the bottom (generation -1). Deterministic so the view stays a
 * thin renderer and this can be unit-tested.
 */

export type PedigreeRole = "focal" | "partner" | "ancestor" | "child";

export interface PedigreeNode {
  person: PersonDTO;
  role: PedigreeRole;
  /** 0 = focal couple, 1 = parents, 2 = grandparents…; children = -1. */
  generation: number;
  branch: "Maternal" | "Paternal";
}

export interface PedigreeRow {
  generation: number;
  nodes: PedigreeNode[];
}

export interface PedigreeLayout {
  rows: PedigreeRow[];
  focalId: string;
  partnerId: string | null;
}

export interface PedigreeOptions {
  focalId: string;
  /** How many ancestor generations to include (default 3). */
  maxAncestorGen?: number;
}

function buildGraph(tree: TreeDTO) {
  const byId = new Map<string, PersonDTO>();
  for (const p of tree.nodes) byId.set(p.id, p);

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  for (const e of tree.edges) {
    if (e.type === "ParentOf") {
      push(childrenOf, e.fromPersonId, e.toPersonId);
      push(parentsOf, e.toPersonId, e.fromPersonId);
    } else if (e.type === "SpouseOf") {
      push(spousesOf, e.fromPersonId, e.toPersonId);
      push(spousesOf, e.toPersonId, e.fromPersonId);
    }
  }
  return { byId, parentsOf, childrenOf, spousesOf };
}

/** Fathers (Male) first, then a stable id order, so rows read consistently. */
function orderParents(ids: string[], byId: Map<string, PersonDTO>): string[] {
  return [...ids].sort((a, b) => {
    const ga = byId.get(a)!.gender === "Male" ? 0 : 1;
    const gb = byId.get(b)!.gender === "Male" ? 0 : 1;
    if (ga !== gb) return ga - gb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

export function layoutPedigree(
  tree: TreeDTO,
  options: PedigreeOptions,
): PedigreeLayout {
  const maxGen = options.maxAncestorGen ?? 3;
  const { byId, parentsOf, childrenOf, spousesOf } = buildGraph(tree);

  const focal = byId.get(options.focalId) ?? tree.nodes[0];
  if (!focal) {
    return { rows: [], focalId: options.focalId, partnerId: null };
  }

  const partnerId = (spousesOf.get(focal.id) ?? []).find((id) => byId.has(id));
  const partner = partnerId ? byId.get(partnerId) : undefined;

  // Bucket nodes by generation.
  const byGen = new Map<number, PedigreeNode[]>();
  const add = (node: PedigreeNode) => {
    const arr = byGen.get(node.generation);
    if (arr) arr.push(node);
    else byGen.set(node.generation, [node]);
  };

  add({ person: focal, role: "focal", generation: 0, branch: focal.branch });
  if (partner) {
    add({ person: partner, role: "partner", generation: 0, branch: partner.branch });
  }

  // Ancestors of both members of the base couple, walked breadth-first.
  const visited = new Set<string>([focal.id, ...(partner ? [partner.id] : [])]);
  const seeds = [focal.id, ...(partner ? [partner.id] : [])];
  for (const seed of seeds) {
    let frontier = [seed];
    for (let gen = 1; gen <= maxGen; gen++) {
      const next: string[] = [];
      for (const childId of frontier) {
        const parents = orderParents(
          (parentsOf.get(childId) ?? []).filter((p) => byId.has(p)),
          byId,
        );
        for (const pid of parents) {
          if (visited.has(pid)) continue;
          visited.add(pid);
          const p = byId.get(pid)!;
          add({ person: p, role: "ancestor", generation: gen, branch: p.branch });
          next.push(pid);
        }
      }
      frontier = next;
    }
  }

  // Children of the base couple.
  const childIds = Array.from(
    new Set([
      ...(childrenOf.get(focal.id) ?? []),
      ...(partner ? childrenOf.get(partner.id) ?? [] : []),
    ]),
  ).filter((id) => byId.has(id));
  for (const cid of childIds) {
    const c = byId.get(cid)!;
    add({ person: c, role: "child", generation: -1, branch: c.branch });
  }

  // Order rows: highest generation (oldest) first, then 0, then -1 (children).
  const rows: PedigreeRow[] = Array.from(byGen.entries())
    .map(([generation, nodes]) => ({ generation, nodes }))
    .sort((a, b) => b.generation - a.generation);

  return { rows, focalId: focal.id, partnerId: partner?.id ?? null };
}
