import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReminderDTO } from "../application/dtos";
import { CalendarView, defaultOnSendWish } from "./CalendarView";

const birthday: ReminderDTO = {
  id: "birthday:p1",
  kind: "birthday",
  title: "Meena's birthday",
  date: { year: 2026, month: 6, day: 5 },
  daysUntil: 5,
  personIds: ["p1"],
};

const festival: ReminderDTO = {
  id: "festival:diwali",
  kind: "festival",
  title: "Diwali",
  date: { year: 2026, month: 11, day: 1 },
  daysUntil: 0,
  personIds: [],
};

describe("CalendarView", () => {
  it("renders a card per reminder with title and kind", () => {
    render(<CalendarView reminders={[birthday, festival]} onSendWish={() => {}} />);
    expect(screen.getByText("Meena's birthday")).toBeInTheDocument();
    expect(screen.getByText("Diwali")).toBeInTheDocument();
    expect(screen.getByText(/Today/)).toBeInTheDocument();
    expect(screen.getByText(/in 5 days/)).toBeInTheDocument();
  });

  it("invokes onSendWish with the reminder when the button is tapped", () => {
    const onSendWish = vi.fn();
    render(<CalendarView reminders={[birthday]} onSendWish={onSendWish} />);
    fireEvent.click(
      screen.getByRole("button", { name: /send a wish for Meena's birthday/i }),
    );
    expect(onSendWish).toHaveBeenCalledWith(birthday);
  });

  it("shows an empty state when there are no reminders", () => {
    render(<CalendarView reminders={[]} onSendWish={() => {}} />);
    expect(screen.getByRole("status")).toHaveTextContent(/no upcoming reminders/i);
  });
});

describe("defaultOnSendWish", () => {
  it("builds a wa.me deep-link with a personalized birthday greeting", () => {
    const openSpy = vi.fn();
    vi.stubGlobal("open", openSpy);
    try {
      const intent = defaultOnSendWish(birthday);
      expect(intent.message).toContain("Meena");
      expect(intent.whatsAppLink).toMatch(/^https:\/\/wa\.me\/\?text=/);
      expect(decodeURIComponent(intent.whatsAppLink)).toContain("Meena");
      expect(openSpy).toHaveBeenCalledWith(
        intent.whatsAppLink,
        "_blank",
        "noopener,noreferrer",
      );
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("uses the festival name for a festival wish", () => {
    vi.stubGlobal("open", vi.fn());
    try {
      const intent = defaultOnSendWish(festival);
      expect(intent.message).toContain("Diwali");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
