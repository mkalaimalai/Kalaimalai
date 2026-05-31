# Product Requirements Document — "The Family Hub" (working title)

| | |
|---|---|
| **Version** | 0.1 — Initial Draft |
| **Status** | Draft for iteration |
| **Author** | Madhu (Product Owner / Architect) + Claude (Strategy) |
| **Last updated** | 31 May 2026 |
| **Intended use** | Iterate over several rounds → hand final version to Claude Code for MVP build |

---

## 1. Vision & Problem Statement

### 1.1 The "Why" (Emotional)
Large extended families — spanning both maternal and paternal sides, scattered across continents and time zones — slowly drift apart. Not from any rift, but from the quiet erosion of busy lives: missed birthdays, milestones noticed too late, cousins who become strangers, elders whose stories go unrecorded. Public social media doesn't fix this; it buries family moments under noise, ads, and acquaintances, and it's hostile to elders and to privacy.

**Vision:** A single, private, lasting digital home for the whole extended family — a place that *preserves who we are* (our tree, our faces, our history) and *gives us reasons to keep showing up for each other*, no matter where in the world we live. We are weaving a "love fabric" across the family.

### 1.2 The "Why" (Practical)
- We have **no shared, permanent record** of the family tree across both sides.
- Family photos are **fragmented** across phones, drives, and chat threads, and **un-findable** ("who is in this photo? where are all the photos of grandma?").
- Family history exists only in **the memories of elders** and is being lost.
- Our coordination happens in a **WhatsApp group that has no memory** — wishes scroll away, nothing is preserved, nothing is structured.

### 1.3 What This Is *Not*
Not a public social network. Not a genealogy research product competing with Ancestry/MyHeritage. Not a generic photo backup. It is a *warm, closed, multi-generational family home*.

---

## 2. Goals & Non-Goals

### 2.1 Goals (MVP horizon)
1. Give the family one private, invite-only space accessible on web and mobile, worldwide.
2. Preserve the family tree across both maternal and paternal sides.
3. Make every memory (photo + context) findable by person, time, and event.
4. Create lightweight, recurring reasons to stay connected (reminders, prompts, reactions).

### 2.2 Non-Goals (explicitly out of scope for now)
- DNA matching, historical records, or genealogy "discoveries."
- Replacing WhatsApp as a real-time chat app.
- Public discoverability or any non-family access.
- Monetization. (This is a family good, not a business — but see §10 on hosting cost.)

---

## 3. Success Metrics

| Type | Metric | Why it matters |
|---|---|---|
| **North Star** | % of invited family members who are *monthly active* | The whole point is staying connected — adoption across generations is the real test |
| Activation | % of invited members who complete onboarding (join + view tree + see 1 memory) | Friction kills family apps; elders especially |
| Depth | # memories (photos/stories) added per month | Is the archive alive or static? |
| Coverage | # people in tree with ≥1 photo tagged | Completeness of the "love fabric" |
| Connection | # reactions / comments / wishes per active member per month | Are we *interacting*, not just storing? |
| Retention | 3-month and 12-month return rate | Family apps must outlive novelty |

---

## 4. Personas

> A deliberately multi-generational set. Designing for the *least technical* member is the hardest and most important constraint.

**P1 — The Historian / Admin ("the keeper")**
The driving force (you). Wants control over the tree, structure, and quality. Will upload the bulk of old photos, define relationships, invite people, moderate. Needs powerful tools and bulk actions. Tech-comfortable.

**P2 — The Elder Viewer ("Grandma/Grandpa")**
60s–80s, low tech confidence, possibly large-font / accessibility needs, may be on an older phone. Primarily wants to *view* photos and faces of loved ones and feel included. Should be able to do everything important with near-zero learning. May need someone else to set them up. **This persona's success defines the product's success.**

**P3 — The Diaspora Member ("the cousin abroad")**
20s–40s, lives overseas (US, UK, Gulf, etc.), mobile-first, time-zone-shifted, busy. Wants quick glances, reminders so they don't miss birthdays, and an easy way to react and send wishes. Low tolerance for friction.

**P4 — The Casual Contributor ("the aunt/uncle")**
Mid-life, moderate tech. Will occasionally post a photo from an event, comment, and react. Won't maintain the tree but enriches the archive. Needs dead-simple "add a memory."

**P5 — The Next Generation ("the kids/teens")**
Will inherit this. Should find it not embarrassing. Future timeline subjects. (Mostly viewers now; design with their future stewardship in mind.)

---

## 5. Functional Requirements (Core Features)

### F1 — Family Tree (dual-sided)
- F1.1 Represent both maternal and paternal sides in a single connected tree.
- F1.2 Each person = a profile (name, photo, birth/relevant dates, relationships, bio/notes, links to their memories).
- F1.3 Support real-family complexity: marriages, second marriages, in-laws bridging the two sides, deceased members, living members, "private/unlisted" members.
- F1.4 Visual, navigable, zoomable tree; tap a person → their profile.
- F1.5 *Collaborative* editing with permissions (admin approves structural changes) — learn from Geni's collaborative model but keep a clear owner.
- F1.6 Import/export via **GEDCOM** (genealogy standard) so the tree is portable and never locked in.

### F2 — Photo / Memory Archive
- F2.1 Upload photos (and short videos) with metadata: date, place, event, people, caption/story.
- F2.2 Every memory is linkable to one or more people in the tree.
- F2.3 Albums / events grouping (e.g., "Diwali 2019," "Wedding 1998").
- F2.4 Bulk upload for the Historian; one-tap "add a memory" for casual contributors.
- F2.5 Original-quality storage with the family's photos treated as irreplaceable (durability is a hard requirement — see N-series).

### F3 — Face-Recognition Retrieval
- F3.1 Detect faces in uploaded photos; cluster faces believed to be the same person.
- F3.2 Suggest tags ("Is this Uncle Raj?"); admin/members confirm or reject.
- F3.3 Once confirmed, link face → tree profile.
- F3.4 **Click a person → surface every photo they appear in.** (The headline feature.)
- F3.5 Handle aging across decades (childhood → present) — reference: MyHeritage's Photo Tagger handles this explicitly.
- F3.6 **Biometric consent is mandatory** (see §8). Recognition is opt-in, withdrawable, with clear data handling. Treat face data as the most sensitive asset in the system.

### F4 — Chronological Timeline
- F4.1 A family-wide timeline from earliest records → present, in sequence.
- F4.2 Memories, milestones, births, and events placed in time.
- F4.3 Filter by person (one person's life timeline), by branch, or whole-family.
- F4.4 "On this day" resurfacing of past memories — a recurring reason to return.

### F5 — Staying-Connected / Social Layer
- F5.1 Birthday & anniversary reminders, auto-derived from the tree.
- F5.2 Festival reminders (configurable — Diwali, Eid, Christmas, regional festivals, etc.).
- F5.3 Reactions, comments, and "wishes" on memories and on people's days.
- F5.4 A light activity feed ("3 new photos from the Hyderabad trip," "It's Meena's birthday").
- F5.5 Memory prompts to elders/members ("Tell us the story behind this photo") to keep the archive growing — reference: Storyworth/Tinybeans prompt mechanics.

### F6 — WhatsApp Integration  ⚠️ *(scope reframed — see §7 & §10)*
- F6.1 **Outbound notifications to WhatsApp** (birthday reminders, "new memory added," festival nudges) via a supported messaging channel, with deep-links back into the app. *This is feasible.*
- F6.2 **Deep-link sharing**: one tap to share a memory/album link into the family WhatsApp group manually.
- F6.3 *(Stretch / risky)* Mirroring or archiving the existing personal WhatsApp group's content into the app is **not officially supported** and violates WhatsApp ToS via unofficial tooling — treated as an explicit open decision, not an MVP commitment.

### F7 — Platforms & Access
- F7.1 Responsive **web app** (works on any browser, any country).
- F7.2 **Mobile app** experience (PWA for MVP; consider native later).
- F7.3 Invite-only onboarding via a shareable, expiring invite link.
- F7.4 Global accessibility (CDN, works on modest bandwidth and older devices).

---

## 6. Non-Functional Requirements

### N1 — Privacy (the defining NFR)
- Strictly family-only. **No** public access, **no** search-engine indexing, **no** ads, **no** third-party tracking or data mining. This is the explicit anti-pattern to mainstream social media.
- Granular visibility: ability to mark people/memories as restricted (e.g., minors, sensitive relationships).
- Right to delete: any member can remove their own content and biometric data.

### N2 — Security
- Encryption in transit and at rest. Encrypted backups.
- Role-based access (Admin / Member / View-only-Elder).
- Secure invite + auth flow (passwordless / magic-link friendly for elders).

### N3 — Durability & Storage
- Family photos are irreplaceable → durable object storage with versioning and backup; no silent data loss; export always available.
- Plan storage growth: thousands of high-res photos + video over years.

### N4 — Scalability
- Designed for ~50–500 family members and tens of thousands of media items — *not* millions. Right-size; don't over-engineer.

### N5 — Usability & Accessibility
- Elder-first: large tap targets, large fonts, minimal navigation depth, no jargon.
- One-handed mobile use; works offline-tolerant for viewing.
- WCAG-aligned contrast and screen-reader support.

### N6 — Internationalization
- Multi-language UI (at minimum English + relevant regional Indian language(s)).
- Time-zone-aware reminders (members are global).
- Locale-aware dates, festivals.

### N7 — Performance
- Fast first paint and image loading on modest connections; responsive thumbnails; lazy-loading.

### N8 — Cost-efficiency
- A family good with no revenue → predictable, low monthly hosting cost is a real constraint (see §10).

---

## 7. Competitive Landscape (synthesized)

> Studied as references for what to copy, what to avoid, and where the gap is. URLs included for your deeper research.

**Private family social networks (closest to full vision)**
- **Kintree** — https://kintree.com — family tree + private social feed. Closest single analogue; lighter on archive depth & face recognition.
- **Kinscape** — https://kinscape.com — privacy-first family sharing, positioned against ad-tracking.
- **Familink** — https://familink.io — photo-sharing → social network; strong elder angle (physical frame companion).
- **Family.Space** — Google Play listing — all-ages "hyperspaces" + dynamic tree.

**Family tree + face recognition (the hard feature)**
- **MyHeritage** — https://www.myheritage.com — *reference implementation* for Photo Tagger (face clustering, tag-once, click-person-see-all-photos, aging-tolerant) and for a copyable biometric-consent model. Genealogy-first; feels like a research tool, not a home.
- **Geni** — https://www.geni.com — best reference for *collaborative* tree-building (shared tree, merges, notifications). MyHeritage-owned.
- **WikiTree** — https://www.wikitree.com — 100% free collaborative tree; free-forever benchmark.

**Memory / timeline archives**
- **FamilyAlbum** — https://family-album.com — free unlimited storage, date-organized, non-technical-friendly, auto recap movies.
- **Tinybeans** — https://tinybeans.com — memory-keeping + prompts + milestone emails (single-child focused; acquired Qeepsake Nov 2025).
- **Memory Murals** — https://www.memorymurals.com — explicitly *multi-generational* archive (photos + voice + video + stories across decades).
- **Storyworth / Remento** — story & voice capture via prompts (great prompt mechanics to borrow).

**The gap (our wedge):** No single product nails *all four* of — collaborative dual-side tree + face-recognition retrieval + chronological multi-generational timeline + an active staying-connected layer — for a *closed extended family*. MyHeritage owns tree+faces but is cold/research-flavored. Social players are light on archive depth & faces. **Positioning: a warm, private, multi-generational family *home* — not a genealogy database, not another feed.**

---

## 8. Privacy & Data Governance (called out because it's a hard gate)

Face recognition processes **biometric data** — among the most regulated categories.

- **India — DPDP Act 2023:** consent-based processing; honor data-principal rights (access, correction, erasure). Relevant given the family base in India.
- **EU/UK — GDPR:** biometric data for unique identification is "special category" — requires explicit consent and strong safeguards. Relevant if any relatives reside in the EU/UK.
- **US:** state biometric laws (e.g., Illinois BIPA) impose consent/notice requirements; relevant given US-based family.

**Design implications:**
- Face recognition is **opt-in per person**, with plain-language consent and one-tap withdrawal.
- Store face embeddings separately and encrypted; allow full deletion of an individual's biometric models.
- Consider keeping recognition/embeddings under family control (self-hosted or single-region) rather than a third-party face API, to simplify the consent story.
- Minors: extra protection; guardian consent; restricted visibility by default.

---

## 9. MVP Scope vs. Later Phases

### Phase 0 — MVP ("the family shows up and it's alive")
- F1 Family tree (dual-sided, visual, admin-owned, GEDCOM import/export)
- F2 Photo/memory archive with people-linking, albums, captions
- F4 Timeline (basic chronological view + filter by person)
- F5.1–F5.4 Birthday/festival reminders + reactions/comments + activity feed
- F7 Web (responsive) + PWA, invite-only onboarding
- N1, N2, N3, N5 (privacy, security, durability, elder-usability) as *built-in from day one*, not retrofitted
- F6.1 Outbound WhatsApp/notification reminders (feasible slice only)

### Phase 1 — The headline feature
- F3 Face-recognition retrieval (with full consent flow from §8)
- F4.4 "On this day" resurfacing
- F5.5 Memory prompts to elders

### Phase 2 — Depth & reach
- Native mobile apps
- Voice/video memories & story capture (Memory Murals-style)
- Multi-language UI (N6)
- Richer collaborative tree editing (F1.5)

### Phase 3 — Stretch / decisions
- WhatsApp deeper integration *if* a compliant path emerges (F6.3)
- AI features (photo enhancement/colorization of old photos, auto-captioning, "find the story")

---

## 10. Key Technical & Architecture Considerations
*(Pitched for an architect audience; to be expanded in a separate design doc.)*

- **Family tree = a graph.** A graph data model (e.g., a property-graph store) is a natural fit for relationships, branch traversal, and "shortest relationship path between two people." Worth weighing against a relational model given the small data volume.
- **Face recognition — build vs. buy.** Buying a face API is fastest but worst for the biometric-consent/privacy story and adds per-call cost. A self-hosted open model (face detection + embeddings + clustering) keeps data in-family and aligns with §8 — at the cost of build effort. **Recommend self-hosted for the consent story; decide in round 2.**
- **WhatsApp reality (important).** The official Meta Cloud API cannot read an existing personal family group; native group support exists only for very-high-volume business accounts. Unofficial libraries (Baileys/WAHA) *can* read existing groups via QR-pairing a phone, but this **violates WhatsApp ToS and risks number bans** — not acceptable for a durable family product. MVP should treat WhatsApp as an *outbound notification channel + deep-link target*, not a mirror.
- **Storage.** Durable object storage (versioned, backed up) for media; thumbnails/derivatives generated on upload; CDN for global delivery.
- **Auth.** Passwordless / magic-link to remove friction for elders.
- **Cost.** Aim for a small, predictable monthly footprint; this is a family good, not a funded product.
- **Build approach.** Intend to implement the initial version with **Claude Code**. A clean modular monolith (tree service, media service, recognition service, notification service) keeps the MVP simple while leaving seams for later extraction.

---

## 11. Open Questions (for round 2)

1. **Scale of family:** roughly how many people in the tree, and how many likely active members across generations?
2. **Photo volume:** rough count of existing photos to migrate (hundreds? thousands? tens of thousands?), and where they live now.
3. **Who administers?** Just you, or a small group of admins across both sides?
4. **WhatsApp:** is *outbound reminders + share links* enough, or is mirroring the existing group truly a must-have (and are you willing to accept the ToS/ban risk if so)?
5. **Privacy posture:** are you comfortable with a third-party face API for speed, or do you want recognition kept fully in-family even if it's more work?
6. **Hosting:** preference between fully managed cloud (less ops) vs. self-hosted (more control, lower cost)? Any existing cloud you'd anchor to?
7. **Languages:** which languages must the MVP support, if any beyond English?
8. **Deceased & sensitive members:** how do you want to handle deceased relatives, estrangements, adoptions, and "private" members in the tree?
9. **Monetization/cost-sharing:** is this purely your gift to the family, or will hosting cost be shared?
10. **Name & identity:** working title is "The Family Hub" — do you want a real name and brand for it?

---

## 12. Assumptions & Glossary

**Assumptions:** invite-only and closed; family is globally distributed; elders are first-class users; this product must *last decades*, so data portability (GEDCOM, photo export) is non-negotiable.

**Glossary:** *GEDCOM* — standard genealogy data exchange format. *Face embedding* — numeric vector representing a face, used for clustering/matching. *PWA* — Progressive Web App (installable web app, MVP-friendly cross-platform). *Biometric data* — legally sensitive personal data including facial recognition models.