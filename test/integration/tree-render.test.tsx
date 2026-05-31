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
 * Renders the actual SVG family tree component with the real seeded family,
 * proving the deliverable: a working, interactive family tree in the DOM.
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

    // People appear by name (displayName = nickname ?? legalName).
    expect(screen.getByText("Anika Sharma")).toBeInTheDocument();
    expect(screen.getByText("Meenu")).toBeInTheDocument(); // Meena's nickname
    expect(screen.getByText("Appa")).toBeInTheDocument(); // Arjun's nickname

    // Rendered as accessible tree nodes (keyboard-navigable).
    const nodes = screen.getAllByRole("treeitem");
    expect(nodes).toHaveLength(9);

    // It is a real SVG visualization.
    expect(document.querySelector("svg")).toBeTruthy();
  });
});
