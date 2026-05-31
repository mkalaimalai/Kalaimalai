import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import type { SharedDeps } from "@/bootstrap/container";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import { layoutTree } from "@/contexts/genealogy/ui/tree/layout";
import type { TreeDTO } from "@/contexts/genealogy";

/**
 * End-to-end integration over the REAL composition root: compose every context,
 * seed the starter family, and assert the family tree (and the downstream read
 * models that hang off it) actually work — the deliverable, verified headless.
 *
 * Assertions are derived from the seeded graph (not hard-coded names/counts) so
 * they survive edits to the seed fixture.
 */
function makeTestDeps(): SharedDeps {
  return {
    store: new InMemoryKeyValueStore(),
    clock: new FixedClock(Date.UTC(2024, 0, 15)),
    ids: new SequentialIdGenerator("t"),
  };
}

async function freshTree(): Promise<{
  tree: TreeDTO;
  container: ReturnType<typeof composeContainer>;
  deps: SharedDeps;
}> {
  const deps = makeTestDeps();
  const container = composeContainer(deps);
  setContainer(container);
  await seedIfEmpty(container, deps);
  const tree = await container.genealogy.getTree();
  return { tree, container, deps };
}

/** Find someone with a parent who in turn has a parent (a 2-step ancestor). */
function findGrandchildAndAncestor(tree: TreeDTO): [string, string] | null {
  const parentsOf = new Map<string, string[]>();
  for (const e of tree.edges) {
    if (e.type === "ParentOf") {
      const arr = parentsOf.get(e.toPersonId) ?? [];
      arr.push(e.fromPersonId);
      parentsOf.set(e.toPersonId, arr);
    }
  }
  for (const [child, parents] of parentsOf) {
    for (const parent of parents) {
      const grandparents = parentsOf.get(parent);
      if (grandparents && grandparents[0]) return [child, grandparents[0]];
    }
  }
  return null;
}

describe("Family Fabric — integrated family tree", () => {
  beforeEach(() => resetContainer());

  it("seeds a connected family and builds a layout-able tree", async () => {
    const { tree } = await freshTree();

    expect(tree.nodes.length).toBeGreaterThanOrEqual(6);
    const parentEdges = tree.edges.filter((e) => e.type === "ParentOf");
    const spouseEdges = tree.edges.filter((e) => e.type === "SpouseOf");
    expect(parentEdges.length).toBeGreaterThan(0);
    expect(spouseEdges.length).toBeGreaterThan(0);

    // The custom tree layout positions every node into generational rows.
    const layout = layoutTree(tree, { nodeWidth: 160, nodeHeight: 72 });
    expect(layout.nodes).toHaveLength(tree.nodes.length);
    const rows = new Set(layout.nodes.map((n) => n.y));
    expect(rows.size).toBeGreaterThanOrEqual(3); // ≥3 generations
    expect(layout.width).toBeGreaterThan(0);
    expect(layout.height).toBeGreaterThan(0);
  });

  it("is idempotent — re-seeding does not duplicate the family", async () => {
    const deps = makeTestDeps();
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);
    const first = (await container.genealogy.getTree()).nodes.length;
    await seedIfEmpty(container, deps);
    const second = (await container.genealogy.getTree()).nodes.length;
    expect(second).toBe(first);
  });

  it("explains a real relationship across the tree", async () => {
    const { tree, container } = await freshTree();
    const pair = findGrandchildAndAncestor(tree);
    expect(pair).not.toBeNull();
    const [a, b] = pair!;
    const explanation = await container.genealogy.explainRelationship(a, b);
    expect(explanation.toLowerCase()).not.toContain("no known");
  });

  it("filters the tree by lineage", async () => {
    const { container } = await freshTree();
    const maternal = await container.genealogy.getTree("Maternal");
    expect(maternal.nodes.length).toBeGreaterThan(0);
    expect(maternal.nodes.every((n) => n.branch === "Maternal")).toBe(true);
  });

  it("downstream read models hang off the seeded tree", async () => {
    const { container } = await freshTree();

    const timeline = await container.timeline.buildTimeline({
      scope: { kind: "WholeFamily" },
    });
    expect(timeline.entries.length).toBeGreaterThan(0);
    const sortKeys = timeline.entries.map((e) => e.sortKey);
    expect([...sortKeys].sort((a, b) => a - b)).toEqual(sortKeys);

    const reminders = await container.reminders.listUpcomingReminders({
      windowDays: 365,
    });
    expect(reminders.length).toBeGreaterThan(0);

    const memories = await container.memories.listMemoryViews();
    expect(memories.length).toBeGreaterThan(0);

    const me = await container.identity.getCurrentMember();
    expect(me?.role).toBe("Admin");
  });
});
