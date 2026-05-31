import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { render } from "@testing-library/react";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import { FamilyTreeFan } from "@/contexts/genealogy/ui/tree/FamilyTreeFan";

/**
 * Renders the real fan over the seeded family and writes a standalone, openable
 * HTML preview to docs/images/. Not a unit test of behaviour — a build artifact
 * so the visualization can be eyeballed in a browser without the dev server.
 */
describe("family tree preview artifact", () => {
  it("writes docs/images/family-tree-preview.html", async () => {
    resetContainer();
    const deps = {
      store: new InMemoryKeyValueStore(),
      clock: new FixedClock(Date.UTC(2024, 0, 15)),
      ids: new SequentialIdGenerator("t"),
    };
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);
    const tree = await container.genealogy.getTree();

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
    const focal = tree.nodes.find(
      (n) => childParents.has(n.id) && spouses.has(n.id) && hasParents.has(n.id),
    )!;

    const { container: dom } = render(
      <FamilyTreeFan tree={tree} focalId={focal.id} familyName="Kalaimalai Family" />,
    );
    const svg = dom.querySelector("svg")!;
    svg.setAttribute("style", "max-width:100%;height:auto");

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Family Fabric — Family Tree preview</title>
<style>
  :root{--maternal:330 62% 48%;--paternal:212 72% 45%;--primary:158 64% 32%;--border:40 14% 84%;}
  body{margin:0;font-family:Georgia,'Times New Roman',serif;
    background:radial-gradient(120% 90% at 50% 12%,#fbf6e8 0%,#f3e9cf 55%,#ece0bf 100%);}
  .wrap{display:flex;justify-content:center;padding:16px}
</style></head>
<body><div class="wrap">${svg.outerHTML}</div></body></html>`;

    mkdirSync("docs/images", { recursive: true });
    writeFileSync("docs/images/family-tree-preview.html", html, "utf8");

    expect(svg.querySelectorAll("[role='treeitem']").length).toBeGreaterThanOrEqual(6);
  });
});
