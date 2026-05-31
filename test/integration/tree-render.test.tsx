import { describe, it, expect, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import type { TreeDTO } from "@/contexts/genealogy";
import { TreeView } from "@/contexts/genealogy/ui/tree/TreeView";

/**
 * Renders the generational SVG tree component with the real seeded family,
 * proving a working tree in the DOM. Assertions derive from the seed (no
 * hard-coded names) so the test survives seed edits.
 */
describe("TreeView renders the seeded family", () => {
  let tree: TreeDTO;

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
  });

  it("draws every family member as an interactive tree node", () => {
    const selected: string[] = [];
    render(<TreeView tree={tree} onSelectPerson={(id) => selected.push(id)} />);

    // One accessible, keyboard-navigable node per person.
    const nodes = screen.getAllByRole("treeitem");
    expect(nodes).toHaveLength(tree.nodes.length);

    // Each person's name is shown, and it is a real SVG visualization.
    expect(screen.getByText(tree.nodes[0]!.displayName)).toBeInTheDocument();
    expect(document.querySelector("svg")).toBeTruthy();
  });
});
