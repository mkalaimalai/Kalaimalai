"use client";

import * as React from "react";
import type { ReminderDTO } from "@/contexts/reminders";
import {
  CalendarView,
  defaultOnSendWish,
} from "@/contexts/reminders/ui/CalendarView";
import { useListUpcomingRemindersQuery } from "@/contexts/reminders/ui/api";
import { useSendOutboundMutation } from "@/contexts/notifications/ui/api";

export default function CalendarPage() {
  const { data: reminders, isLoading } = useListUpcomingRemindersQuery({
    windowDays: 90,
  });
  const [sendOutbound] = useSendOutboundMutation();

  // Wire the reminder's "Send wish" to the Notifications stub: it records the
  // intent ("would send") and the default also opens a WhatsApp share link.
  const onSendWish = React.useCallback(
    (reminder: ReminderDTO) => {
      const intent = defaultOnSendWish(reminder);
      void sendOutbound({
        channel: "WhatsApp",
        to: "family",
        body: intent.message,
        occasion: reminder.kind,
        deepLink: intent.whatsAppLink,
      });
    },
    [sendOutbound],
  );

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-bold">Calendar</h1>
        <p className="text-muted-foreground">
          Upcoming birthdays, anniversaries, and festivals.
        </p>
      </div>
      {isLoading || !reminders ? (
        <p className="text-muted-foreground">Loading reminders…</p>
      ) : (
        <CalendarView reminders={reminders} onSendWish={onSendWish} />
      )}
    </div>
  );
}
