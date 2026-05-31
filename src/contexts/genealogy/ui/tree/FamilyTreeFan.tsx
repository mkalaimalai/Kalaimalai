"use client";

import * as React from "react";
import { cn } from "@/shared/ui";
import { Button } from "@/shared/ui";
import type { TreeDTO } from "../../application/dtos";
import { lifespan } from "../format";
import {
  layoutFan,
  type FanConnector,
  type FanNode,
} from "./fan-layout";
import { leavesAlong, monogram, vinePath } from "./decor";

export interface FamilyTreeFanProps {
  tree: TreeDTO;
  focalId: string;
  /** Re-root the fan on a person (click / Enter on a node). */
  onReroot?: (personId: string) => void;
  /** Open a person's full profile page. */
  onOpenProfile?: (personId: string) => void;
  /** Banner label shown at the base of the trunk. */
  familyName?: string;
  className?: string;
}

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;

/**
 * The decorative ancestor "fan" tree (the reference form): a focal couple at the
 * base of an illustrated trunk, their children below, and both partners'
 * ancestors fanning upward through leafy vines on a parchment field. Clicking any
 * person re-roots the fan on them, so the whole family is explorable in this
 * style. Kept behind the presentation boundary — it is a pure view over
 * `layoutFan`.
 */
export function FamilyTreeFan({
  tree,
  focalId,
  onReroot,
  onOpenProfile,
  familyName = "Our Family",
  className,
}: FamilyTreeFanProps): React.JSX.Element {
  const layout = React.useMemo(
    () => layoutFan(tree, { focalId, maxAncestorGen: 4 }),
    [tree, focalId],
  );
  const [zoom, setZoom] = React.useState(0.75);

  const { width, height, trunk } = layout;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)))}
        >
          −
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)))}
        >
          +
        </Button>
        <Button variant="ghost" onClick={() => setZoom(0.75)}>
          Reset
        </Button>
        <p className="ml-2 text-sm text-muted-foreground">
          Tip: click a person to re-center the tree on them.
        </p>
      </div>

      <div
        className="overflow-auto rounded-xl border border-border"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 12%, #fbf6e8 0%, #f3e9cf 55%, #ece0bf 100%)",
        }}
      >
        <svg
          role="tree"
          aria-label="Family tree"
          width={width * zoom}
          height={height * zoom}
          viewBox={`0 0 ${width} ${height}`}
        >
          <FanDefs />

          {/* Trunk, roots and grass grow the whole structure. */}
          <Trunk
            cx={trunk.x}
            cy={trunk.y}
            baseY={trunk.baseY}
            familyName={familyName}
          />

          {/* Vines / connectors beneath the avatars. */}
          {layout.connectors.map((c) => (
            <Connector key={c.id} connector={c} />
          ))}

          {/* People. */}
          {layout.nodes.map((n) => (
            <PersonNode
              key={n.person.id}
              node={n}
              onReroot={onReroot}
              onOpenProfile={onOpenProfile}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function FanDefs(): React.JSX.Element {
  return (
    <defs>
      <radialGradient id="ff-photo" cx="50%" cy="38%" r="70%">
        <stop offset="0%" stopColor="#f5efe2" />
        <stop offset="60%" stopColor="#d9cdb6" />
        <stop offset="100%" stopColor="#9c9079" />
      </radialGradient>
      <linearGradient id="ff-bark" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#7c5230" />
        <stop offset="50%" stopColor="#9a6a3e" />
        <stop offset="100%" stopColor="#6f4827" />
      </linearGradient>
    </defs>
  );
}

function Trunk({
  cx,
  cy,
  baseY,
  familyName,
}: {
  cx: number;
  cy: number;
  baseY: number;
  familyName: string;
}): React.JSX.Element {
  const topHalf = 22;
  const baseHalf = 48;
  const trunkPath = [
    `M ${cx - topHalf} ${cy}`,
    `C ${cx - topHalf - 8} ${cy + (baseY - cy) * 0.45}, ${cx - baseHalf} ${baseY - 26}, ${cx - baseHalf} ${baseY}`,
    `L ${cx + baseHalf} ${baseY}`,
    `C ${cx + baseHalf} ${baseY - 26}, ${cx + topHalf + 8} ${cy + (baseY - cy) * 0.45}, ${cx + topHalf} ${cy}`,
    "Z",
  ].join(" ");

  // Two limbs reaching up toward the base couple.
  const limb = (dir: number) =>
    `M ${cx + dir * 6} ${cy + 6} Q ${cx + dir * 70} ${cy - 30}, ${cx + dir * 104} ${cy - 96}`;

  // Roots splaying into the grass.
  const roots = [-1, -0.5, 0.5, 1].map(
    (d) =>
      `M ${cx + d * 14} ${baseY - 6} Q ${cx + d * 60} ${baseY + 12}, ${cx + d * 96} ${baseY + 34}`,
  );

  return (
    <g>
      {roots.map((d, i) => (
        <path
          key={`root-${i}`}
          d={d}
          fill="none"
          stroke="#6f4827"
          strokeWidth={7}
          strokeLinecap="round"
          opacity={0.8}
        />
      ))}
      <path d={trunkPath} fill="url(#ff-bark)" stroke="#5f3f23" strokeWidth={1.5} />
      {[-1, 1].map((dir) => (
        <path
          key={`limb-${dir}`}
          d={limb(dir)}
          fill="none"
          stroke="url(#ff-bark)"
          strokeWidth={16}
          strokeLinecap="round"
        />
      ))}
      {/* Grass tuft */}
      <Grass cx={cx} y={baseY + 30} />
      {/* Family-name banner */}
      <g transform={`translate(${cx}, ${cy + 26})`}>
        <rect
          x={-92}
          y={-20}
          width={184}
          height={40}
          rx={20}
          fill="#fffdf6"
          stroke="#c9b58a"
          strokeWidth={1.5}
        />
        <text
          x={0}
          y={6}
          textAnchor="middle"
          fontSize={16}
          fontStyle="italic"
          fill="#6b5a3a"
          fontWeight={600}
        >
          {familyName}
        </text>
      </g>
    </g>
  );
}

function Grass({ cx, y }: { cx: number; y: number }): React.JSX.Element {
  const blades = [];
  for (let i = -5; i <= 5; i++) {
    const x = cx + i * 12;
    const h = 16 + ((i * 7) % 9);
    blades.push(
      <path
        key={i}
        d={`M ${x} ${y} Q ${x + 4} ${y - h}, ${x + 1} ${y - h - 4}`}
        stroke="#5e8a3a"
        strokeWidth={3}
        fill="none"
        strokeLinecap="round"
      />,
    );
  }
  return <g>{blades}</g>;
}

function Connector({ connector }: { connector: FanConnector }): React.JSX.Element {
  const { from, to, kind } = connector;

  if (kind === "child") {
    // A root-like brown link from the trunk base down to a child.
    const { d } = vinePath(from, to, 0.08);
    return (
      <path
        d={d}
        fill="none"
        stroke="#6f4827"
        strokeWidth={5}
        strokeLinecap="round"
        opacity={0.85}
      />
    );
  }

  if (kind === "couple") {
    const { d } = vinePath(from, to, -0.55);
    return (
      <path d={d} fill="none" stroke="#7ba642" strokeWidth={3} opacity={0.7} />
    );
  }

  // Ancestor vine: a leafy green branch.
  const { d, control } = vinePath(from, to, 0.16);
  const leaves = leavesAlong(from, to, control, Math.round(from.x + to.y));
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke="#8a6a3a"
        strokeWidth={6}
        strokeLinecap="round"
        opacity={0.5}
      />
      <path
        d={d}
        fill="none"
        stroke="#6f9b3e"
        strokeWidth={3.5}
        strokeLinecap="round"
      />
      {leaves.map((leaf, i) =>
        leaf.variant === "blossom" ? (
          <circle
            key={i}
            cx={leaf.x}
            cy={leaf.y}
            r={3.4}
            fill={i % 2 ? "#e8927c" : "#e7b3c6"}
          />
        ) : (
          <ellipse
            key={i}
            cx={leaf.x}
            cy={leaf.y}
            rx={6}
            ry={3}
            fill={i % 2 ? "#6f9b3e" : "#8cb85a"}
            transform={`rotate(${leaf.angle} ${leaf.x} ${leaf.y})`}
          />
        ),
      )}
    </g>
  );
}

function PersonNode({
  node,
  onReroot,
  onOpenProfile,
}: {
  node: FanNode;
  onReroot?: (id: string) => void;
  onOpenProfile?: (id: string) => void;
}): React.JSX.Element {
  const { person, x, y, radius, role } = node;
  const ring =
    person.branch === "Maternal"
      ? "hsl(var(--maternal))"
      : "hsl(var(--paternal))";
  const isBase = role === "focal" || role === "partner";
  const dates = lifespan(person);
  const place = person.currentLocation ?? person.birthplace ?? "";

  const activate = () => onReroot?.(person.id);
  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate();
    }
  };

  return (
    <g
      role="treeitem"
      tabIndex={0}
      aria-label={`${person.displayName}${dates ? `, ${dates}` : ""}. Click to center the tree on them.`}
      transform={`translate(${x}, ${y})`}
      onClick={activate}
      onKeyDown={onKey}
      onDoubleClick={() => onOpenProfile?.(person.id)}
      style={{ cursor: "pointer" }}
      className="ff-node"
    >
      {/* Photo frame */}
      <circle r={radius + 4} fill="#fffdf6" stroke={ring} strokeWidth={isBase ? 4 : 3} />
      {isBase ? <circle r={radius + 8} fill="none" stroke="#d8b864" strokeWidth={2} /> : null}
      <circle r={radius} fill="url(#ff-photo)" />
      <text
        y={radius * 0.34}
        textAnchor="middle"
        fontSize={radius * 0.8}
        fontWeight={700}
        fill="#5b513f"
      >
        {monogram(person.legalName)}
      </text>

      {/* Labels below the avatar */}
      <text
        y={radius + 22}
        textAnchor="middle"
        fontSize={14}
        fontWeight={700}
        fill="#3f3a2e"
      >
        {person.displayName}
      </text>
      {dates ? (
        <text y={radius + 39} textAnchor="middle" fontSize={12} fill="#6b6552">
          {dates}
        </text>
      ) : null}
      {place ? (
        <text y={radius + 55} textAnchor="middle" fontSize={12} fill="#857f6a">
          {place}
        </text>
      ) : null}
    </g>
  );
}
