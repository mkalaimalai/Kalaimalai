# Tinybeans Restyle + Photo Tree Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the app to the Tinybeans "Sky & Coral" look and replace the illustrated SVG family tree with a clean photo-avatar generational layout, with optional per-person photos stored client-side.

**Architecture:** Three layers. (1) Theme & chrome — design tokens, restyled primitives, header. (2) Data — an optional `photoUrl` threaded through the hexagonal stack (domain → DTO → use cases → repository). (3) View — a new pure `pedigree-layout` row model rendered by a new HTML/CSS `FamilyTree` with photo/monogram `Avatar`s, replacing the illustrated fan.

**Tech Stack:** Next.js (App Router), React, TypeScript (strict, no `any`), Tailwind CSS, Redux Toolkit / RTK Query, Vitest + Testing Library, localStorage persistence.

**Conventions:**
- Run `npm run typecheck` and `npm test` frequently. Test runner: `npx vitest run <path>`.
- Commit after each task with Conventional Commits.
- The branch is already `feat/family-fabric-mvp` — stay on it.
- Pure logic gets TDD (failing test first). Visual/CSS tasks are implement-then-verify (typecheck + manual), since there is no meaningful unit test for color tokens.

---

## File Structure

**Layer 1 — Theme & chrome**
- Modify `app/globals.css` — palette tokens (add `--brand`), focus color.
- Modify `tailwind.config.ts` — `colors.brand`, `borderRadius`, updated maternal/paternal hues.
- Modify `src/shared/ui/button.tsx` — pill shape, coral primary + shadow.
- Modify `src/shared/ui/card.tsx` — rounder, softer shadow.
- Modify `src/shared/ui/field.tsx` — `rounded-xl` inputs.
- Modify `app/layout.tsx` — white sticky header, logo mark, active pill links.
- Modify `src/contexts/identity/ui/MemberSwitcher.tsx` — compact chip.

**Layer 2 — Photos in the model**
- Modify `src/contexts/genealogy/domain/person.ts` — `photoUrl` prop + getter.
- Modify `src/contexts/genealogy/application/dtos.ts` — `PersonDTO.photoUrl`.
- Modify `src/contexts/genealogy/application/mappers.ts` — map `photoUrl`.
- Modify `src/contexts/genealogy/application/inputs.ts` — add/edit `photoUrl`.
- Modify `src/contexts/genealogy/application/use-cases.ts` — thread `photoUrl`.
- Modify `src/contexts/genealogy/infrastructure/person-repository.ts` — persist `photoUrl`.

**Layer 2 — Photo capture UI**
- Create `src/shared/ui/image-resize.ts` — `computeCoverCrop` (pure) + `resizeImageToDataUrl`.
- Create `src/shared/ui/photo-input.tsx` — click-to-upload avatar control.
- Modify `src/shared/ui/index.ts` — export new primitives.
- Modify `src/contexts/genealogy/ui/AddPersonForm.tsx` — optional photo field.
- Modify `src/contexts/genealogy/ui/PersonProfile.tsx` — show + change photo.

**Layer 3 — Photo tree**
- Create `src/contexts/genealogy/ui/tree/pedigree-layout.ts` — pure row layout.
- Create `src/contexts/genealogy/ui/tree/pedigree-layout.test.ts`.
- Create `src/contexts/genealogy/ui/tree/avatar-text.ts` — `monogram` helper.
- Create `src/contexts/genealogy/ui/tree/Avatar.tsx` — photo/monogram circle.
- Create `src/contexts/genealogy/ui/tree/FamilyTree.tsx` — the new view.
- Create `test/integration/family-tree-render.test.tsx` — render smoke test.
- Modify `app/tree/page.tsx` — swap component + hero strip.
- Delete `src/contexts/genealogy/ui/tree/FamilyTreeFan.tsx`, `decor.ts`, `fan-layout.ts`, `fan-layout.test.ts`, `test/integration/fan-render.test.tsx`.

---

## Task 1: Theme tokens & Tailwind palette

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Replace the `:root` tokens and focus color in `app/globals.css`**

Replace the `:root { … }` block and the `:focus-visible` rule with:

```css
/* Tinybeans "Sky & Coral" tokens. Elder-first contrast preserved. */
:root {
  --background: 200 50% 97%;     /* soft sky-tinted off-white */
  --foreground: 203 35% 22%;     /* slate */
  --primary: 9 100% 70%;         /* coral CTA */
  --primary-foreground: 0 0% 100%;
  --brand: 196 64% 33%;          /* teal — logo, links, headings accent */
  --muted: 205 70% 95%;          /* light sky surface */
  --muted-foreground: 203 18% 42%;
  --border: 205 55% 91%;         /* soft sky border */
  --maternal: 342 79% 69%;       /* pink */
  --paternal: 199 53% 51%;       /* sky blue */
}
```

And change the focus outline to use the brand color:

```css
/* Visible focus for keyboard users (N5). */
:focus-visible {
  outline: 3px solid hsl(var(--brand));
  outline-offset: 2px;
}
```

Leave the `.elder-mode`, `* { border-color }`, and `body` rules as-is. The
`.ff-node` rules can stay (harmless) or be removed in Task 13.

- [ ] **Step 2: Add `brand` color and rounding to `tailwind.config.ts`**

In the `theme.extend.colors` object, add a `brand` entry after `primary`:

```ts
        brand: "hsl(var(--brand))",
```

The `maternal`/`paternal` entries already read from the CSS vars, so no change
there. Leave `fontSize`, `minHeight`, `minWidth` as-is.

- [ ] **Step 3: Verify it compiles**

Run: `npm run typecheck`
Expected: PASS (no type errors).

- [ ] **Step 4: Commit**

```bash
git add app/globals.css tailwind.config.ts
git commit -m "feat(ui): adopt Tinybeans sky & coral palette tokens"
```

---

## Task 2: Restyle Button and Card primitives

**Files:**
- Modify: `src/shared/ui/button.tsx`
- Modify: `src/shared/ui/card.tsx`
- Modify: `src/shared/ui/field.tsx`

- [ ] **Step 1: Update `button.tsx` variants to pill-shaped, coral primary**

Replace the `cva(...)` call (base string + `variants`) with:

```ts
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-target",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(255,122,102,0.35)] hover:opacity-90",
        outline:
          "border-2 border-border bg-background text-brand shadow-sm hover:bg-muted",
        ghost: "text-brand hover:bg-muted",
      },
      size: {
        md: "px-5 py-2 text-base",
        lg: "px-6 py-3 text-lg",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);
```

- [ ] **Step 2: Update `Card` in `card.tsx` to be rounder with a softer shadow**

Replace the `className` in the `Card` function's `cn(...)` with:

```ts
        "rounded-2xl border border-border bg-background shadow-[0_10px_36px_rgba(31,111,139,0.10)]",
```

Leave `CardHeader`, `CardTitle`, `CardContent` unchanged.

- [ ] **Step 3: Round the inputs in `field.tsx`**

In both `Input` and `Select`, change `rounded-lg` to `rounded-xl` in their
`cn(...)` class strings. Leave everything else unchanged.

- [ ] **Step 4: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/button.tsx src/shared/ui/card.tsx src/shared/ui/field.tsx
git commit -m "feat(ui): pill buttons, rounder cards, rounded inputs"
```

---

## Task 3: Restyle header and member switcher

**Files:**
- Modify: `app/layout.tsx`
- Modify: `src/contexts/identity/ui/MemberSwitcher.tsx`

- [ ] **Step 1: Rebuild the header in `app/layout.tsx`**

The nav links need an active state, so the header becomes a small client
component. Add a `NavBar` client component in this file and use it. Replace the
entire file contents with:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import "./globals.css";
import { Providers } from "@/bootstrap/Providers";
import { MemberSwitcher } from "@/contexts/identity/ui/MemberSwitcher";

const NAV = [
  { href: "/tree", label: "Family Tree" },
  { href: "/memories", label: "Memories" },
  { href: "/timeline", label: "Timeline" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Activity" },
];

function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 bg-background/95 shadow-[0_2px_14px_rgba(31,111,139,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link
          href="/tree"
          className="mr-2 flex items-center gap-2 text-xl font-extrabold text-brand"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{
              background: "linear-gradient(135deg, #5ab0d6, #7cc6a6)",
            }}
            aria-hidden
          >
            🌿
          </span>
          Family Fabric
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-full px-3 py-2 font-medium transition-colors " +
                  (active
                    ? "bg-muted text-brand"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <MemberSwitcher />
      </div>
    </header>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
```

> Note: `metadata` export is removed because this file is now a Client
> Component. That is acceptable for this MVP — the `<title>`/description still
> default from Next. (If desired later, move `metadata` to a separate
> `app/head.tsx`, but that is out of scope.)

- [ ] **Step 2: Make the member switcher a compact chip in `MemberSwitcher.tsx`**

Replace the returned JSX (the `<Field>…</Field>` block) with a compact,
chip-styled select that keeps an accessible label:

```tsx
  return (
    <div className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5">
      <span
        className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-sm font-bold text-primary-foreground"
        aria-hidden
      >
        {(current?.displayName ?? "?").charAt(0).toUpperCase()}
      </span>
      <label htmlFor="member-switcher" className="sr-only">
        Signed in as
      </label>
      <select
        id="member-switcher"
        value={current?.id ?? ""}
        onChange={onChange}
        disabled={isLoading || members.length === 0}
        className="min-h-target bg-transparent text-sm font-semibold text-foreground focus-visible:outline-none"
      >
        <option value="" disabled>
          {members.length === 0 ? "No members yet" : "Choose a member…"}
        </option>
        {members.map((m) => (
          <option key={m.id} value={m.id}>
            {m.displayName} ({m.role})
          </option>
        ))}
      </select>
    </div>
  );
```

Remove the now-unused `Field, Select` import line; keep the rest of the file
(hooks and `onChange`) as-is.

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/layout.tsx src/contexts/identity/ui/MemberSwitcher.tsx
git commit -m "feat(ui): white sticky header with active pills and member chip"
```

---

## Task 4: Add `photoUrl` to the Person domain (TDD)

**Files:**
- Modify: `src/contexts/genealogy/domain/person.ts`
- Test: `src/contexts/genealogy/domain/person.test.ts`

- [ ] **Step 1: Write the failing test**

Add this test inside `src/contexts/genealogy/domain/person.test.ts` (append a new
`describe`, keep existing tests):

```ts
describe("Person photoUrl", () => {
  it("stores a trimmed photoUrl and exposes it via the getter", () => {
    const r = Person.create({
      id: PersonId("p-photo"),
      legalName: "Asha",
      gender: "Female",
      visibility: "Public",
      branch: "Maternal",
      photoUrl: "  data:image/jpeg;base64,abc  ",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.photoUrl).toBe("data:image/jpeg;base64,abc");
  });

  it("treats blank photoUrl as undefined", () => {
    const r = Person.create({
      id: PersonId("p-photo2"),
      legalName: "Asha",
      gender: "Female",
      visibility: "Public",
      branch: "Maternal",
      photoUrl: "   ",
    });
    expect(r.ok && r.value.photoUrl).toBeUndefined();
  });
});
```

If `PersonId` is not already imported in this test file, add it to the existing
`@/shared/kernel` import.

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/contexts/genealogy/domain/person.test.ts`
Expected: FAIL — `photoUrl` does not exist on `PersonProps` / `Person`.

- [ ] **Step 3: Implement in `person.ts`**

Add to the `PersonProps` interface (after `bio`):

```ts
  readonly photoUrl?: string;
```

In `Person.create`, add `photoUrl` normalization to the `ok(new Person({ ... }))`
spread, alongside the existing `bio` line:

```ts
        photoUrl: props.photoUrl?.trim() || undefined,
```

Add a getter (after the `bio` getter):

```ts
  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }
```

`PersonChanges` already derives from `PersonProps`, so it picks up `photoUrl`
automatically.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/contexts/genealogy/domain/person.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/genealogy/domain/person.ts src/contexts/genealogy/domain/person.test.ts
git commit -m "feat(genealogy): add optional photoUrl to Person"
```

---

## Task 5: Thread `photoUrl` through DTO, mapper, inputs, use cases (TDD)

**Files:**
- Modify: `src/contexts/genealogy/application/dtos.ts`
- Modify: `src/contexts/genealogy/application/mappers.ts`
- Modify: `src/contexts/genealogy/application/inputs.ts`
- Modify: `src/contexts/genealogy/application/use-cases.ts`
- Test: `src/contexts/genealogy/application/use-cases.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `src/contexts/genealogy/application/use-cases.test.ts`:

```ts
describe("photoUrl round-trips through use cases", () => {
  it("addPerson stores a photoUrl and getTree returns it", async () => {
    const deps = makeDeps();
    const created = await addPerson(deps)(
      personInput({ photoUrl: "data:image/jpeg;base64,xyz" }),
    );
    expect(created.ok && created.value.photoUrl).toBe(
      "data:image/jpeg;base64,xyz",
    );
  });

  it("editPerson can set and clear a photoUrl", async () => {
    const deps = makeDeps();
    const created = await addPerson(deps)(personInput());
    if (!created.ok) throw new Error("setup");
    const set = await editPerson(deps)({
      id: created.value.id,
      photoUrl: "data:image/jpeg;base64,abc",
    });
    expect(set.ok && set.value.photoUrl).toBe("data:image/jpeg;base64,abc");
    const cleared = await editPerson(deps)({
      id: created.value.id,
      photoUrl: null,
    });
    expect(cleared.ok && cleared.value.photoUrl).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/contexts/genealogy/application/use-cases.test.ts`
Expected: FAIL — `photoUrl` not on `AddPersonInput` / `PersonDTO`.

- [ ] **Step 3: Add `photoUrl` to the DTO**

In `dtos.ts`, add to `PersonDTO` (after `bio`):

```ts
  photoUrl: string | null;
```

- [ ] **Step 4: Map it in `mappers.ts`**

In `toPersonDTO`, add (after the `bio` line):

```ts
    photoUrl: person.photoUrl ?? null,
```

- [ ] **Step 5: Add to inputs in `inputs.ts`**

In `AddPersonInput` add:

```ts
  photoUrl?: string;
```

In `EditPersonInput` add:

```ts
  photoUrl?: string | null;
```

- [ ] **Step 6: Thread through `use-cases.ts`**

In `addPerson`, add to the `Person.create({ ... })` object (after `bio`):

```ts
      photoUrl: input.photoUrl,
```

In `editPerson`, add alongside the other optional-field handling (after the
`bio` block):

```ts
    if (input.photoUrl !== undefined)
      changes.photoUrl = input.photoUrl ?? undefined;
```

- [ ] **Step 7: Run to verify it passes**

Run: `npx vitest run src/contexts/genealogy/application/use-cases.test.ts`
Expected: PASS.

> Note: the second assertion expects `photoUrl` to be `null` after clearing,
> because the DTO maps `undefined → null`. The test reflects that.

- [ ] **Step 8: Commit**

```bash
git add src/contexts/genealogy/application/
git commit -m "feat(genealogy): thread photoUrl through DTO, inputs, use cases"
```

---

## Task 6: Persist `photoUrl` in the repository (TDD)

**Files:**
- Modify: `src/contexts/genealogy/infrastructure/person-repository.ts`
- Test: `src/contexts/genealogy/infrastructure/repositories.test.ts`

- [ ] **Step 1: Write the failing test**

In `repositories.test.ts`, add a test inside the
`describe("LocalStoragePersonRepository", …)` block:

```ts
  it("persists and reloads photoUrl", async () => {
    const store = new InMemoryKeyValueStore();
    const repo1 = new LocalStoragePersonRepository(store);
    const r = Person.create({
      id: PersonId("p-photo"),
      legalName: "Asha",
      gender: "Female",
      visibility: "Public",
      branch: "Maternal",
      photoUrl: "data:image/jpeg;base64,abc",
    });
    if (!r.ok) throw new Error("setup");
    await repo1.save(r.value);

    const repo2 = new LocalStoragePersonRepository(store);
    const loaded = await repo2.get(PersonId("p-photo"));
    expect(loaded?.photoUrl).toBe("data:image/jpeg;base64,abc");
  });
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/contexts/genealogy/infrastructure/repositories.test.ts`
Expected: FAIL — `loaded?.photoUrl` is `undefined`.

- [ ] **Step 3: Implement in `person-repository.ts`**

Add to the `StoredPerson` interface (after `bio`):

```ts
  photoUrl: string | null;
```

In `toStored`, add (after the `bio` line):

```ts
    photoUrl: person.photoUrl ?? null,
```

In `fromStored`, add to the `Person.create({ ... })` object (after `bio`):

```ts
    photoUrl: stored.photoUrl ?? undefined,
```

Do **not** bump `SCHEMA_VERSION` — records saved before this change simply lack
the `photoUrl` key and read back as `undefined`, which is valid.

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/contexts/genealogy/infrastructure/repositories.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/contexts/genealogy/infrastructure/person-repository.ts src/contexts/genealogy/infrastructure/repositories.test.ts
git commit -m "feat(genealogy): persist photoUrl in person repository"
```

---

## Task 7: Image-resize helper (TDD on the pure part)

**Files:**
- Create: `src/shared/ui/image-resize.ts`
- Test: `src/shared/ui/image-resize.test.ts`

- [ ] **Step 1: Write the failing test for the pure crop math**

Create `src/shared/ui/image-resize.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { computeCoverCrop } from "./image-resize";

describe("computeCoverCrop", () => {
  it("crops the sides of a landscape image to a square", () => {
    const c = computeCoverCrop(200, 100);
    expect(c).toEqual({ sx: 50, sy: 0, size: 100 });
  });

  it("crops the top/bottom of a portrait image to a square", () => {
    const c = computeCoverCrop(100, 200);
    expect(c).toEqual({ sx: 0, sy: 50, size: 100 });
  });

  it("returns the whole image when already square", () => {
    const c = computeCoverCrop(120, 120);
    expect(c).toEqual({ sx: 0, sy: 0, size: 120 });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/shared/ui/image-resize.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `image-resize.ts`**

```ts
/**
 * Client-side image downscaling for avatar photos. The center-crop math is a
 * pure function so it can be unit-tested; the canvas/File work is a thin async
 * wrapper around it (untestable in jsdom, kept minimal).
 */

export interface CoverCrop {
  sx: number;
  sy: number;
  size: number;
}

/** Center-crop a `w`×`h` image to the largest centered square. */
export function computeCoverCrop(w: number, h: number): CoverCrop {
  const size = Math.min(w, h);
  return { sx: (w - size) / 2, sy: (h - size) / 2, size };
}

const OUTPUT = 256;

/**
 * Read an image File and return a 256×256 center-cropped JPEG data URL.
 * Rejects if the file is not a decodable image.
 */
export function resizeImageToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const { sx, sy, size } = computeCoverCrop(
          img.naturalWidth,
          img.naturalHeight,
        );
        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT;
        canvas.height = OUTPUT;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas 2D context unavailable.");
        ctx.drawImage(img, sx, sy, size, size, 0, 0, OUTPUT, OUTPUT);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      } finally {
        URL.revokeObjectURL(url);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read that image."));
    };
    img.src = url;
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/shared/ui/image-resize.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/ui/image-resize.ts src/shared/ui/image-resize.test.ts
git commit -m "feat(ui): add client-side avatar image resize helper"
```

---

## Task 8: PhotoInput control

**Files:**
- Create: `src/shared/ui/photo-input.tsx`
- Modify: `src/shared/ui/index.ts`

- [ ] **Step 1: Implement `photo-input.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "./cn";
import { resizeImageToDataUrl } from "./image-resize";

export interface PhotoInputProps {
  /** Current photo data URL, or null. */
  value: string | null;
  /** Called with a new data URL, or null when removed. */
  onChange: (dataUrl: string | null) => void;
  /** Initials shown when there is no photo. */
  fallback?: string;
  className?: string;
}

/**
 * Click-to-upload circular avatar. Resizes the chosen image to a 256px JPEG
 * data URL before handing it up — keeping localStorage small.
 */
export function PhotoInput({
  value,
  onChange,
  fallback = "?",
  className,
}: PhotoInputProps): React.JSX.Element {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState<string | null>(null);

  const pick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setError(null);
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not read that image.");
    }
  };

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-border bg-muted"
        aria-label={value ? "Change photo" : "Add a photo"}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-xl font-bold text-muted-foreground">
            {fallback}
          </span>
        )}
      </button>
      <div className="flex flex-col gap-1">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="text-sm font-semibold text-brand hover:underline"
        >
          {value ? "Change photo" : "Add a photo"}
        </button>
        {value ? (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-left text-sm text-muted-foreground hover:underline"
          >
            Remove
          </button>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-maternal">
            {error}
          </p>
        ) : null}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={pick}
        className="hidden"
      />
    </div>
  );
}
```

- [ ] **Step 2: Export it from `index.ts`**

Append to `src/shared/ui/index.ts`:

```ts
export * from "./image-resize";
export * from "./photo-input";
```

- [ ] **Step 3: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/shared/ui/photo-input.tsx src/shared/ui/index.ts
git commit -m "feat(ui): add PhotoInput avatar upload control"
```

---

## Task 9: Wire photo into AddPersonForm

**Files:**
- Modify: `src/contexts/genealogy/ui/AddPersonForm.tsx`

- [ ] **Step 1: Add photo state, a PhotoInput field, and include it in the input**

In `AddPersonForm.tsx`:

1. Update the import from `@/shared/ui` to include `PhotoInput`:

```ts
import { Button, Field, Input, Select, PhotoInput } from "@/shared/ui";
```

2. Add state near the other `useState` calls:

```ts
  const [photoUrl, setPhotoUrl] = React.useState<string | null>(null);
```

3. In the `input` object built in `submit`, add:

```ts
      photoUrl: photoUrl ?? undefined,
```

4. After a successful add, reset it — add to the reset block (after
`setBirthplace("")`):

```ts
    setPhotoUrl(null);
```

5. Add a photo field at the top of the form, right after the
`<form …>` opening tag and before the "Legal name" field:

```tsx
      <Field label="Photo" htmlFor="photo" hint="Optional — shown on the tree.">
        <PhotoInput
          value={photoUrl}
          onChange={setPhotoUrl}
          fallback={(legalName.trim()[0] ?? "?").toUpperCase()}
        />
      </Field>
```

> Note: `PhotoInput` is not a labelable control, but wrapping it in `Field`
> keeps visual consistency; its own buttons carry accessible labels.

- [ ] **Step 2: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/genealogy/ui/AddPersonForm.tsx
git commit -m "feat(genealogy): optional photo upload when adding a person"
```

---

## Task 10: Pedigree row layout (TDD)

**Files:**
- Create: `src/contexts/genealogy/ui/tree/pedigree-layout.ts`
- Test: `src/contexts/genealogy/ui/tree/pedigree-layout.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/contexts/genealogy/ui/tree/pedigree-layout.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { TreeDTO, PersonDTO } from "../../application/dtos";
import { layoutPedigree } from "./pedigree-layout";

function person(id: string, over: Partial<PersonDTO> = {}): PersonDTO {
  return {
    id,
    legalName: id,
    nickname: null,
    displayName: id,
    gender: "Unknown",
    birth: null,
    passing: null,
    birthplace: null,
    currentLocation: null,
    bio: null,
    visibility: "Public",
    branch: "Maternal",
    isDeceased: false,
    isUnlisted: false,
    photoUrl: null,
    ...over,
  };
}

// focal F + spouse S; F's parents M(father)+N; F+S child C.
const tree: TreeDTO = {
  nodes: [
    person("F"),
    person("S"),
    person("M", { gender: "Male", branch: "Paternal" }),
    person("N", { gender: "Female" }),
    person("C"),
  ],
  edges: [
    { id: "e1", type: "SpouseOf", fromPersonId: "F", toPersonId: "S", qualifier: null },
    { id: "e2", type: "ParentOf", fromPersonId: "M", toPersonId: "F", qualifier: null },
    { id: "e3", type: "ParentOf", fromPersonId: "N", toPersonId: "F", qualifier: null },
    { id: "e4", type: "ParentOf", fromPersonId: "F", toPersonId: "C", qualifier: null },
    { id: "e5", type: "ParentOf", fromPersonId: "S", toPersonId: "C", qualifier: null },
  ],
};

describe("layoutPedigree", () => {
  it("places focal and partner in generation-0 row", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    expect(l.focalId).toBe("F");
    expect(l.partnerId).toBe("S");
    const row0 = l.rows.find((r) => r.generation === 0)!;
    expect(row0.nodes.map((n) => n.person.id).sort()).toEqual(["F", "S"]);
    expect(row0.nodes.find((n) => n.person.id === "F")!.role).toBe("focal");
    expect(row0.nodes.find((n) => n.person.id === "S")!.role).toBe("partner");
  });

  it("places parents in generation 1 with fathers first", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    const row1 = l.rows.find((r) => r.generation === 1)!;
    expect(row1.nodes.map((n) => n.person.id)).toEqual(["M", "N"]);
    expect(row1.nodes[0]!.role).toBe("ancestor");
  });

  it("places children in the bottom row (generation -1)", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    const kids = l.rows.find((r) => r.generation === -1)!;
    expect(kids.nodes.map((n) => n.person.id)).toEqual(["C"]);
    expect(kids.nodes[0]!.role).toBe("child");
  });

  it("orders rows oldest ancestors at the top, children at the bottom", () => {
    const l = layoutPedigree(tree, { focalId: "F" });
    expect(l.rows.map((r) => r.generation)).toEqual([1, 0, -1]);
  });

  it("re-roots on a different person", () => {
    const l = layoutPedigree(tree, { focalId: "C" });
    expect(l.focalId).toBe("C");
    expect(l.partnerId).toBeNull();
    const row1 = l.rows.find((r) => r.generation === 1)!;
    expect(row1.nodes.map((n) => n.person.id).sort()).toEqual(["F", "S"]);
  });

  it("handles a focal person with no spouse and no relations", () => {
    const lone: TreeDTO = { nodes: [person("X")], edges: [] };
    const l = layoutPedigree(lone, { focalId: "X" });
    expect(l.partnerId).toBeNull();
    expect(l.rows).toEqual([
      { generation: 0, nodes: [expect.objectContaining({ person: expect.objectContaining({ id: "X" }) })] },
    ]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/contexts/genealogy/ui/tree/pedigree-layout.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `pedigree-layout.ts`**

```ts
import type { PersonDTO, TreeDTO } from "../../application/dtos";

/**
 * Pure generational layout for the photo family tree. Produces ordered rows —
 * oldest ancestors at the top, the focal couple in the middle (generation 0),
 * and children at the bottom (generation -1). Deterministic so the view stays a
 * thin renderer and this can be unit-tested.
 */

export type PedigreeRole = "focal" | "partner" | "ancestor" | "child";

export interface PedigreeNode {
  person: PersonDTO;
  role: PedigreeRole;
  /** 0 = focal couple, 1 = parents, 2 = grandparents…; children = -1. */
  generation: number;
  branch: "Maternal" | "Paternal";
}

export interface PedigreeRow {
  generation: number;
  nodes: PedigreeNode[];
}

export interface PedigreeLayout {
  rows: PedigreeRow[];
  focalId: string;
  partnerId: string | null;
}

export interface PedigreeOptions {
  focalId: string;
  /** How many ancestor generations to include (default 3). */
  maxAncestorGen?: number;
}

function buildGraph(tree: TreeDTO) {
  const byId = new Map<string, PersonDTO>();
  for (const p of tree.nodes) byId.set(p.id, p);

  const parentsOf = new Map<string, string[]>();
  const childrenOf = new Map<string, string[]>();
  const spousesOf = new Map<string, string[]>();
  const push = (m: Map<string, string[]>, k: string, v: string) => {
    const arr = m.get(k);
    if (arr) arr.push(v);
    else m.set(k, [v]);
  };
  for (const e of tree.edges) {
    if (e.type === "ParentOf") {
      push(childrenOf, e.fromPersonId, e.toPersonId);
      push(parentsOf, e.toPersonId, e.fromPersonId);
    } else if (e.type === "SpouseOf") {
      push(spousesOf, e.fromPersonId, e.toPersonId);
      push(spousesOf, e.toPersonId, e.fromPersonId);
    }
  }
  return { byId, parentsOf, childrenOf, spousesOf };
}

/** Fathers (Male) first, then a stable id order, so rows read consistently. */
function orderParents(ids: string[], byId: Map<string, PersonDTO>): string[] {
  return [...ids].sort((a, b) => {
    const ga = byId.get(a)!.gender === "Male" ? 0 : 1;
    const gb = byId.get(b)!.gender === "Male" ? 0 : 1;
    if (ga !== gb) return ga - gb;
    return a < b ? -1 : a > b ? 1 : 0;
  });
}

export function layoutPedigree(
  tree: TreeDTO,
  options: PedigreeOptions,
): PedigreeLayout {
  const maxGen = options.maxAncestorGen ?? 3;
  const { byId, parentsOf, childrenOf, spousesOf } = buildGraph(tree);

  const focal = byId.get(options.focalId) ?? tree.nodes[0];
  if (!focal) {
    return { rows: [], focalId: options.focalId, partnerId: null };
  }

  const partnerId = (spousesOf.get(focal.id) ?? []).find((id) => byId.has(id));
  const partner = partnerId ? byId.get(partnerId) : undefined;

  // Bucket nodes by generation.
  const byGen = new Map<number, PedigreeNode[]>();
  const add = (node: PedigreeNode) => {
    const arr = byGen.get(node.generation);
    if (arr) arr.push(node);
    else byGen.set(node.generation, [node]);
  };

  add({ person: focal, role: "focal", generation: 0, branch: focal.branch });
  if (partner) {
    add({ person: partner, role: "partner", generation: 0, branch: partner.branch });
  }

  // Ancestors of both members of the base couple, walked breadth-first.
  const visited = new Set<string>([focal.id, ...(partner ? [partner.id] : [])]);
  const seeds = [focal.id, ...(partner ? [partner.id] : [])];
  for (const seed of seeds) {
    let frontier = [seed];
    for (let gen = 1; gen <= maxGen; gen++) {
      const next: string[] = [];
      for (const childId of frontier) {
        const parents = orderParents(
          (parentsOf.get(childId) ?? []).filter((p) => byId.has(p)),
          byId,
        );
        for (const pid of parents) {
          if (visited.has(pid)) continue;
          visited.add(pid);
          const p = byId.get(pid)!;
          add({ person: p, role: "ancestor", generation: gen, branch: p.branch });
          next.push(pid);
        }
      }
      frontier = next;
    }
  }

  // Children of the base couple.
  const childIds = Array.from(
    new Set([
      ...(childrenOf.get(focal.id) ?? []),
      ...(partner ? childrenOf.get(partner.id) ?? [] : []),
    ]),
  ).filter((id) => byId.has(id));
  for (const cid of childIds) {
    const c = byId.get(cid)!;
    add({ person: c, role: "child", generation: -1, branch: c.branch });
  }

  // Order rows: highest generation (oldest) first, then 0, then -1 (children).
  const rows: PedigreeRow[] = Array.from(byGen.entries())
    .map(([generation, nodes]) => ({ generation, nodes }))
    .sort((a, b) => b.generation - a.generation);

  return { rows, focalId: focal.id, partnerId: partner?.id ?? null };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/contexts/genealogy/ui/tree/pedigree-layout.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/contexts/genealogy/ui/tree/pedigree-layout.ts src/contexts/genealogy/ui/tree/pedigree-layout.test.ts
git commit -m "feat(genealogy): pure generational pedigree row layout"
```

---

## Task 11: Avatar component + monogram helper

**Files:**
- Create: `src/contexts/genealogy/ui/tree/avatar-text.ts`
- Create: `src/contexts/genealogy/ui/tree/Avatar.tsx`
- Test: `src/contexts/genealogy/ui/tree/avatar-text.test.ts`

- [ ] **Step 1: Write the failing test for `monogram`**

Create `src/contexts/genealogy/ui/tree/avatar-text.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { monogram } from "./avatar-text";

describe("monogram", () => {
  it("takes first and last initials", () => {
    expect(monogram("Krishna Murthy")).toBe("KM");
  });
  it("takes a single initial for one name", () => {
    expect(monogram("Asha")).toBe("A");
  });
  it("falls back to ? for empty input", () => {
    expect(monogram("   ")).toBe("?");
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx vitest run src/contexts/genealogy/ui/tree/avatar-text.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement `avatar-text.ts`**

(This is the existing helper from `decor.ts`, moved so the new tree does not
depend on the deleted illustrated-tree module.)

```ts
/** Up to two initials from a person's legal name, e.g. "Krishna Murthy" → "KM". */
export function monogram(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter((p) => /[A-Za-zÀ-ɏ]/.test(p));
  if (parts.length === 0) return "?";
  const first = parts[0]![0]!;
  const second = parts.length > 1 ? parts[parts.length - 1]![0]! : "";
  return (first + second).toUpperCase();
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx vitest run src/contexts/genealogy/ui/tree/avatar-text.test.ts`
Expected: PASS.

- [ ] **Step 5: Implement `Avatar.tsx`**

```tsx
"use client";

import * as React from "react";
import { cn } from "@/shared/ui";
import type { PersonDTO } from "../../application/dtos";
import { monogram } from "./avatar-text";

export interface AvatarProps {
  person: PersonDTO;
  /** Diameter in px. */
  size: number;
  /** Coral ring + bolder border for the focal person. */
  focal?: boolean;
  className?: string;
}

/**
 * Circular avatar: the person's photo if set, otherwise a monogram. The ring is
 * tinted by lineage (paternal = sky, maternal = pink); the focal person gets a
 * coral ring.
 */
export function Avatar({
  person,
  size,
  focal = false,
  className,
}: AvatarProps): React.JSX.Element {
  const ring = focal
    ? "hsl(var(--primary))"
    : person.branch === "Maternal"
      ? "hsl(var(--maternal))"
      : "hsl(var(--paternal))";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted font-bold text-muted-foreground",
        className,
      )}
      style={{
        width: size,
        height: size,
        border: `${focal ? 4 : 3}px solid ${ring}`,
        fontSize: size * 0.36,
      }}
    >
      {person.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={person.photoUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      ) : (
        monogram(person.legalName)
      )}
    </span>
  );
}
```

- [ ] **Step 6: Verify**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/contexts/genealogy/ui/tree/avatar-text.ts src/contexts/genealogy/ui/tree/avatar-text.test.ts src/contexts/genealogy/ui/tree/Avatar.tsx
git commit -m "feat(genealogy): Avatar component with photo/monogram and lineage ring"
```

---

## Task 12: FamilyTree view + render smoke test

**Files:**
- Create: `src/contexts/genealogy/ui/tree/FamilyTree.tsx`
- Test: `test/integration/family-tree-render.test.tsx`

- [ ] **Step 1: Implement `FamilyTree.tsx`**

```tsx
"use client";

import * as React from "react";
import { Button, cn } from "@/shared/ui";
import type { TreeDTO } from "../../application/dtos";
import { lifespan } from "../format";
import {
  layoutPedigree,
  type PedigreeNode,
} from "./pedigree-layout";
import { Avatar } from "./Avatar";

export interface FamilyTreeProps {
  tree: TreeDTO;
  focalId: string;
  onReroot?: (personId: string) => void;
  onOpenProfile?: (personId: string) => void;
  familyName?: string;
  className?: string;
}

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 1.6;

function nodeSize(node: PedigreeNode): number {
  if (node.role === "focal") return 108;
  if (node.role === "partner") return 84;
  if (node.role === "child") return 72;
  return Math.max(56, 84 - node.generation * 8);
}

/**
 * The photo family tree: people laid out in generation rows (ancestors above,
 * focal couple centered, children below). Clicking a person re-roots the tree;
 * double-clicking opens their profile. A thin view over {@link layoutPedigree}.
 */
export function FamilyTree({
  tree,
  focalId,
  onReroot,
  onOpenProfile,
  familyName = "Our Family",
  className,
}: FamilyTreeProps): React.JSX.Element {
  const layout = React.useMemo(
    () => layoutPedigree(tree, { focalId, maxAncestorGen: 3 }),
    [tree, focalId],
  );
  const [zoom, setZoom] = React.useState(1);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom out"
          onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.15).toFixed(2)))}
        >
          −
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Zoom in"
          onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.15).toFixed(2)))}
        >
          +
        </Button>
        <Button variant="ghost" onClick={() => setZoom(1)}>
          Reset
        </Button>
        <p className="ml-2 text-sm text-muted-foreground">
          Tip: click a person to re-center; double-click to open their profile.
        </p>
      </div>

      <div className="overflow-auto rounded-2xl border border-border bg-background p-6">
        <div
          role="tree"
          aria-label={`${familyName} tree`}
          className="mx-auto flex w-max flex-col items-center gap-10"
          style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
        >
          {layout.rows.map((row) => (
            <div
              key={row.generation}
              className="flex items-start justify-center gap-8"
            >
              {row.nodes.map((node) => (
                <PersonNode
                  key={node.person.id}
                  node={node}
                  focal={node.person.id === layout.focalId}
                  onReroot={onReroot}
                  onOpenProfile={onOpenProfile}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PersonNode({
  node,
  focal,
  onReroot,
  onOpenProfile,
}: {
  node: PedigreeNode;
  focal: boolean;
  onReroot?: (id: string) => void;
  onOpenProfile?: (id: string) => void;
}): React.JSX.Element {
  const { person } = node;
  const dates = lifespan(person);
  const activate = () => onReroot?.(person.id);
  return (
    <div
      role="treeitem"
      tabIndex={0}
      aria-label={`${person.displayName}${dates ? `, ${dates}` : ""}. Click to center the tree on them.`}
      onClick={activate}
      onDoubleClick={() => onOpenProfile?.(person.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          activate();
        }
      }}
      className="ff-node flex w-28 cursor-pointer flex-col items-center gap-2 rounded-2xl p-1 text-center"
    >
      <Avatar person={person} size={nodeSize(node)} focal={focal} />
      {focal ? (
        <span className="rounded-full bg-primary px-2 py-0.5 text-xs font-bold text-primary-foreground">
          Centered
        </span>
      ) : null}
      <span className="text-sm font-bold leading-tight text-foreground">
        {person.displayName}
      </span>
      {dates ? (
        <span className="text-xs text-muted-foreground">{dates}</span>
      ) : null}
    </div>
  );
}
```

- [ ] **Step 2: Write the render smoke test**

Create `test/integration/family-tree-render.test.tsx`:

```tsx
import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { InMemoryKeyValueStore } from "@/shared/infrastructure";
import { FixedClock } from "@/shared/ports/clock";
import { SequentialIdGenerator } from "@/shared/ports/id-generator";
import { resetContainer, setContainer } from "@/bootstrap/container";
import { composeContainer } from "@/bootstrap/compose";
import { seedIfEmpty } from "@/bootstrap/seed";
import type { TreeDTO } from "@/contexts/genealogy";
import { FamilyTree } from "@/contexts/genealogy/ui/tree/FamilyTree";

describe("FamilyTree renders the seeded family", () => {
  let tree: TreeDTO;
  let focalId: string;

  beforeEach(async () => {
    resetContainer();
    const deps = {
      store: new InMemoryKeyValueStore(),
      clock: new FixedClock(Date.UTC(2024, 0, 15)),
      ids: new SequentialIdGenerator("t"),
    };
    const container = composeContainer(deps);
    setContainer(container);
    await seedIfEmpty(container, deps);
    tree = await container.genealogy.getTree();
    const hasParents = new Set(
      tree.edges.filter((e) => e.type === "ParentOf").map((e) => e.toPersonId),
    );
    const spouses = new Set(
      tree.edges
        .filter((e) => e.type === "SpouseOf")
        .flatMap((e) => [e.fromPersonId, e.toPersonId]),
    );
    focalId = tree.nodes.find((n) => hasParents.has(n.id) && spouses.has(n.id))!.id;
  });

  it("renders a tree role with people as treeitems and re-roots on click", () => {
    const clicked: string[] = [];
    render(
      <FamilyTree
        tree={tree}
        focalId={focalId}
        familyName="Test Family"
        onReroot={(id) => clicked.push(id)}
      />,
    );
    expect(screen.getByRole("tree")).toBeInTheDocument();
    const items = screen.getAllByRole("treeitem");
    expect(items.length).toBeGreaterThan(1);
    fireEvent.click(items[0]!);
    expect(clicked.length).toBe(1);
  });
});
```

- [ ] **Step 3: Run the test**

Run: `npx vitest run test/integration/family-tree-render.test.tsx`
Expected: PASS.

> If `@testing-library/jest-dom` matchers like `toBeInTheDocument` are not set
> up, replace that assertion with `expect(screen.getByRole("tree")).toBeTruthy()`.
> (The existing `fan-render.test.tsx` used these matchers, so they are available.)

- [ ] **Step 4: Commit**

```bash
git add src/contexts/genealogy/ui/tree/FamilyTree.tsx test/integration/family-tree-render.test.tsx
git commit -m "feat(genealogy): photo family tree view with re-root and zoom"
```

---

## Task 13: Swap the tree page to the photo tree + hero strip; remove the fan

**Files:**
- Modify: `app/tree/page.tsx`
- Modify: `app/globals.css` (drop `.ff-node` hover that referenced the old SVG, keep a generic one)
- Delete: `src/contexts/genealogy/ui/tree/FamilyTreeFan.tsx`
- Delete: `src/contexts/genealogy/ui/tree/decor.ts`
- Delete: `src/contexts/genealogy/ui/tree/fan-layout.ts`
- Delete: `src/contexts/genealogy/ui/tree/fan-layout.test.ts`
- Delete: `test/integration/fan-render.test.tsx`

- [ ] **Step 1: Update `app/tree/page.tsx` — import swap + hero strip**

Change the import:

```ts
import { FamilyTree } from "@/contexts/genealogy/ui/tree/FamilyTree";
```

Replace the header `<div className="flex flex-wrap items-end justify-between gap-4">…</div>`
block with a hero strip:

```tsx
      <div className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-br from-muted via-[#f3f1fb] to-[#fdeef0] px-8 py-7">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-brand">
            {familyName}
          </h1>
          <p className="mt-1 max-w-md text-muted-foreground">
            {focalPerson
              ? `Centered on ${focalPerson.displayName}. Ancestors fan upward; children grow below.`
              : "Your family, woven together."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {focal && defaultFocal && focal !== defaultFocal ? (
            <Button variant="outline" onClick={() => setFocalId(null)}>
              Recenter
            </Button>
          ) : null}
          {focalPerson ? (
            <Button
              variant="outline"
              onClick={() => router.push(`/tree/${focalPerson.id}`)}
            >
              View profile
            </Button>
          ) : null}
          <Button onClick={() => setAdding((v) => !v)}>
            {adding ? "Close" : "＋ Add a person"}
          </Button>
        </div>
      </div>
```

Replace the `<FamilyTreeFan … />` usage at the bottom with:

```tsx
        <FamilyTree
          tree={tree}
          focalId={focal}
          familyName={familyName}
          onReroot={(id) => setFocalId(id)}
          onOpenProfile={(id) => router.push(`/tree/${id}`)}
        />
```

- [ ] **Step 2: Simplify `.ff-node` in `globals.css`**

Replace the three `.ff-node` rules with a single hover/focus affordance that
works for the new HTML nodes:

```css
/* Tree person nodes: gentle hover/focus affordance. */
.ff-node {
  transition: background-color 0.15s ease, transform 0.15s ease;
}
.ff-node:hover {
  background-color: hsl(var(--muted));
}
.ff-node:focus-visible {
  outline: 3px solid hsl(var(--brand));
  outline-offset: 2px;
}
```

- [ ] **Step 3: Delete the illustrated-fan files**

```bash
git rm src/contexts/genealogy/ui/tree/FamilyTreeFan.tsx \
       src/contexts/genealogy/ui/tree/decor.ts \
       src/contexts/genealogy/ui/tree/fan-layout.ts \
       src/contexts/genealogy/ui/tree/fan-layout.test.ts \
       test/integration/fan-render.test.tsx
```

> These were all uncommitted WIP per the spec. If `git rm` errors because a file
> was never committed, use plain `rm` for that path instead.

- [ ] **Step 4: Verify nothing else imports the removed modules**

Run: `grep -rn "FamilyTreeFan\|fan-layout\|tree/decor" src app test`
Expected: no matches.

- [ ] **Step 5: Typecheck and run the full suite**

Run: `npm run typecheck && npm test`
Expected: PASS (no references to deleted modules; new tests green).

- [ ] **Step 6: Commit**

```bash
git add app/tree/page.tsx app/globals.css
git commit -m "feat(genealogy): show photo tree with hero strip; remove illustrated fan"
```

---

## Task 14: Show + change photo on the person profile

**Files:**
- Modify: `src/contexts/genealogy/ui/PersonProfile.tsx`

- [ ] **Step 1: Add an avatar with change/remove to the profile header**

In `PersonProfile.tsx`:

1. Update imports:

```ts
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  PhotoInput,
} from "@/shared/ui";
import { useEditPersonMutation } from "./api";
```

2. Inside the `PersonProfile` component body, before the `return`, add the
mutation:

```ts
  const [editPerson] = useEditPersonMutation();
```

3. Replace the `<CardHeader>…</CardHeader>` block with one that includes a
photo control wired to `editPerson`:

```tsx
        <CardHeader>
          <div className="flex items-center gap-4">
            <PhotoInput
              value={person.photoUrl}
              onChange={(dataUrl) =>
                void editPerson({ id: person.id, photoUrl: dataUrl })
              }
              fallback={person.displayName.charAt(0).toUpperCase()}
            />
            <div>
              <CardTitle>{person.displayName}</CardTitle>
              {person.nickname ? (
                <p className="text-muted-foreground">
                  Legal name: {person.legalName}
                </p>
              ) : null}
            </div>
          </div>
        </CardHeader>
```

> `editPerson` accepts `photoUrl: string | null`; passing `null` clears it,
> matching Task 5. RTK Query invalidates `Tree` and this `Person`, so the tree
> and profile refresh automatically.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/contexts/genealogy/ui/PersonProfile.tsx
git commit -m "feat(genealogy): view and change a person's photo on their profile"
```

---

## Task 15: Optional seed photos + final verification

**Files:**
- Modify: `src/bootstrap/seed.ts` (only if it constructs people via `addPerson`/inputs; add a couple of photoUrls for demo polish — OPTIONAL)

- [ ] **Step 1: (Optional) Give two seeded people demo photos**

Open `src/bootstrap/seed.ts`. If people are created through `addPerson` inputs,
add `photoUrl` to one or two of them using a small inline data URL or a public
avatar URL string (e.g. `"https://i.pravatar.cc/256?img=12"`). Skip this step if
the seed shape makes it awkward — it is cosmetic only. Do not change seed
relationships or ids.

- [ ] **Step 2: Full typecheck + test suite**

Run: `npm run typecheck && npm test`
Expected: PASS — all suites green, including `pedigree-layout`, `avatar-text`,
`image-resize`, `use-cases`, `repositories`, `person`, and
`family-tree-render`.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`, open the app, and verify:
- Header is white with pill nav links; the active page link is highlighted.
- Buttons are coral pills; cards are rounded with soft shadows.
- The tree shows photo/monogram avatars in generation rows with a hero strip.
- "Add a person" with a photo → the photo appears on the tree.
- Open a profile → change the photo → it updates on the profile and tree.
- Reload the page → the photo persists (localStorage).
- Click a person → tree re-roots; double-click → opens their profile.

- [ ] **Step 4: Commit (if seed changed)**

```bash
git add src/bootstrap/seed.ts
git commit -m "chore(seed): demo photos for the starter family"
```

---

## Self-Review Notes

- **Spec coverage:** Layer 1 → Tasks 1–3; Layer 2 model → Tasks 4–6; Layer 2
  capture UI → Tasks 7–9 + 14; Layer 3 → Tasks 10–13. Verification → Task 15.
- **Backward compatibility:** `SCHEMA_VERSION` is intentionally not bumped
  (Task 6) so existing localStorage survives, per spec.
- **Type consistency:** `photoUrl` is `string | undefined` in the domain,
  `string | null` in DTO/stored/edit-input, `string | undefined` in add-input —
  matching the existing pattern for `bio`/`birthplace`. `layoutPedigree`,
  `PedigreeNode`, `PedigreeRow`, `PedigreeLayout`, `Avatar`, and `FamilyTree`
  names are used consistently across Tasks 10–13.
- **Removed module references:** Task 13 Step 4 greps to ensure nothing imports
  the deleted fan modules.
