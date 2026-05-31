import type { PersonDTO, TreeDTO } from "../../application/dtos";

/**
 * Ancestor "fan" layout (the decorative tree form): a focal couple sits at the
 * base of the trunk, their children drop below, and both partners' ancestors fan
 * upward in widening rings. Pure and deterministic so it is unit-testable and
 * the decorative renderer stays a thin view over it.
 */

export type FanRole = "focal" | "partner" | "ancestor" | "child";
export type FanSide = "left" | "right" | "center";

export interface FanNode {
  person: PersonDTO;
  x: number;
  y: number;
  radius: number;
  role: FanRole;
  side: FanSide;
  /** 0 = base couple, 1 = parents, 2 = grandparents…; children are -1. */
  generation: number;
}

export interface FanConnector {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  kind: "ancestor" | "child" | "couple";
}

export interface FanLayout {
  nodes: FanNode[];
  connectors: FanConnector[];
  /** Anchor where the trunk meets the base couple. */
  trunk: { x: number; y: number; baseY: number };
  width: number;
  height: number;
}

export interface FanOptions {
  focalId: string;
  /** How many ancestor generations to fan upward (default 4). */
  maxAncestorGen?: number;
}

const R0 = 120; // radius of the base-couple ring
const RING_GAP = 170; // distance between ancestor generations
const SIDE_MARGIN = 90;
const TOP_MARGIN = 70;
const CHILD_DROP = 180; // how far below the trunk children sit
const CHILD_SPACING = 150;
const TRUNK_HEIGHT = 150;
const BOTTOM_MARGIN = 90;

const DEG = Math.PI / 180;

function avatarRadius(role: FanRole, generation: number): number {
  if (role === "child") return 30;
  if (role === "focal" || role === "partner") return 40;
  return Math.max(22, 34 - generation * 4);
}

/** Build parent/child/spouse adjacency from the tree edges. */
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

export function layoutFan(tree: TreeDTO, options: FanOptions): FanLayout {
  const maxGen = options.maxAncestorGen ?? 4;
  const { byId, parentsOf, childrenOf, spousesOf } = buildGraph(tree);

  const focal = byId.get(options.focalId) ?? tree.nodes[0];
  if (!focal) {
    return {
      nodes: [],
      connectors: [],
      trunk: { x: 0, y: 0, baseY: 0 },
      width: 320,
      height: 240,
    };
  }

  const partnerId = (spousesOf.get(focal.id) ?? []).find((id) => byId.has(id));
  const partner = partnerId ? byId.get(partnerId) : undefined;

  // Deepest ancestor generation actually present (for canvas sizing).
  function depth(id: string, gen: number, seen: Set<string>): number {
    if (gen >= maxGen || seen.has(id)) return gen;
    seen.add(id);
    const parents = (parentsOf.get(id) ?? []).filter((p) => byId.has(p));
    if (parents.length === 0) return gen;
    return Math.max(...parents.map((p) => depth(p, gen + 1, seen)));
  }
  const presentGen = Math.max(
    depth(focal.id, 0, new Set()),
    partner ? depth(partner.id, 0, new Set()) : 0,
  );

  const maxR = R0 + presentGen * RING_GAP;
  const width = 2 * (maxR + SIDE_MARGIN);
  const cx = width / 2;
  const cy = TOP_MARGIN + maxR; // trunk anchor (base-couple ring centre)
  const height = cy + TRUNK_HEIGHT + CHILD_DROP + BOTTOM_MARGIN;

  const nodes: FanNode[] = [];
  const connectors: FanConnector[] = [];
  const pos = new Map<string, { x: number; y: number }>();

  const polar = (r: number, angleDeg: number) => ({
    x: cx + r * Math.cos(angleDeg * DEG),
    y: cy - r * Math.sin(angleDeg * DEG),
  });

  // --- Base couple (generation 0) ---
  const hasPartner = Boolean(partner);
  const focalAngle = hasPartner ? 118 : 90;
  const focalPt = polar(R0, focalAngle);
  pos.set(focal.id, focalPt);
  nodes.push({
    person: focal,
    x: focalPt.x,
    y: focalPt.y,
    radius: avatarRadius("focal", 0),
    role: "focal",
    side: hasPartner ? "left" : "center",
    generation: 0,
  });

  if (partner) {
    const partnerPt = polar(R0, 62);
    pos.set(partner.id, partnerPt);
    nodes.push({
      person: partner,
      x: partnerPt.x,
      y: partnerPt.y,
      radius: avatarRadius("partner", 0),
      role: "partner",
      side: "right",
      generation: 0,
    });
    connectors.push({
      id: `couple-${focal.id}-${partner.id}`,
      from: focalPt,
      to: partnerPt,
      kind: "couple",
    });
  }

  // --- Ancestors fan upward, recursively bisecting an angular sector ---
  const visited = new Set<string>();
  function placeAncestors(
    childId: string,
    gen: number,
    angLo: number,
    angHi: number,
    side: FanSide,
  ): void {
    if (gen > maxGen) return;
    const parents = (parentsOf.get(childId) ?? []).filter(
      (p) => byId.has(p) && !visited.has(p),
    );
    if (parents.length === 0) return;

    // Stable order: fathers (Male) first so the fan reads consistently.
    parents.sort((a, b) => {
      const ga = byId.get(a)!.gender === "Male" ? 0 : 1;
      const gb = byId.get(b)!.gender === "Male" ? 0 : 1;
      return ga - gb;
    });

    const childPt = pos.get(childId)!;
    const slots = parents.length;
    const span = (angHi - angLo) / slots;
    parents.forEach((pid, i) => {
      visited.add(pid);
      const lo = angLo + span * i;
      const hi = lo + span;
      const mid = (lo + hi) / 2;
      const r = R0 + gen * RING_GAP;
      const pt = polar(r, mid);
      pos.set(pid, pt);
      nodes.push({
        person: byId.get(pid)!,
        x: pt.x,
        y: pt.y,
        radius: avatarRadius("ancestor", gen),
        role: "ancestor",
        side,
        generation: gen,
      });
      connectors.push({
        id: `anc-${childId}-${pid}`,
        from: childPt,
        to: pt,
        kind: "ancestor",
      });
      placeAncestors(pid, gen + 1, lo, hi, side);
    });
  }

  if (partner) {
    // Focal (left) ancestors fan the left arc; partner's fan the right arc.
    placeAncestors(focal.id, 1, 92, 168, "left");
    placeAncestors(partner.id, 1, 12, 88, "right");
  } else {
    placeAncestors(focal.id, 1, 20, 160, "center");
  }

  // --- Children drop below the trunk ---
  const childIds = Array.from(
    new Set([
      ...(childrenOf.get(focal.id) ?? []),
      ...(partner ? (childrenOf.get(partner.id) ?? []) : []),
    ]),
  ).filter((id) => byId.has(id));

  const baseY = cy + TRUNK_HEIGHT;
  const childY = cy + CHILD_DROP + TRUNK_HEIGHT * 0.4;
  const childStartX = cx - ((childIds.length - 1) * CHILD_SPACING) / 2;
  childIds.forEach((cid, i) => {
    const pt = { x: childStartX + i * CHILD_SPACING, y: childY };
    pos.set(cid, pt);
    nodes.push({
      person: byId.get(cid)!,
      x: pt.x,
      y: pt.y,
      radius: avatarRadius("child", -1),
      role: "child",
      side: "center",
      generation: -1,
    });
    connectors.push({
      id: `child-${cid}`,
      from: { x: cx, y: baseY },
      to: pt,
      kind: "child",
    });
  });

  return {
    nodes,
    connectors,
    trunk: { x: cx, y: cy, baseY },
    width,
    height,
  };
}
