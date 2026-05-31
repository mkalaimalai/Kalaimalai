"use client";

import * as React from "react";
import { Field, Select } from "@/shared/ui";
import { ApproximateDate } from "@/shared/kernel";
import type {
  TimelineDTO,
  TimelineEntryDTO,
  TimelineScopeDTO,
} from "../application/dtos";
import { useBuildTimelineQuery } from "./api";
import { layoutTimelineAxis, type AxisEntry } from "./axis-layout";

/** A person option offered by the scope switcher. */
export interface PersonOption {
  readonly id: string;
  readonly displayName: string;
}

const SCOPE_VALUES = {
  WholeFamily: "whole",
  Maternal: "maternal",
  Paternal: "paternal",
} as const;

type ScopeSelectValue =
  | (typeof SCOPE_VALUES)[keyof typeof SCOPE_VALUES]
  | `person:${string}`;

function selectValueOf(scope: TimelineScopeDTO): ScopeSelectValue {
  switch (scope.kind) {
    case "WholeFamily":
      return SCOPE_VALUES.WholeFamily;
    case "Branch":
      return scope.branch === "Maternal"
        ? SCOPE_VALUES.Maternal
        : SCOPE_VALUES.Paternal;
    case "Person":
      return `person:${scope.personId}`;
  }
}

function scopeOf(value: string): TimelineScopeDTO {
  if (value === SCOPE_VALUES.WholeFamily) return { kind: "WholeFamily" };
  if (value === SCOPE_VALUES.Maternal)
    return { kind: "Branch", branch: "Maternal" };
  if (value === SCOPE_VALUES.Paternal)
    return { kind: "Branch", branch: "Paternal" };
  if (value.startsWith("person:"))
    return { kind: "Person", personId: value.slice("person:".length) };
  return { kind: "WholeFamily" };
}

function formatEntryDate(entry: TimelineEntryDTO): string {
  return ApproximateDate.fromJSON(entry.date).format();
}

interface KindStyle {
  label: string;
  icon: string;
  color: string;
  soft: string;
}

const KIND: Record<TimelineEntryDTO["kind"], KindStyle> = {
  birth: { label: "Birth", icon: "🌱", color: "#3f9d57", soft: "#e7f4ea" },
  memory: { label: "Memory", icon: "📷", color: "#c98a2b", soft: "#fbf0dc" },
  passing: { label: "Passing", icon: "🕯️", color: "#6b7280", soft: "#eef0f2" },
};

const PX_PER_YEAR = 90;
const MIN_WIDTH = 760;
const TRACK_HEIGHT = 460;
const AXIS_Y = TRACK_HEIGHT / 2;
const CARD_OFFSET = 30; // gap from the axis to the first card row
const ROW_HEIGHT = 92; // vertical space per stacked card

/**
 * Horizontal, year-based timeline (the requested form): a single year axis runs
 * left→right with tick labels; entries sit at their year position, alternating
 * above and below the line with connectors, coloured by kind. Pure presentation
 * over a ready DTO; horizontally scrollable for long histories.
 */
export function TimelineAxis({ timeline }: { timeline: TimelineDTO }) {
  const layout = React.useMemo(
    () => layoutTimelineAxis(timeline.entries),
    [timeline.entries],
  );

  if (layout.entries.length === 0) {
    return (
      <p className="text-muted-foreground" role="status">
        No timeline entries yet.
      </p>
    );
  }

  const width = Math.max(MIN_WIDTH, layout.spanYears * PX_PER_YEAR);

  return (
    <div className="flex flex-col gap-3">
      <Legend />
      <div
        className="overflow-x-auto overflow-y-hidden rounded-xl border border-border"
        style={{
          background:
            "linear-gradient(180deg,#fbfaf6 0%,#f4f1e8 100%)",
        }}
        tabIndex={0}
        role="group"
        aria-label="Family timeline by year. Scroll horizontally to explore."
      >
        <div
          className="relative"
          style={{ width, height: TRACK_HEIGHT, minWidth: "100%" }}
        >
          {/* Tick gridlines */}
          {layout.ticks.map((t) => (
            <div
              key={`grid-${t.year}`}
              className="absolute top-0 bottom-0 border-l border-dashed"
              style={{
                left: `${t.xPct}%`,
                borderColor: "rgba(120,110,90,0.18)",
              }}
              aria-hidden
            />
          ))}

          {/* The axis line */}
          <div
            className="absolute left-0 right-0"
            style={{
              top: AXIS_Y,
              height: 4,
              borderRadius: 999,
              background:
                "linear-gradient(90deg,#cbb98c 0%,#9bb06a 50%,#cbb98c 100%)",
            }}
            aria-hidden
          />

          {/* Year tick labels on the axis */}
          {layout.ticks.map((t) => (
            <div
              key={`label-${t.year}`}
              className="absolute -translate-x-1/2"
              style={{ left: `${t.xPct}%`, top: AXIS_Y + 12 }}
              aria-hidden
            >
              <span className="rounded-full bg-background px-2 py-0.5 text-xs font-semibold text-muted-foreground shadow-sm">
                {t.year}
              </span>
            </div>
          ))}

          {/* Entries */}
          <ul aria-label="Timeline entries" className="contents">
            {layout.entries.map((item) => (
              <AxisCard key={item.entry.id} item={item} />
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function AxisCard({ item }: { item: AxisEntry }) {
  const { entry, xPct, lane, laneIndex } = item;
  const style = KIND[entry.kind];
  const isTop = lane === "top";

  const connectorLen = CARD_OFFSET + laneIndex * ROW_HEIGHT;
  const cardTop = isTop
    ? AXIS_Y - connectorLen - 70
    : AXIS_Y + connectorLen;

  return (
    <li
      className="absolute"
      style={{ left: `${xPct}%`, top: 0, transform: "translateX(-50%)" }}
    >
      {/* Connector */}
      <div
        aria-hidden
        className="absolute left-1/2"
        style={{
          top: isTop ? cardTop + 70 : AXIS_Y,
          height: connectorLen,
          width: 2,
          background: style.color,
          opacity: 0.5,
          transform: "translateX(-50%)",
        }}
      />
      {/* Dot on the axis */}
      <div
        aria-hidden
        className="absolute left-1/2"
        style={{
          top: AXIS_Y - 7,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: style.color,
          border: "3px solid #fff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
          transform: "translateX(-50%)",
        }}
      />
      {/* Card */}
      <div
        tabIndex={0}
        aria-label={`${style.label}: ${entry.title}, ${formatEntryDate(entry)}`}
        className="absolute w-44 -translate-x-1/2 rounded-xl border bg-background p-3 shadow-sm transition-transform hover:-translate-y-0.5 focus-visible:-translate-y-0.5"
        style={{
          top: cardTop,
          left: "50%",
          borderColor: style.color,
          borderLeftWidth: 5,
        }}
      >
        <div className="flex items-center gap-2">
          <span
            className="flex h-7 w-7 items-center justify-center rounded-full text-base"
            style={{ background: style.soft }}
            aria-hidden
          >
            {style.icon}
          </span>
          <span
            className="text-xs font-semibold uppercase tracking-wide"
            style={{ color: style.color }}
          >
            {style.label}
          </span>
        </div>
        <p className="mt-1.5 font-semibold leading-snug">{entry.title}</p>
        <time className="text-sm text-muted-foreground">
          {formatEntryDate(entry)}
        </time>
      </div>
    </li>
  );
}

function Legend() {
  return (
    <ul className="flex flex-wrap gap-4" aria-label="Legend">
      {(Object.keys(KIND) as TimelineEntryDTO["kind"][]).map((k) => (
        <li key={k} className="flex items-center gap-2 text-sm">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ background: KIND[k].color }}
            aria-hidden
          />
          <span>
            {KIND[k].icon} {KIND[k].label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Container: horizontal year timeline with a scope switcher
 * (Whole family / Maternal / Paternal / a specific person).
 *
 * `people` powers the per-person option list; the integrator passes it from the
 * Genealogy read view (kept out of this context's domain).
 */
export function TimelineView({ people = [] }: { people?: PersonOption[] }) {
  const [scope, setScope] = React.useState<TimelineScopeDTO>({
    kind: "WholeFamily",
  });

  const { data, isLoading, isError } = useBuildTimelineQuery({ scope });

  return (
    <section className="flex flex-col gap-4" aria-label="Timeline">
      <Field label="Show timeline for" htmlFor="timeline-scope">
        <Select
          id="timeline-scope"
          value={data ? selectValueOf(data.scope) : selectValueOf(scope)}
          onChange={(e) => setScope(scopeOf(e.target.value))}
        >
          <option value={SCOPE_VALUES.WholeFamily}>Whole family</option>
          <option value={SCOPE_VALUES.Maternal}>Maternal side</option>
          <option value={SCOPE_VALUES.Paternal}>Paternal side</option>
          {people.map((p) => (
            <option key={p.id} value={`person:${p.id}`}>
              {p.displayName}
            </option>
          ))}
        </Select>
      </Field>

      {isLoading ? (
        <p role="status">Loading timeline…</p>
      ) : isError ? (
        <p role="alert">Could not load the timeline.</p>
      ) : data ? (
        <TimelineAxis timeline={data} />
      ) : null}
    </section>
  );
}
