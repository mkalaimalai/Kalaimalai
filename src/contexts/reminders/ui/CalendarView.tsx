"use client";

import * as React from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/ui";
import type { ReminderDTO } from "../application/dtos";
import { getSuggestedGreeting } from "../application/get-suggested-greeting";

/**
 * Build a `https://wa.me/?text=...` deep-link with URL-encoded prefilled text.
 * Kept inline so this context never imports the Notifications context (the
 * integrator may override `onSendWish` to route through Notifications instead).
 */
function buildWhatsAppShareLink(text: string): string {
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

/** The "would send" intent surfaced when a wish is sent. */
export interface SendWishIntent {
  readonly reminder: ReminderDTO;
  readonly message: string;
  readonly whatsAppLink: string;
}

/**
 * Default send-wish behavior: derive a suggested greeting for the occasion and
 * open a WhatsApp share deep-link (manual share — PRD F6.2). Returns the intent
 * so callers/tests can inspect what "would send".
 */
export function defaultOnSendWish(reminder: ReminderDTO): SendWishIntent {
  const name =
    reminder.kind === "festival"
      ? reminder.title
      : reminder.title.replace(/'s birthday$/, "");
  const { message } = getSuggestedGreeting({
    occasionKind: reminder.kind,
    name,
  });
  const whatsAppLink = buildWhatsAppShareLink(message);
  if (typeof window !== "undefined") {
    window.open(whatsAppLink, "_blank", "noopener,noreferrer");
  }
  return { reminder, message, whatsAppLink };
}

const KIND_LABEL: Record<ReminderDTO["kind"], string> = {
  birthday: "Birthday",
  anniversary: "Anniversary",
  festival: "Festival",
};

function formatDate(date: ReminderDTO["date"]): string {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "long",
    day: "numeric",
  }).format(new Date(Date.UTC(date.year, date.month - 1, date.day)));
}

function whenLabel(daysUntil: number): string {
  if (daysUntil === 0) return "Today";
  if (daysUntil === 1) return "Tomorrow";
  return `in ${daysUntil} days`;
}

export interface ReminderCardProps {
  readonly reminder: ReminderDTO;
  readonly onSendWish: (reminder: ReminderDTO) => void;
}

export function ReminderCard({ reminder, onSendWish }: ReminderCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{reminder.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {KIND_LABEL[reminder.kind]} · {formatDate(reminder.date)} ·{" "}
          {whenLabel(reminder.daysUntil)}
        </p>
      </CardHeader>
      <CardContent>
        <Button
          variant="primary"
          onClick={() => onSendWish(reminder)}
          aria-label={`Send a wish for ${reminder.title}`}
        >
          Send wish
        </Button>
      </CardContent>
    </Card>
  );
}

export interface CalendarViewProps {
  readonly reminders: ReminderDTO[];
  /**
   * Called when a card's "Send wish" button is tapped. The integrator wires this
   * to the Notifications module; defaults to a WhatsApp share deep-link.
   */
  readonly onSendWish?: (reminder: ReminderDTO) => void;
}

/**
 * CalendarView — presentational list of upcoming reminder cards
 * (TECHNICAL_DESIGN §10.4). Takes DTO props; a container supplies them via the
 * `useListUpcomingRemindersQuery` hook.
 */
export function CalendarView({
  reminders,
  onSendWish = defaultOnSendWish,
}: CalendarViewProps) {
  if (reminders.length === 0) {
    return (
      <p className="text-muted-foreground" role="status">
        No upcoming reminders.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-4" aria-label="Upcoming reminders">
      {reminders.map((reminder) => (
        <li key={reminder.id}>
          <ReminderCard reminder={reminder} onSendWish={onSendWish} />
        </li>
      ))}
    </ul>
  );
}
