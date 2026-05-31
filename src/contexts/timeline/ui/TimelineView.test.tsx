import { describe, expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ApproximateDate } from "@/shared/kernel";
import type { TimelineDTO } from "../application/dtos";
import { TimelineList } from "./TimelineView";

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

describe("TimelineList", () => {
  it("groups entries by year with a heading per year", () => {
    render(<TimelineList timeline={TIMELINE} />);
    const headings = screen.getAllByRole("heading", { level: 2 });
    expect(headings.map((h) => h.textContent)).toEqual(["1950", "1980"]);
  });

  it("renders entry titles and kind labels", () => {
    render(<TimelineList timeline={TIMELINE} />);
    expect(screen.getByText("Asha was born")).toBeInTheDocument();
    expect(screen.getByText("A picnic")).toBeInTheDocument();
    expect(screen.getByText("Ravi was born")).toBeInTheDocument();
  });

  it("places two 1950 entries under the same year group", () => {
    render(<TimelineList timeline={TIMELINE} />);
    const list = screen.getByRole("list", { name: "Family timeline" });
    const firstGroup = within(list).getAllByRole("listitem")[0]!;
    expect(within(firstGroup).getByText("Asha was born")).toBeInTheDocument();
    expect(within(firstGroup).getByText("A picnic")).toBeInTheDocument();
  });

  it("shows an empty state when there are no entries", () => {
    render(
      <TimelineList timeline={{ scope: { kind: "WholeFamily" }, entries: [] }} />,
    );
    expect(screen.getByRole("status")).toHaveTextContent(/no timeline entries/i);
  });
});
