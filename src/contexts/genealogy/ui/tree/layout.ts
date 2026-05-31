import type { PersonDTO, RelationshipDTO, TreeDTO } from "../../application/dtos";

/**
 * Pure generational layout for the family tree (TECHNICAL_DESIGN §10.1).
 * Given nodes + edges, assign each person a generation (row) by walking
 * ParentOf edges, then place people in columns within their row. Spouses are
 * pulled to the same generation and placed adjacently. The output is a set of
 * positioned nodes plus the edges to draw, in a coordinate space the SVG view
 * renders directly. No DOM, no React — fully unit-testable.
 */

export interface PositionedNode {
  person: PersonDTO;
  generation: number;
  /** Column index within the generation row. */
  column: number;
  x: number;
  y: number;
}

export type TreeEdgeKind = "parent" | "spouse" | "sibling";

export interface LayoutEdge {
  id: string;
  kind: TreeEdgeKind;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface TreeLayout {
  nodes: PositionedNode[];
  edges: LayoutEdge[];
  width: number;
  height: number;
}

export interface LayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  hGap?: number;
  vGap?: number;
}

const DEFAULTS = {
  nodeWidth: 160,
  nodeHeight: 72,
  hGap: 40,
  vGap: 80,
};

/**
 * Assign a generation index to every person. People with no parents (roots)
 * start at generation 0; each child is one generation below its lowest parent.
 * Spouses are aligned to the same generation. Disconnected people land at 0.
 */
function assignGenerations(
  people: PersonDTO[],
  edges: RelationshipDTO[],
): Map<string, number> {
  const parentsOf = new Map<string, string[]>();
  const spouseEdges: Array<[string, string]> = [];
  for (const edge of edges) {
    if (edge.type === "ParentOf") {
      const arr = parentsOf.get(edge.toPersonId) ?? [];
      arr.push(edge.fromPersonId);
      parentsOf.set(edge.toPersonId, arr);
    } else if (edge.type === "SpouseOf") {
      spouseEdges.push([edge.fromPersonId, edge.toPersonId]);
    }
  }

  const ids = new Set(people.map((p) => p.id));
  const gen = new Map<string, number>();

  // Longest-path generation via memoized DFS over parent edges.
  const computing = new Set<string>();
  const generationOf = (id: string): number => {
    const cached = gen.get(id);
    if (cached !== undefined) return cached;
    if (computing.has(id)) return 0; // cycle guard
    computing.add(id);
    const parents = (parentsOf.get(id) ?? []).filter((p) => ids.has(p));
    let g = 0;
    for (const parent of parents) {
      g = Math.max(g, generationOf(parent) + 1);
    }
    computing.delete(id);
    gen.set(id, g);
    return g;
  };
  for (const person of people) generationOf(person.id);

  // Align spouses to the deeper generation of the pair (stabilises rows).
  let changed = true;
  let guard = 0;
  while (changed && guard < people.length + 1) {
    changed = false;
    guard += 1;
    for (const [a, b] of spouseEdges) {
      if (!ids.has(a) || !ids.has(b)) continue;
      const ga = gen.get(a) ?? 0;
      const gb = gen.get(b) ?? 0;
      const target = Math.max(ga, gb);
      if (ga !== target) {
        gen.set(a, target);
        changed = true;
      }
      if (gb !== target) {
        gen.set(b, target);
        changed = true;
      }
    }
  }

  return gen;
}

export function layoutTree(
  tree: TreeDTO,
  options: LayoutOptions = {},
): TreeLayout {
  const opts = { ...DEFAULTS, ...options };
  const { people, edges } = { people: tree.nodes, edges: tree.edges };

  const gen = assignGenerations(people, edges);

  // Group people by generation, preserving input order for stable columns.
  const rows = new Map<number, PersonDTO[]>();
  for (const person of people) {
    const g = gen.get(person.id) ?? 0;
    const row = rows.get(g) ?? [];
    row.push(person);
    rows.set(g, row);
  }

  const sortedGenerations = Array.from(rows.keys()).sort((a, b) => a - b);
  const colStep = opts.nodeWidth + opts.hGap;
  const rowStep = opts.nodeHeight + opts.vGap;
  const maxRowSize = Math.max(
    1,
    ...sortedGenerations.map((g) => rows.get(g)?.length ?? 0),
  );
  const totalWidth = maxRowSize * colStep - opts.hGap;

  const positioned = new Map<string, PositionedNode>();
  const nodes: PositionedNode[] = [];

  sortedGenerations.forEach((g, rowIndex) => {
    const row = rows.get(g) ?? [];
    const rowWidth = row.length * colStep - opts.hGap;
    const offset = (totalWidth - rowWidth) / 2;
    row.forEach((person, column) => {
      const x = offset + column * colStep;
      const y = rowIndex * rowStep;
      const node: PositionedNode = { person, generation: g, column, x, y };
      positioned.set(person.id, node);
      nodes.push(node);
    });
  });

  // Build drawable edges using node centres / anchor points.
  const centreX = (n: PositionedNode) => n.x + opts.nodeWidth / 2;
  const topY = (n: PositionedNode) => n.y;
  const bottomY = (n: PositionedNode) => n.y + opts.nodeHeight;
  const midY = (n: PositionedNode) => n.y + opts.nodeHeight / 2;

  const layoutEdges: LayoutEdge[] = [];
  for (const edge of edges) {
    const from = positioned.get(edge.fromPersonId);
    const to = positioned.get(edge.toPersonId);
    if (!from || !to) continue;
    if (edge.type === "ParentOf") {
      layoutEdges.push({
        id: edge.id,
        kind: "parent",
        fromX: centreX(from),
        fromY: bottomY(from),
        toX: centreX(to),
        toY: topY(to),
      });
    } else if (edge.type === "SpouseOf") {
      layoutEdges.push({
        id: edge.id,
        kind: "spouse",
        fromX: centreX(from),
        fromY: midY(from),
        toX: centreX(to),
        toY: midY(to),
      });
    } else {
      layoutEdges.push({
        id: edge.id,
        kind: "sibling",
        fromX: centreX(from),
        fromY: midY(from),
        toX: centreX(to),
        toY: midY(to),
      });
    }
  }

  const height =
    sortedGenerations.length > 0
      ? (sortedGenerations.length - 1) * rowStep + opts.nodeHeight
      : 0;

  return {
    nodes,
    edges: layoutEdges,
    width: Math.max(totalWidth, opts.nodeWidth),
    height,
  };
}
