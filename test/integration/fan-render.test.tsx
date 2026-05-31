import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import type { TreeDTO } from "@/contexts/genealogy";
import { FamilyTreeFan } from "@/contexts/genealogy/ui/tree/FamilyTreeFan";

/**
 * Renders the decorative ancestor fan with the real seeded family, proving the
 * requested visualization: a focal couple at the trunk, ancestors fanning up,
 * children below — and that clicking a person re-roots the fan. Names are derived
 * from the seeded graph so the test survives seed edits.
 */
describe("FamilyTreeFan renders the seeded family", () => {
  let tree: TreeDTO;
  let focalId: string;
  let focalName: string;
  let childName: string;

  beforeEach(async () => {
    resetContainer();
    const deps = {
      store: new InMemoryKeyValueStore(),
      clock: new FixedClock(Date.UTC(2024, 0, 15)),
      ids: new SequentialIdGenerator("t"),
    };
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);
    tree = await container.genealogy.getTree();

    const parentToChildren = new Map<string, string[]>();
    const hasParents = new Set<string>();
    const spouses = new Set<string>();
    for (const e of tree.edges) {
      if (e.type === "ParentOf") {
        const arr = parentToChildren.get(e.fromPersonId) ?? [];
        arr.push(e.toPersonId);
        parentToChildren.set(e.fromPersonId, arr);
        hasParents.add(e.toPersonId);
      } else if (e.type === "SpouseOf") {
        spouses.add(e.fromPersonId);
        spouses.add(e.toPersonId);
      }
    }
    const name = (id: string) =>
      tree.nodes.find((n) => n.id === id)!.displayName;

    // Focal = middle-generation person: has ancestors, a spouse, and children.
    const focal = tree.nodes.find(
      (n) =>
        parentToChildren.has(n.id) && spouses.has(n.id) && hasParents.has(n.id),
    )!;
    focalId = focal.id;
    focalName = focal.displayName;
    childName = name(parentToChildren.get(focal.id)![0]!);
  });

  it("draws the family as an SVG fan with the focal couple and children", () => {
    render(
      <FamilyTreeFan tree={tree} focalId={focalId} familyName="Our Family" />,
    );

    expect(screen.getByText("Our Family")).toBeInTheDocument();
    expect(screen.getByText(focalName)).toBeInTheDocument();
    expect(screen.getByText(childName)).toBeInTheDocument();

    expect(screen.getByRole("tree")).toBeInTheDocument();
    expect(screen.getAllByRole("treeitem").length).toBeGreaterThanOrEqual(6);
  });

  it("re-roots when a person is clicked", () => {
    const rerooted: string[] = [];
    render(
      <FamilyTreeFan
        tree={tree}
        focalId={focalId}
        onReroot={(id) => rerooted.push(id)}
      />,
    );
    const child = screen.getByText(childName).closest("[role='treeitem']")!;
    fireEvent.click(child);
    expect(rerooted).toHaveLength(1);
  });
});
