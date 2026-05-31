import type { TimelineEntryDTO } from "../application/dtos";

/**
 * Pure layout for the horizontal, year-based timeline. Maps each entry to a
 * position (0–100%) along a year axis, alternates entries above/below the line,
 * and stacks near-coincident entries so cards don't overlap. Kept pure so it is
 * unit-testable and the renderer stays a thin view.
 */

export type TimelineLane = "top" | "bottom";

export interface AxisEntry {
  entry: TimelineEntryDTO;
  /** Position along the axis, 0–100. */
  xPct: number;
  lane: TimelineLane;
  /** Stacking depth within the lane (0 nearest the axis) to avoid overlap. */
  laneIndex: number;
  yearFrac: number;
}

export interface AxisTick {
  year: number;
  xPct: number;
}

export interface AxisLayout {
  entries: AxisEntry[];
  ticks: AxisTick[];
  minYear: number;
  maxYear: number;
  spanYears: number;
}

export interface AxisOptions {
  /** Minimum horizontal gap (in %) before an entry is stacked outward. */
  collisionGapPct?: number;
}

/** A fractional year so months/days nudge an entry along the axis. */
export function yearFraction(date: TimelineEntryDTO["date"]): number {
  const month = date.month ?? 1;
  const day = date.day ?? 1;
  return date.year + (month - 1) / 12 + (day - 1) / 372;
}

const NICE_STEPS = [1, 2, 5, 10, 20, 25, 50, 100];

function niceStep(span: number): number {
  for (const step of NICE_STEPS) {
    if (span / step <= 9) return step;
  }
  return NICE_STEPS[NICE_STEPS.length - 1]!;
}

export function layoutTimelineAxis(
  entries: readonly TimelineEntryDTO[],
  options: AxisOptions = {},
): AxisLayout {
  const gap = options.collisionGapPct ?? 6;

  if (entries.length === 0) {
    return { entries: [], ticks: [], minYear: 0, maxYear: 0, spanYears: 0 };
  }

  const withFrac = entries.map((entry) => ({
    entry,
    yearFrac: yearFraction(entry.date),
  }));

  const fracs = withFrac.map((e) => e.yearFrac);
  let minYear = Math.floor(Math.min(...fracs));
  let maxYear = Math.ceil(Math.max(...fracs));
  if (minYear === maxYear) {
    minYear -= 1;
    maxYear += 1;
  }
  // Pad to whole years so the first/last entries aren't hard against the edge.
  minYear -= 1;
  maxYear += 1;
  const spanYears = maxYear - minYear;

  const xOf = (yearFrac: number) =>
    ((yearFrac - minYear) / spanYears) * 100;

  // Sort chronologically for stable lane assignment.
  const sorted = [...withFrac].sort((a, b) => a.yearFrac - b.yearFrac);

  const lastXByLaneIndex: Record<TimelineLane, number[]> = {
    top: [],
    bottom: [],
  };

  const placed: AxisEntry[] = sorted.map((item, i) => {
    const lane: TimelineLane = i % 2 === 0 ? "top" : "bottom";
    const xPct = xOf(item.yearFrac);
    // Find the lowest stack index in this lane that clears the collision gap.
    const lastXs = lastXByLaneIndex[lane];
    let laneIndex = 0;
    while (
      lastXs[laneIndex] !== undefined &&
      xPct - (lastXs[laneIndex] as number) < gap
    ) {
      laneIndex += 1;
    }
    lastXs[laneIndex] = xPct;
    return { entry: item.entry, xPct, lane, laneIndex, yearFrac: item.yearFrac };
  });

  // Year ticks at "nice" intervals across the span.
  const step = niceStep(spanYears);
  const ticks: AxisTick[] = [];
  const firstTick = Math.ceil(minYear / step) * step;
  for (let y = firstTick; y <= maxYear; y += step) {
    ticks.push({ year: y, xPct: xOf(y) });
  }

  return { entries: placed, ticks, minYear, maxYear, spanYears };
}
