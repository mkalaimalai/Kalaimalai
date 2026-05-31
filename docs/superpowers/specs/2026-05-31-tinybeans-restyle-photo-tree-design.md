# Tinybeans Restyle + Photo Tree — Design

**Date:** 2026-05-31
**Branch:** `feat/family-fabric-mvp`
**Status:** Approved (pending implementation plan)

## Goal

Restyle the Family Fabric app to match the warm, playful look of
[tinybeans.com](https://tinybeans.com) ("Sky & Coral" direction), and replace
the hand-illustrated SVG family tree with a clean photo-avatar layout. People
gain an optional photo, uploaded and stored client-side.

This keeps the app's existing **elder-first** accessibility (large type scale,
high contrast, visible focus outlines, 44px touch targets).

## Non-Goals (YAGNI)

- No backend / image hosting — photos live in localStorage as data URLs.
- No per-page hero redesign beyond the tree page (other pages inherit the new
  palette, header, cards, and buttons; per-page heroes are a possible
  fast-follow, out of scope here).
- No changes to relationships, change-requests, or other contexts' behavior.

## Layer 1 — Theme & Chrome (whole app)

### Palette (`app/globals.css` tokens + `tailwind.config.ts`)

Sky & Coral. HSL token values:

| Token | Role | Approx hex |
| --- | --- | --- |
| `--background` | soft sky-tinted off-white | `#f4f9fc` |
| `--foreground` | slate text | `#243b4a` |
| `--primary` | coral CTA | `#ff7a66` |
| `--primary-foreground` | on coral | `#ffffff` |
| `--brand` | teal logo / links / headings accent | `#1f6f8b` |
| `--muted` | light sky surface | `#eaf4fb` |
| `--muted-foreground` | secondary text | `#5a7180` |
| `--border` | soft sky border | `#dcecf6` |
| `--paternal` | ring tint (paternal) | `#3f9fc7` (sky blue) |
| `--maternal` | ring tint (maternal) | `#ef6f91` (pink) |

Add `--brand` (new) to tokens and Tailwind `colors.brand`. Keep the elder-first
`fontSize.base` bump, `minHeight/minWidth.target`, and `:focus-visible` outline.
Update the focus outline color to `--brand` for adequate contrast on the new
background.

### Primitives

- **`Button`** (`src/shared/ui/button.tsx`): `rounded-full`; `primary` = coral bg
  + white text + soft shadow (`shadow-[0_6px_16px_rgba(255,122,102,.35)]`);
  `outline` = white bg + brand text + subtle shadow; `ghost` unchanged in shape.
  Keep sizes and `min-h-target`.
- **`Card`** (`src/shared/ui/card.tsx`): `rounded-2xl`, softer/larger shadow
  (`shadow-[0_10px_36px_rgba(31,111,139,.10)]`), lighter border.
- **Inputs/Select/Field**: unchanged structurally; inherit palette. Inputs get
  `rounded-xl` to match the rounder feel.

### Header (`app/layout.tsx`)

White sticky nav (`shadow` instead of bottom border). Left: gradient rounded
logo mark + "Family Fabric" in brand color. Center/left: pill nav links with an
**active** state (sky bg + brand text) using `usePathname`. Right: the member
switcher rendered as a compact avatar chip (see below).

### Member switcher (`src/contexts/identity/ui/MemberSwitcher.tsx`)

Keep the `<select>` for switching (stub auth), but present it as a compact
chip — small avatar/monogram + current member name — rather than a full labelled
field. Accessible label retained via `aria-label`.

## Layer 2 — Photos in the Data Model

Add an optional `photoUrl: string` to a person, threaded end-to-end. All changes
are additive and backward-compatible.

- **`domain/person.ts`**: add `photoUrl?: string` to `PersonProps`; getter;
  normalize in `create` (`photoUrl?.trim() || undefined`).
- **`application/dtos.ts`**: `PersonDTO.photoUrl: string | null`.
- **`application/mappers.ts`**: `toPersonDTO` maps `photoUrl ?? null`.
  (`toPersonView` unchanged — tree reads the DTO.)
- **`application/inputs.ts`**: `AddPersonInput.photoUrl?: string`,
  `EditPersonInput.photoUrl?: string | null`.
- **`application/use-cases.ts`**: `addPerson` passes `photoUrl`; `editPerson`
  handles `photoUrl` like the other optional string fields.
- **`infrastructure/person-repository.ts`**: `StoredPerson.photoUrl: string | null`;
  `toStored`/`fromStored` map it. **No `SCHEMA_VERSION` bump** — older records
  lacking the key read back as `undefined` → fine. Existing localStorage data
  survives.

### Photo capture

- **`PhotoInput`** (new, `src/shared/ui/photo-input.tsx` or genealogy ui): a
  click-to-upload avatar. Reads the chosen `File`, draws it center-cropped to a
  256×256 `<canvas>`, exports `toDataURL("image/jpeg", 0.8)`, and calls
  `onChange(dataUrl)`. Pure-ish helper `resizeImageToDataUrl(file): Promise<string>`
  kept separate so it can be reasoned about. Shows the current image as preview
  with a "Change photo"/"Remove" affordance.
- Wired into **`AddPersonForm`** (optional "Photo" field) and the **person
  profile page** (`app/tree/[personId]/page.tsx`) to set/replace a photo via
  `editPerson`.

## Layer 3 — Photo Tree Layout (replaces the illustrated fan)

### Remove

Delete the illustrated SVG tree and its tests (all currently uncommitted WIP):
`src/contexts/genealogy/ui/tree/FamilyTreeFan.tsx`, `decor.ts`, `fan-layout.ts`,
`fan-layout.test.ts`, and `test/integration/fan-render.test.tsx`.

### New pure layout — `pedigree-layout.ts`

Reuse the parent/spouse/child adjacency logic from the current `fan-layout.ts`
(`buildGraph`). Produce **generation rows** instead of arcs:

```
type PedigreeRole = "focal" | "partner" | "ancestor" | "child";

interface PedigreeNode {
  person: PersonDTO;
  role: PedigreeRole;
  generation: number;   // 0 = focal couple, 1 = parents, 2 = grandparents; children = -1
  branch: "Maternal" | "Paternal";
}

interface PedigreeRow { generation: number; nodes: PedigreeNode[]; }

interface PedigreeLayout {
  rows: PedigreeRow[];        // ordered top (oldest ancestors) → bottom (children)
  focalId: string;
  partnerId: string | null;
}
```

Rules: walk up to `maxAncestorGen` (default 3) ancestor generations via
`ParentOf`; place focal + first spouse in row 0; collect children of focal (and
spouse) into the children row. Deterministic ordering (fathers/paternal first,
stable) so renders and tests are stable. Pure and unit-tested
(`pedigree-layout.test.ts`).

### New view — `FamilyTree.tsx` (HTML/CSS)

Renders rows top-to-bottom as fl/CSS rows of avatar nodes. For each node:

- **`Avatar`** (new small component): circular; shows the photo if `photoUrl`
  is set, else a monogram (reuse the `monogram` helper, moved into the new
  module or a small `avatar-text.ts`). Gradient **ring** tinted by branch
  (`--paternal` / `--maternal`); the **focal** node gets a coral ring + a "You"
  /focal badge and a larger size.
- Thin connector lines: a couple line between focal & partner, and parent→child
  lines (simple CSS/borders or a lightweight absolutely-positioned SVG layer
  behind the rows — kept simple).
- Interactions preserved: **click re-roots** (`onReroot`), **double-click opens
  profile** (`onOpenProfile`), keyboard Enter/Space to re-root, `aria-label`s.
- Keep the existing **zoom** controls (apply `transform: scale()` to the rows
  container) and a horizontal-scroll wrapper for wide trees.

`app/tree/page.tsx` swaps `FamilyTreeFan` → `FamilyTree` (same props:
`tree`, `focalId`, `familyName`, `onReroot`, `onOpenProfile`). The hero strip
described in Layer 1 lives here.

## Verification

After each layer: `npm run typecheck` and `npm test` (unit). New tests:
`pedigree-layout.test.ts` (row assignment, ordering, re-root, no-spouse and
no-ancestor cases) and a small render smoke test for `FamilyTree`. Manual check
via `npm run dev`: add a person with a photo, confirm it appears on the tree and
in the profile, and that re-rooting still works.

## Risks / Notes

- **localStorage budget**: many large photos could approach the ~5MB cap.
  Mitigated by 256px JPEG resize (~10–20KB each); acceptable for a family tree.
  If hit, a later phase can move to IndexedDB.
- The new layout is rows, not arcs — very deep/wide trees scroll horizontally
  rather than fanning. Acceptable for the MVP and matches the approved mockup.
