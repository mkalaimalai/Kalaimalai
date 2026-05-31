import { describe, it, expect, beforeEach } from "vitest";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import type { SharedDeps } from "@/bootstrap/container";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import { layoutTree } from "@/contexts/genealogy/ui/tree/layout";

/**
 * End-to-end integration over the REAL composition root: compose every context,
 * seed the starter family, and assert the family tree (and the downstream read
 * models that hang off it) actually work — the deliverable, verified headless.
 */
function makeTestDeps(): SharedDeps {
  return {
    store: new InMemoryKeyValueStore(),
    clock: new FixedClock(Date.UTC(2024, 0, 15)), // 2024-01-15
    ids: new SequentialIdGenerator("t"),
  };
}

describe("Family Fabric — integrated family tree", () => {
  beforeEach(() => resetContainer());

  it("seeds a believable family and builds a layout-able tree", async () => {
    const deps = makeTestDeps();
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);

    const tree = await container.genealogy.getTree();

    // 9 people across three generations.
    expect(tree.nodes).toHaveLength(9);
    // displayName is `nickname ?? legalName` — Arjun's nickname is "Appa".
    const names = tree.nodes.map((n) => n.displayName).sort();
    expect(names).toContain("Appa");
    expect(names).toContain("Anika Sharma");

    // Relationships were proposed AND approved (structural edits need approval).
    // 3 spouse + 10 parent edges (5 children × 2 parents) = 13.
    expect(tree.edges).toHaveLength(13);
    const parentEdges = tree.edges.filter((e) => e.type === "ParentOf");
    expect(parentEdges).toHaveLength(10);

    // The custom tree layout positions every node into generational rows.
    const layout = layoutTree(tree, { nodeWidth: 160, nodeHeight: 72 });
    expect(layout.nodes).toHaveLength(9);
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
    await seedIfEmpty(container, deps);

    const tree = await container.genealogy.getTree();
    expect(tree.nodes).toHaveLength(9);
  });

  it("explains a real relationship across the tree", async () => {
    const deps = makeTestDeps();
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);

    const tree = await container.genealogy.getTree();
    const byName = (name: string) =>
      tree.nodes.find((n) => n.displayName === name)!.id;

    const explanation = await container.genealogy.explainRelationship(
      byName("Anika Sharma"),
      byName("Appa"), // Arjun
    );
    expect(explanation.toLowerCase()).not.toContain("no known");
  });

  it("filters the tree by lineage", async () => {
    const deps = makeTestDeps();
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);

    const maternal = await container.genealogy.getTree("Maternal");
    expect(maternal.nodes.length).toBeGreaterThan(0);
    expect(maternal.nodes.every((n) => n.branch === "Maternal")).toBe(true);
  });

  it("downstream read models hang off the seeded tree", async () => {
    const deps = makeTestDeps();
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);

    // Timeline projects births/passings + memories in order.
    const timeline = await container.timeline.buildTimeline({
      scope: { kind: "WholeFamily" },
    });
    expect(timeline.entries.length).toBeGreaterThan(0);
    const sortKeys = timeline.entries.map((e) => e.sortKey);
    expect([...sortKeys].sort((a, b) => a - b)).toEqual(sortKeys);

    // Reminders derive upcoming birthdays/festivals.
    const reminders = await container.reminders.listUpcomingReminders({
      windowDays: 365,
    });
    expect(reminders.length).toBeGreaterThan(0);

    // Memories were seeded and are visible cross-context.
    const memories = await container.memories.listMemoryViews();
    expect(memories.length).toBe(3);

    // Identity seeded a current Admin.
    const me = await container.identity.getCurrentMember();
    expect(me?.role).toBe("Admin");
  });
});
