# Reminders (Calendar) context

Downstream, derivation-only context (TECHNICAL_DESIGN §10.4): surfaces upcoming
**birthdays**, **anniversaries**, and **festivals**, and suggests a friendly
greeting to send. It derives data from Genealogy via an injected read port and
from a data-driven festival calendar. It imports **no** other context's code.

## Public module surface (`reminders.module.ts`)

`createRemindersModule(deps: SharedDeps, reads: { people: PeopleReadPort }): RemindersModule`

| Method | Signature | Notes |
|---|---|---|
| `listUpcomingReminders` | `({ windowDays }) => Promise<ReminderDTO[]>` | Birthdays (from people) + festivals (from calendar) whose next occurrence is within `windowDays` of today, sorted soonest-first. Excludes Unlisted people. |
| `getSuggestedGreeting` | `({ occasionKind, name? }) => Promise<SuggestedGreetingDTO>` | A ready-to-send friendly message for the occasion. |

`ReminderDTO`: `{ id, kind: 'birthday' | 'anniversary' | 'festival', title, date: { year, month, day }, daysUntil, personIds }` — plain & serializable.

### Read port the integrator must supply (second factory arg)

```ts
interface PeopleReadPort {
  listPeople(): Promise<PersonView[]>;          // @/shared/views
  listRelationships(): Promise<RelationshipView[]>;
}
```

Implement it by delegating to the Genealogy module's view query methods
(`listPeopleViews` / `listRelationshipViews`). Wire in the composition root:

```ts
const reminders = createRemindersModule(deps, {
  people: {
    listPeople: () => genealogy.listPeopleViews(),
    listRelationships: () => genealogy.listRelationshipViews(),
  },
});
setContainer({ ...existing, reminders });
```

`index.ts` augments `AppContainer` with `reminders: RemindersModule`.

## Hooks (`ui/api.ts`)

Endpoints are injected into the shared RTK Query `api` and tagged `Reminder`:

- `useListUpcomingRemindersQuery({ windowDays })`
- `useGetSuggestedGreetingQuery({ occasionKind, name? })`
- `useLazyGetSuggestedGreetingQuery()`

## `/calendar` route component

`ui/CalendarView.tsx` (client) — `CalendarView`:

```tsx
"use client";
import { CalendarView } from "@/contexts/reminders/ui/CalendarView";
import { useListUpcomingRemindersQuery } from "@/contexts/reminders/ui/api";

export default function CalendarPage() {
  const { data = [] } = useListUpcomingRemindersQuery({ windowDays: 60 });
  return <CalendarView reminders={data} />;
}
```

Renders a list of reminder cards (birthdays/anniversaries/festivals) each with a
one-tap **Send wish** button.

### `onSendWish` integration

`CalendarView` accepts an optional `onSendWish(reminder)` prop. The default
(`defaultOnSendWish`) derives a suggested greeting and opens a
`https://wa.me/?text=...` deep-link (manual share, PRD F6.2) — built **inline**,
so this context never imports Notifications. The integrator may override it to
route through the Notifications module instead.

## Notes / MVP limitations

- **Birthdays** require a day-precise birth (`month` + `day`). Year-only or
  year-month births are skipped.
- **Anniversaries**: `PersonView` / `RelationshipView` carry no marriage date, so
  the MVP has no data source for anniversaries and skips them gracefully. The
  `'anniversary'` kind is reserved for when a marriage date is available upstream.
- **Festivals** are data-driven (`domain/festival-calendar.ts`). Solar/civil
  festivals use exact fixed Gregorian dates; lunar/luni-solar ones (Diwali, Holi)
  are pinned to a representative fixed date and flagged `approximate: true` for
  the MVP — replace with an ephemeris later.
- `NextOccurrenceService` is timezone-aware via the Clock's `today(timeZone)`,
  wraps to next year once an occasion has passed, and clamps Feb 29 to Feb 28 in
  non-leap years.
