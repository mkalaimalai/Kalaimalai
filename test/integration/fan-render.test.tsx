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
 * children below — and that clicking a person re-roots the fan.
 */
describe("FamilyTreeFan renders the seeded family", () => {
  let tree: TreeDTO;
  let focalId: string;

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
    // Focal = a middle-generation person: has ancestors, a spouse, and children.
    const childParents = new Set(
      tree.edges.filter((e) => e.type === "ParentOf").map((e) => e.fromPersonId),
    );
    const hasParents = new Set(
      tree.edges.filter((e) => e.type === "ParentOf").map((e) => e.toPersonId),
    );
    const spouses = new Set(
      tree.edges
        .filter((e) => e.type === "SpouseOf")
        .flatMap((e) => [e.fromPersonId, e.toPersonId]),
    );
    focalId = tree.nodes.find(
      (n) =>
        childParents.has(n.id) && spouses.has(n.id) && hasParents.has(n.id),
    )!.id;
  });

  it("draws the family as an SVG fan with the focal couple and children", () => {
    render(
      <FamilyTreeFan tree={tree} focalId={focalId} familyName="Kalaimalai Family" />,
    );

    // The decorative banner and people appear.
    expect(screen.getByText("Kalaimalai Family")).toBeInTheDocument();
    expect(screen.getByText("Anika Sharma")).toBeInTheDocument(); // a child
    expect(screen.getByText("Appa")).toBeInTheDocument(); // an ancestor (nickname)

    // It is an accessible SVG tree with one treeitem per person.
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
    const anika = screen.getByText("Anika Sharma").closest("[role='treeitem']")!;
    fireEvent.click(anika);
    expect(rerooted).toHaveLength(1);
  });
});
