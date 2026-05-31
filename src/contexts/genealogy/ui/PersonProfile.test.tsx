import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { PersonProfileDTO } from "../application/dtos";
import { PersonProfile } from "./PersonProfile";

const profile: PersonProfileDTO = {
  person: {
    id: "kid",
    legalName: "Meena Kumar",
    nickname: "Meenu",
    displayName: "Meenu",
    gender: "Female",
    birth: { year: 1995, month: 6, day: 12 },
    passing: null,
    birthplace: "Chennai",
    currentLocation: null,
    bio: "Loves gardening.",
    visibility: "Public",
    branch: "Maternal",
    isDeceased: false,
    isUnlisted: false,
  },
  relationships: [
    {
      relationship: {
        id: "e1",
        type: "ParentOf",
        fromPersonId: "dad",
        toPersonId: "kid",
        qualifier: null,
      },
      relation: "father",
      person: {
        id: "dad",
        legalName: "Raj Kumar",
        nickname: null,
        displayName: "Raj Kumar",
        gender: "Male",
        birth: { year: 1965, month: null, day: null },
        passing: null,
        birthplace: null,
        currentLocation: null,
        bio: null,
        visibility: "Public",
        branch: "Maternal",
        isDeceased: false,
        isUnlisted: false,
      },
    },
  ],
};

describe("PersonProfile", () => {
  it("renders the person's display name and formatted birth date", () => {
    render(<PersonProfile profile={profile} />);
    expect(screen.getByRole("heading", { name: "Meenu" })).toBeInTheDocument();
    expect(screen.getByText("June 12, 1995")).toBeInTheDocument();
    expect(screen.getByText("Loves gardening.")).toBeInTheDocument();
  });

  it("lists relationships with their plain-language relation", () => {
    render(<PersonProfile profile={profile} />);
    expect(screen.getByText("Raj Kumar")).toBeInTheDocument();
    expect(screen.getByText("father")).toBeInTheDocument();
  });

  it("invokes onSelectPerson when a relationship is clicked", () => {
    const onSelect = vi.fn();
    render(<PersonProfile profile={profile} onSelectPerson={onSelect} />);
    fireEvent.click(screen.getByText("Raj Kumar"));
    expect(onSelect).toHaveBeenCalledWith("dad");
  });
});
