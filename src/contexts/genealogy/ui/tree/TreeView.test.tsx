import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PersonDTO, TreeDTO } from "../../application/dtos";
import { TreeView } from "./TreeView";

function person(id: string, over: Partial<PersonDTO> = {}): PersonDTO {
  return {
    id,
    legalName: id,
    nickname: null,
    displayName: id,
    gender: "Unknown",
    birth: null,
    passing: null,
    birthplace: null,
    currentLocation: null,
    bio: null,
    photoUrl: null,
    visibility: "Public",
    branch: "Paternal",
    isDeceased: false,
    isUnlisted: false,
    ...over,
  };
}

const tree: TreeDTO = {
  nodes: [
    person("p", { displayName: "Parent", branch: "Maternal" }),
    person("c", { displayName: "Child", branch: "Maternal" }),
    person("x", { displayName: "Paternal One", branch: "Paternal" }),
  ],
  edges: [
    { id: "e1", type: "ParentOf", fromPersonId: "p", toPersonId: "c", qualifier: null },
  ],
};

describe("TreeView", () => {
  it("renders a tree with focusable treeitem nodes", () => {
    render(<TreeView tree={tree} />);
    expect(screen.getByRole("tree")).toBeInTheDocument();
    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBe(3);
    expect(items[0]).toHaveAttribute("tabindex", "0");
  });

  it("opens a person on Enter (keyboard accessible)", () => {
    const onSelect = vi.fn();
    render(<TreeView tree={tree} onSelectPerson={onSelect} />);
    const parent = screen.getByLabelText(/Parent/);
    fireEvent.keyDown(parent, { key: "Enter" });
    expect(onSelect).toHaveBeenCalledWith("p");
  });

  it("opens a person on click", () => {
    const onSelect = vi.fn();
    render(<TreeView tree={tree} onSelectPerson={onSelect} />);
    fireEvent.click(screen.getByLabelText(/Child/));
    expect(onSelect).toHaveBeenCalledWith("c");
  });

  it("applies the branch filter", () => {
    render(<TreeView tree={tree} branch="Maternal" />);
    expect(screen.getAllByRole("treeitem").length).toBe(2);
    expect(screen.queryByLabelText(/Paternal One/)).toBeNull();
  });

  it("shows an empty state when there are no people", () => {
    render(<TreeView tree={{ nodes: [], edges: [] }} />);
    expect(screen.getByTestId("tree-empty")).toBeInTheDocument();
  });
});
