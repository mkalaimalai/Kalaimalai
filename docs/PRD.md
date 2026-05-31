# Family Fabric — Product Requirements Document

| | |
|---|---|
| **Product** | Family Fabric |
| **Version** | 1.0 |
| **Status** | Approved for MVP build |
| **Author** | Madhu (Product Owner / Architect) |
| **Last updated** | 31 May 2026 |
| **Intended use** | Authoritative product spec — hand to engineering / Claude Code to build the MVP. Architecture, data model, and stack are deliberately out of scope here and belong in a separate design document. |

> **Provenance.** This PRD unifies three independent drafts (`PRD-gpt.md`,
> `PRD-gemini.md`, `PRD-claude.md`), resolving their conflicts into a single
> decisive direction. The source drafts remain in `docs/` for reference.

---

## 1. Vision & Problem Statement

### 1.1 The "why" — emotional

Large extended families — spanning both maternal and paternal sides, scattered
across cities, countries, and time zones — slowly drift apart. Not from any rift,
but from the quiet erosion of busy lives: missed birthdays, milestones noticed too
late, cousins who become strangers, elders whose stories go unrecorded. Public
social media doesn't fix this; it buries family moments under noise, ads, and
acquaintances, and it is hostile to elders and to privacy.

**Vision:** a single, private, lasting digital home for the whole extended family —
a place that *preserves who we are* (our tree, our faces, our history) and *gives us
reasons to keep showing up for each other*, no matter where in the world we live. We
are weaving a "love fabric" across the family.

### 1.2 The "why" — practical

- We have **no shared, permanent record** of the family tree across both sides.
- Family photos are **fragmented** across phones, drives, and chat threads, and
  **un-findable** ("who is in this photo? where are all the photos of grandma?").
- Family **history exists only in the memories of elders** and is being lost.
- Our coordination happens in a **WhatsApp group that has no memory** — wishes
  scroll away, nothing is preserved, nothing is structured.

### 1.3 What this is *not*

Not a public social network. Not a genealogy research product competing with
Ancestry/MyHeritage. Not a generic photo backup. Not a replacement for WhatsApp
chat. It is a **warm, closed, multi-generational family home**.

---

## 2. Goals & Non-Goals

### 2.1 Goals (MVP horizon)

1. Give the family one private, invite-only space accessible on web and mobile,
   worldwide.
2. Preserve the family tree across both maternal and paternal sides.
3. Make every memory (photo + context) findable by person, time, and event.
4. Create lightweight, recurring reasons to stay connected (reminders, prompts,
   reactions).

### 2.2 Non-Goals (explicitly out of scope)

- DNA matching, historical records, or genealogy "discoveries."
- Replacing WhatsApp as a real-time chat app.
- Public discoverability or any non-family access.
- Monetization. This is a family good, not a business (hosting cost is addressed as
  an open question, not a revenue model).

---

## 3. Success Metrics

| Type | Metric | Why it matters |
|---|---|---|
| **North Star** | % of invited family members who are **monthly active** | The whole point is staying connected — adoption across generations is the real test. |
| Activation | % of invited members who complete onboarding (join + view tree + see one memory) | Friction kills family apps; elders especially. |
| Depth | # memories (photos/stories) added per month | Is the archive alive or static? |
| Coverage | # people in the tree with ≥1 photo tagged | Completeness of the "love fabric." |
| Connection | # reactions / comments / wishes per active member per month | Are we *interacting*, not just storing? |
| Retention | 3-month and 12-month return rates | Family apps must outlive their novelty. |

---

## 4. Personas

> A deliberately multi-generational set. Designing for the *least technical* member
> is the hardest and most important constraint.

**P1 — The Historian / Admin ("the keeper").**
The driving force. Wants control over the tree, structure, and quality. Uploads the
bulk of old photos, defines relationships, invites people, moderates, and organizes
family events. Needs powerful tools and bulk actions. Tech-comfortable.

**P2 — The Elder Viewer ("Grandma/Grandpa").**
60s–80s, low tech confidence, possible large-font / accessibility needs, may be on
an older phone. Primarily wants to *view* photos and faces of loved ones and feel
included; later, to record their stories with near-zero typing. May need someone to
set them up. **This persona's success defines the product's success.**

**P3 — The Diaspora Member ("the cousin abroad").**
20s–40s, lives overseas, mobile-first, time-zone-shifted, busy. Wants quick glances,
reminders so they don't miss birthdays, and an easy way to react and send wishes.
Low tolerance for friction.

**P4 — The Casual Contributor ("the aunt/uncle").**
Mid-life, moderate tech. Occasionally posts a photo from an event, comments, and
reacts. Won't maintain the tree but enriches the archive. Needs a dead-simple "add a
memory."

**P5 — The Next Generation ("the kids/teens").**
Will inherit this and should not find it embarrassing. Mostly viewers now; future
timeline subjects and stewards. Design with their future ownership in mind.

---

## 5. Functional Requirements

### F1 — Family Tree (dual-sided)

- **F1.1** Represent both maternal and paternal sides in a single connected tree,
  navigable from the logged-in user's node.
- **F1.2** Each person is a profile: name (legal + nickname), gender, date of birth,
  date of passing (with living/deceased toggle), birthplace, current location,
  bio/notes, relationships, and links to their memories.
- **F1.3** Support real-family complexity: marriages, remarriages, in-laws bridging
  the two sides, adoption, step-relations, deceased members, living members, and
  "private/unlisted" members. Support incomplete or unknown relationships.
- **F1.4** Visual, zoomable, pannable tree; tap a person → their profile. Filter/view
  by branch.
- **F1.5** Collaborative editing with permissions: members can suggest additions and
  corrections; **the admin approves structural changes**. Keep a clear owner.
- **F1.6** Import/export via **GEDCOM** so the tree is portable and never locked in.

### F2 — Photo / Memory Archive

- **F2.1** Upload photos and short videos with metadata: date (or approximate year),
  place, event, people, and a caption/story.
- **F2.2** Every memory is linkable to one or more people in the tree, and to events.
- **F2.3** Group memories into albums / events (e.g., "Diwali 2019," "Wedding 1998").
- **F2.4** Bulk upload for the Historian; one-tap "add a memory" for casual
  contributors.
- **F2.5** Original-quality, durable storage — the family's photos are irreplaceable
  (see N3). Generate responsive thumbnails/derivatives on upload.
- **F2.6** Filter and search memories by person, year, event, or branch.

### F3 — Face-Recognition Retrieval *(headline feature — Phase 1)*

- **F3.1** Detect faces in uploaded photos and cluster faces believed to be the same
  person.
- **F3.2** Suggest tags ("Is this Uncle Raj?"); members/admin confirm or reject.
- **F3.3** Once confirmed, link the face cluster → the tree profile.
- **F3.4** **Click a person → surface every photo they appear in.** This is the
  headline retrieval experience.
- **F3.5** Tolerate aging across decades (childhood → present).
- **F3.6** **Biometric consent is mandatory** (see §8): recognition is opt-in per
  person, withdrawable, with clear data handling. Face data is treated as the most
  sensitive asset in the system.

*MVP note:* the archive ships first with **manual person tagging** (F2.2); automated
face recognition is the Phase 1 upgrade and reuses the same tag/confirm UX.

### F4 — Chronological Timeline

- **F4.1** A family-wide timeline from earliest records → present, in sequence.
- **F4.2** Place memories, milestones, births, weddings, and events in time.
- **F4.3** Filter by person (one person's life timeline), by branch, or whole-family.
- **F4.4** **"On this day"** resurfacing of past memories — a recurring reason to
  return (Phase 1).

### F5 — Staying-Connected (social layer)

- **F5.1** Birthday & anniversary reminders, auto-derived from the tree.
- **F5.2** Festival reminders — configurable, with support for variable lunar/solar
  and regional festival dates (Diwali, Eid, Christmas, etc.).
- **F5.3** Reactions, comments, and "wishes" on memories and on people's days, with
  suggested greeting templates.
- **F5.4** A light activity feed ("3 new photos from the Hyderabad trip," "It's
  Meena's birthday today").
- **F5.5** Memory prompts to elders/members ("Tell us the story behind this photo")
  to keep the archive growing (Phase 1).

### F6 — WhatsApp Integration *(outbound only)*

- **F6.1** **Outbound notifications to WhatsApp** — birthday/anniversary reminders,
  festival nudges, "new memory added" — via a supported messaging channel, with
  deep-links back into the app.
- **F6.2** **Deep-link sharing** — one tap to share a memory, album, or event link
  into the family WhatsApp group manually.
- **F6.3** **Rejected approach (documented, not built):** mirroring or scraping the
  existing personal WhatsApp group's content into the app. The official Meta Cloud
  API cannot read a personal group; unofficial libraries (e.g. Baileys/WAHA) that
  QR-pair a phone **violate WhatsApp's Terms of Service and risk number bans**. This
  is unacceptable for a product meant to last decades. WhatsApp is an *outbound
  notification channel and deep-link target only*. Revisit only if a compliant path
  emerges (see §10, Phase 3).

### F7 — Platforms & Access

- **F7.1** Responsive **web app** (any browser, any country).
- **F7.2** **Mobile experience via PWA** for the MVP; native apps later (Phase 2).
- **F7.3** **Invite-only onboarding** via a shareable, expiring invite link, with
  admin approval of new members.
- **F7.4** Global accessibility: works on modest bandwidth and older devices; lazy-
  loaded media.

---

## 6. Non-Functional Requirements

- **N1 — Privacy (the defining NFR).** Strictly family-only. **No** public access,
  **no** search-engine indexing, **no** ads, **no** third-party tracking or data
  mining. Granular visibility (mark people/memories as restricted — minors,
  sensitive relationships). Right to delete: any member can remove their own content
  and biometric data.
- **N2 — Security.** Encryption in transit and at rest; encrypted backups. Role-based
  access (Admin / Member / View-only-Elder). Secure invite + auth flow
  (passwordless / magic-link friendly for elders). Audit log for edits.
- **N3 — Durability & Storage.** Photos are irreplaceable → durable object storage
  with versioning and backup; no silent data loss; export always available. Plan for
  thousands of high-res photos plus video over years.
- **N4 — Scalability.** Designed for ~50–500 family members and tens of thousands of
  media items — *not* millions. Right-size; do not over-engineer.
- **N5 — Usability & Accessibility.** Elder-first: large tap targets, large fonts,
  minimal navigation depth, no jargon. One-handed mobile use; offline-tolerant
  viewing. WCAG-aligned contrast and screen-reader support.
- **N6 — Internationalization.** Multi-language UI (at minimum English + relevant
  regional Indian language(s)); time-zone-aware reminders; locale-aware dates and
  festivals.
- **N7 — Performance.** Fast first paint and image loading on modest connections;
  responsive thumbnails; lazy-loading.
- **N8 — Cost-efficiency.** A family good with no revenue → a predictable, low
  monthly hosting footprint is a real constraint.

---

## 7. Privacy & Data Governance

Face recognition processes **biometric data** — among the most regulated categories.
This is a hard gate, not a footnote.

- **India — DPDP Act 2023:** consent-based processing; honor data-principal rights
  (access, correction, erasure). Relevant given the family base in India.
- **EU/UK — GDPR:** biometric data used for unique identification is "special
  category," requiring explicit consent and strong safeguards. Relevant if any
  relatives reside in the EU/UK.
- **US — state biometric laws (e.g., Illinois BIPA):** consent/notice requirements;
  relevant given US-based family.

**Design implications:**

- Face recognition is **opt-in per person**, with plain-language consent and one-tap
  withdrawal.
- Store face embeddings separately and encrypted; allow full deletion of an
  individual's biometric models.
- Prefer keeping recognition/embeddings **under family control** (self-hosted or
  single-region) over a third-party face API, to simplify the consent story
  (final build-vs-buy decision in §10).
- **Minors:** extra protection, guardian consent, and restricted visibility by
  default.

---

## 8. Competitive Landscape

Studied as references for what to copy, what to avoid, and where the gap is.

| Category | Examples | Borrow | Gap vs. our vision |
|---|---|---|---|
| Private family social networks | [Kintree](https://kintree.com), [Kinscape](https://kinscape.com), [Familink](https://familink.io), Family.Space | Private feed + tree in one place; elder angle | Light on archive depth & face recognition |
| Tree + face recognition | [MyHeritage](https://www.myheritage.com) (Photo Tagger), [Geni](https://www.geni.com), [WikiTree](https://www.wikitree.com) | *Reference* for face clustering / tag-once / click-person-see-all-photos / aging tolerance; collaborative tree merges; copyable biometric-consent model | Genealogy-first; cold/research-flavored, not a *home* |
| Memory / timeline archives | [FamilyAlbum](https://family-album.com), [Tinybeans](https://tinybeans.com), [Memory Murals](https://www.memorymurals.com), Storyworth / Remento | Free unlimited date-organized storage; milestone prompts; multi-generational voice/story capture | Weak family-tree model; limited relationship intelligence |

**The gap (our wedge):** no single product nails *all four* — collaborative dual-side
tree + face-recognition retrieval + chronological multi-generational timeline + an
active staying-connected layer — for a *closed extended family*. MyHeritage owns
tree+faces but is cold and research-flavored; social players are light on archive
depth and faces.

**Positioning:** a warm, private, multi-generational family **home** — not a
genealogy database, not another feed.

---

## 9. Scope & Phased Roadmap

### Phase 0 — MVP ("the family shows up and it's alive")

- **F1** Family tree (dual-sided, visual, admin-owned, GEDCOM import/export)
- **F2** Photo/memory archive with people-linking (manual tagging), albums, captions
- **F4.1–F4.3** Timeline (chronological view + filter by person/branch)
- **F5.1–F5.4** Birthday/festival reminders + reactions/comments/wishes + activity
  feed
- **F6.1** Outbound WhatsApp/notification reminders (feasible slice only)
- **F7** Web (responsive) + PWA, invite-only onboarding
- **N1, N2, N3, N5** (privacy, security, durability, elder-usability) built in from
  day one — not retrofitted

### Phase 1 — The headline feature

- **F3** Face-recognition retrieval (with the full consent flow of §7)
- **F4.4** "On this day" resurfacing
- **F5.5** Memory prompts to elders

### Phase 2 — Depth & reach

- Native mobile apps
- Voice/video memories & elder story capture (with transcription)
- Multi-language UI (**N6**)
- Richer collaborative tree editing (**F1.5**)

### Phase 3 — Stretch / decisions

- Deeper WhatsApp integration *only if* a compliant path emerges (**F6.3**)
- AI features: relationship explainer, life-story/biography summaries, semantic
  memory search, photo enhancement/colorization, auto-captioning, family-newsletter
  digests
- Heritage recipe vault
- Geospatial family map

---

## 10. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| Members don't contribute regularly | Weekly memory prompts; dead-simple uploads; let younger members contribute on behalf of elders; use WhatsApp reminders to bring people back. |
| Privacy concerns | Invite-only access; consent-based tagging; strong permissions; easy removal; clear family data policy. |
| Incorrect family relationships | Admin approval workflow; correction-request process; confidence level for uncertain links; source notes for facts. |
| Face-recognition sensitivity | Start with manual tagging; add AI only after explicit consent; allow opt-out; keep face data private/in-family. |
| Scope creep | Ship the Phase-0 MVP first; everything ambitious is explicitly phased (§9). |

---

## 11. Open Questions

1. **Family scale:** roughly how many people in the tree, and how many likely active
   members across generations?
2. **Photo volume:** rough count of existing photos to migrate (hundreds? thousands?
   tens of thousands?), and where they live now.
3. **Admins:** just you, or a small group across both sides?
4. **Face recognition build-vs-buy:** comfortable with a third-party face API for
   speed, or keep recognition fully in-family even if it's more work? (§7 leans
   in-family for the consent story — confirm.)
5. **Hosting:** fully managed cloud (less ops) vs. self-hosted (more control, lower
   cost)? Any existing cloud to anchor to? (Relates to **N8**.)
6. **Languages:** which languages must the MVP support beyond English?
7. **Deceased & sensitive members:** how to handle deceased relatives, estrangements,
   adoptions, and "private" members in the tree?
8. **Cost-sharing:** purely your gift to the family, or shared hosting cost?

---

## 12. Assumptions & Glossary

**Assumptions:** invite-only and closed; the family is globally distributed; elders
are first-class users; the product must *last decades*, so data portability (GEDCOM,
photo export) is non-negotiable.

**Glossary:**
- **GEDCOM** — standard genealogy data-exchange format.
- **Face embedding** — numeric vector representing a face, used for
  clustering/matching.
- **PWA** — Progressive Web App (installable web app; MVP-friendly cross-platform).
- **Biometric data** — legally sensitive personal data including facial-recognition
  models.

---

> **Next step:** a separate **technical design document** will cover architecture,
> data model, stack, and the face-recognition build-vs-buy decision. This PRD
> intentionally stays at the product/requirements level.
