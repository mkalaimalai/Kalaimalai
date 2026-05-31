import { describe, it, expect } from "vitest";
import { writeFileSync, mkdirSync } from "node:fs";
import { render } from "@testing-library/react";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import { TimelineAxis } from "@/contexts/timeline/ui/TimelineView";

/**
 * Renders the horizontal timeline over the seeded family and writes a standalone
 * HTML preview to docs/images/ so the visual can be eyeballed without the dev
 * server. Deterministic (FixedClock + SequentialIds) so re-runs don't churn git.
 */
describe("timeline preview artifact", () => {
  it("writes docs/images/timeline-preview.html", async () => {
    resetContainer();
    const deps = {
      store: new InMemoryKeyValueStore(),
      clock: new FixedClock(Date.UTC(2024, 0, 15)),
      ids: new SequentialIdGenerator("t"),
    };
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);
    const timeline = await container.timeline.buildTimeline({
      scope: { kind: "WholeFamily" },
    });

    const { container: dom } = render(<TimelineAxis timeline={timeline} />);

    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>Family Fabric — Timeline preview</title>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  :root{--background:40 33% 98%;--foreground:222 22% 16%;--muted:40 20% 92%;
    --muted-foreground:222 12% 38%;--border:40 14% 84%;--primary:158 64% 32%;}
  body{margin:0;background:#efe9da;font-family:ui-sans-serif,system-ui,Segoe UI,Roboto,sans-serif;
    color:hsl(var(--foreground));padding:28px}
  .bg-background{background:hsl(var(--background))}
  .text-muted-foreground{color:hsl(var(--muted-foreground))}
  .border-border{border-color:hsl(var(--border))}
  h1{font-size:22px;font-weight:700;margin:0 0 4px}
  .sub{color:hsl(var(--muted-foreground));margin:0 0 18px}
</style></head>
<body>
  <h1>Timeline</h1>
  <p class="sub">Births, milestones, and memories along the years.</p>
  ${dom.innerHTML}
</body></html>`;

    mkdirSync("docs/images", { recursive: true });
    writeFileSync("docs/images/timeline-preview.html", html, "utf8");

    expect(dom.querySelector("time")).toBeTruthy();
  });
});
