# Notifications context (outbound STUB)

Generic supporting context for **outbound** delivery (TECHNICAL_DESIGN §10.7,
PRD F6.1/F6.2). Phase 0 is a **stub only**: it records intent and surfaces a
"would send" toast — it does **not** actually deliver, and does **no** contact or
group scraping (PRD F6.3 explicitly excluded).

Reminders and Engagement call `sendOutbound` via the container; they do not import
this context's code.

## Module (`createNotificationsModule(deps: SharedDeps): NotificationsModule`)

Wired into the container at the `notifications` key.

| Method | Signature | Notes |
|---|---|---|
| `sendOutbound` | `(input: SendOutboundInput) => Promise<Result<SendOutboundResult>>` | Mints an id, stamps delivery time, records intent. Rejects empty `to`/`body`. |
| `listSent` | `() => Promise<OutboundNotificationLogDTO[]>` | Recorded log, most-recent-first. |
| `buildWhatsAppDeepLink` | `(input: WhatsAppDeepLinkInput) => string` | `https://wa.me/?text=…` (optionally number-targeted) for manual share (F6.2). |

`SendOutboundInput` = `OutboundNotification` without `id`:
`{ channel: 'WhatsApp' | 'Email'; to; subject?; body; occasion?; deepLink? }`.

## Infrastructure

`StubNotificationSender` implements the `NotificationSender` port. It records each
notification to a `Collection`-backed log under namespace `ff:notifications:log`
and resolves ok with a `deliveredAt` timestamp from the `Clock`.

## UI hooks (`ui/api.ts`)

RTK Query endpoints injected into the shared `api` (tag: `Notification`):

- `useListSentQuery()` → `OutboundNotificationLogDTO[]`
- `useSendOutboundMutation()` → `[trigger, state]`

## UI components

- `WouldSendToast` — presentational toast content showing intent
  ("Would send a WhatsApp to …") plus a copyable deep-link. `"use client"`,
  accessible (`role="status"`, labelled input, ≥44px targets).
