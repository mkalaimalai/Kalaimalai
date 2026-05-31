import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ApproximateDate } from "@/shared/kernel";
import type { TimelineDTO } from "../application/dtos";
import { TimelineAxis } from "./TimelineView";

const day = (y: number, m: number, d: number) =>
  ApproximateDate.day(y, m, d).toJSON();

const TIMELINE: TimelineDTO = {
  scope: { kind: "WholeFamily" },
  entries: [
    {
      id: "birth:p1",
      kind: "birth",
      date: day(1950, 3, 15),
      sortKey: ApproximateDate.day(1950, 3, 15).sortKey(),
      title: "Asha was born",
      personIds: ["p1"],
    },
    {
      id: "memory:m1",
      kind: "memory",
      date: day(1950, 8, 1),
      sortKey: ApproximateDate.day(1950, 8, 1).sortKey(),
      title: "A picnic",
      personIds: ["p1"],
      memoryId: "m1",
    },
    {
      id: "birth:p2",
      kind: "birth",
      date: day(1980, 1, 1),
      sortKey: ApproximateDate.day(1980, 1, 1).sortKey(),
      title: "Ravi was born",
      personIds: ["p2"],
    },
  ],
};

describe("TimelineAxis", () => {
  it("renders entry titles along the horizontal axis", () => {
    render(<TimelineAxis timeline={TIMELINE} />);
    expect(screen.getByText("Asha was born")).toBeInTheDocument();
    expect(screen.getByText("A picnic")).toBeInTheDocument();
    expect(screen.getByText("Ravi was born")).toBeInTheDocument();
  });

  it("labels entries with their kind", () => {
    render(<TimelineAxis timeline={TIMELINE} />);
    // Two births and one memory → kind labels appear (legend + cards).
    expect(screen.getAllByText("Birth").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Memory").length).toBeGreaterThanOrEqual(1);
  });

  it("shows year tick labels spanning the entries", () => {
    render(<TimelineAxis timeline={TIMELINE} />);
    // The span 1950–1980 should surface round-number year ticks.
    expect(screen.getByText("1950")).toBeInTheDocument();
    expect(screen.getByText("1980")).toBeInTheDocument();
  });

  it("shows an empty state when there are no entries", () => {
    render(
      <TimelineAxis timeline={{ scope: { kind: "WholeFamily" }, entries: [] }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/no timeline entries/i);
  });
});
