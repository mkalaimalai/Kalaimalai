"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Field,
  Select,
} from "@/shared/ui";
import { ApproximateDate } from "@/shared/kernel";
import type {
  TimelineDTO,
  TimelineEntryDTO,
  TimelineScopeDTO,
} from "../application/dtos";
import { useBuildTimelineQuery } from "./api";

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

function yearOf(entry: TimelineEntryDTO): number {
  return entry.date.year;
}

function formatEntryDate(entry: TimelineEntryDTO): string {
  return ApproximateDate.fromJSON(entry.date).format();
}

const KIND_LABEL: Record<TimelineEntryDTO["kind"], string> = {
  birth: "Birth",
  passing: "Passing",
  memory: "Memory",
};

/** Pure presentational timeline grouped by year. Accepts a ready DTO. */
export function TimelineList({ timeline }: { timeline: TimelineDTO }) {
  const groups = React.useMemo(() => groupByYear(timeline.entries), [
    timeline.entries,
  ]);

  if (groups.length === 0) {
    return (
      <p className="text-muted-foreground" role="status">
        No timeline entries yet.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-6" aria-label="Family timeline">
      {groups.map(({ year, entries }) => (
        <li key={year}>
          <h2 className="mb-2 text-xl font-semibold">{year}</h2>
          <ul className="flex flex-col gap-3">
            {entries.map((entry) => (
              <li key={entry.id}>
                <Card>
                  <CardHeader>
                    <CardTitle>{entry.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                    <span>{KIND_LABEL[entry.kind]}</span>
                    <span aria-hidden>·</span>
                    <time>{formatEntryDate(entry)}</time>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function groupByYear(
  entries: readonly TimelineEntryDTO[],
): { year: number; entries: TimelineEntryDTO[] }[] {
  const groups: { year: number; entries: TimelineEntryDTO[] }[] = [];
  for (const entry of entries) {
    const year = yearOf(entry);
    const last = groups[groups.length - 1];
    if (last && last.year === year) {
      last.entries.push(entry);
    } else {
      groups.push({ year, entries: [entry] });
    }
  }
  return groups;
}

/**
 * Container: vertical chronological timeline with a scope switcher
 * (Whole family / Maternal / Paternal / a specific person). Groups by year.
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
        <TimelineList timeline={data} />
      ) : null}
    </section>
  );
}
