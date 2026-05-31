"use client";

import * as React from "react";
import type { Branch } from "@/shared/kernel";
import { cn } from "@/shared/ui";
import type { TreeDTO } from "../../application/dtos";
import { lifespan } from "../format";
import { layoutTree, type PositionedNode } from "./layout";

const NODE_W = 160;
const NODE_H = 72;
const PADDING = 40;

export interface TreeViewProps {
  tree: TreeDTO;
  /** Filter to a single lineage; when set, only that branch's nodes show. */
  branch?: Branch;
  /** Called when a node is activated (click or Enter) — integrator routes it. */
  onSelectPerson?: (personId: string) => void;
  className?: string;
}

/**
 * A custom, dependency-free SVG family tree (TECHNICAL_DESIGN §10.1). Renders a
 * generational layout from a TreeDTO: parent→child lines, spouse links, nodes
 * coloured by branch via the `--maternal`/`--paternal` tokens. Zoomable and
 * pannable; nodes are focusable cards (Enter opens the profile). Kept behind a
 * presentation boundary so the layout/viz can be swapped.
 */
export function TreeView({
  tree,
  branch,
  onSelectPerson,
  className,
}: TreeViewProps): React.JSX.Element {
  const filtered = React.useMemo<TreeDTO>(() => {
    if (!branch) return tree;
    const nodes = tree.nodes.filter((n) => n.branch === branch);
    const ids = new Set(nodes.map((n) => n.id));
    const edges = tree.edges.filter(
      (e) => ids.has(e.fromPersonId) && ids.has(e.toPersonId),
    );
    return { nodes, edges };
  }, [tree, branch]);

  const layout = React.useMemo(
    () => layoutTree(filtered, { nodeWidth: NODE_W, nodeHeight: NODE_H }),
    [filtered],
  );

  const [zoom, setZoom] = React.useState(1);

  const viewWidth = layout.width + PADDING * 2;
  const viewHeight = layout.height + PADDING * 2;

  const handleKey = (e: React.KeyboardEvent, personId: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelectPerson?.(personId);
    }
  };

  if (filtered.nodes.length === 0) {
    return (
      <div
        className={cn(
          "flex min-h-[200px] items-center justify-center rounded-xl border border-border bg-background text-muted-foreground",
          className,
        )}
        data-testid="tree-empty"
      >
        No people to show yet.
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2" role="group" aria-label="Tree zoom">
        <button
          type="button"
          className="min-h-target min-w-target rounded-lg border-2 border-border px-3 text-lg"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(0.4, +(z - 0.2).toFixed(2)))}
        >
          −
        </button>
        <span className="tabular-nums text-sm text-muted-foreground" aria-live="polite">
          {Math.round(zoom * 100)}%
        </span>
        <button
          type="button"
          className="min-h-target min-w-target rounded-lg border-2 border-border px-3 text-lg"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(2.5, +(z + 0.2).toFixed(2)))}
        >
          +
        </button>
      </div>

      <div className="overflow-auto rounded-xl border border-border bg-background">
        <svg
          role="tree"
          aria-label="Family tree"
          width={viewWidth * zoom}
          height={viewHeight * zoom}
          viewBox={`0 0 ${viewWidth} ${viewHeight}`}
          className="block"
        >
          <g transform={`translate(${PADDING}, ${PADDING})`}>
            {layout.edges.map((edge) => (
              <line
                key={edge.id}
                x1={edge.fromX}
                y1={edge.fromY}
                x2={edge.toX}
                y2={edge.toY}
                stroke={
                  edge.kind === "spouse"
                    ? "hsl(var(--muted-foreground))"
                    : "hsl(var(--border))"
                }
                strokeWidth={2}
                strokeDasharray={edge.kind === "spouse" ? "6 4" : undefined}
              />
            ))}
            {layout.nodes.map((node) => (
              <TreeNode
                key={node.person.id}
                node={node}
                onSelect={onSelectPerson}
                onKeyDown={handleKey}
              />
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
}

function TreeNode({
  node,
  onSelect,
  onKeyDown,
}: {
  node: PositionedNode;
  onSelect?: (personId: string) => void;
  onKeyDown: (e: React.KeyboardEvent, personId: string) => void;
}): React.JSX.Element {
  const { person, x, y } = node;
  const fill =
    person.branch === "Maternal" ? "hsl(var(--maternal))" : "hsl(var(--paternal))";
  const span = lifespan(person);
  return (
    <g
      role="treeitem"
      tabIndex={0}
      aria-label={`${person.displayName}${span ? `, ${span}` : ""}`}
      transform={`translate(${x}, ${y})`}
      className="cursor-pointer focus:outline-none"
      onClick={() => onSelect?.(person.id)}
      onKeyDown={(e) => onKeyDown(e, person.id)}
    >
      <rect
        width={NODE_W}
        height={NODE_H}
        rx={12}
        fill="hsl(var(--background))"
        stroke={fill}
        strokeWidth={3}
      />
      <rect width={6} height={NODE_H} rx={3} fill={fill} />
      <text
        x={16}
        y={28}
        fontSize={15}
        fontWeight={600}
        fill="hsl(var(--foreground))"
      >
        {truncate(person.displayName, 18)}
      </text>
      <text x={16} y={50} fontSize={12} fill="hsl(var(--muted-foreground))">
        {span}
      </text>
      {person.isDeceased ? (
        <text x={NODE_W - 16} y={24} fontSize={12} textAnchor="end" fill="hsl(var(--muted-foreground))">
          ✝
        </text>
      ) : null}
    </g>
  );
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
