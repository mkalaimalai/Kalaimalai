import type { Gender } from "../../domain/person";
import type { PersonDTO, TreeDTO } from "../../application/dtos";

/** Compact, year-only lifespan for the tree card (full dates live on profiles). */
function compactYears(person: PersonDTO): string {
  const birth = person.birth?.year;
  const passing = person.passing?.year;
  if (birth && passing) return `${birth} – ${passing}`;
  if (passing) return `d. ${passing}`;
  if (birth) return `b. ${birth}`;
  return "";
}

/**
 * Adapter: our edge-based {@link TreeDTO} → the flat, relationship-pointer
 * format the `family-chart` (f3) library consumes. Pure and side-effect free so
 * it can be reasoned about independently of the D3 view that renders it.
 *
 * Mapping notes:
 * - `ParentOf` edges (from = parent, to = child) populate both sides:
 *   the child's `parents` and the parent's `children`.
 * - `SpouseOf` edges populate both partners' `spouses`.
 * - `SiblingOf` edges are intentionally dropped: f3 derives siblings from a
 *   shared parent, so standalone sibling edges have no representation. Siblings
 *   that share a parent still render correctly via that parent.
 * - f3 requires `gender: "M" | "F"` for layout. Our `Other`/`Unknown` are mapped
 *   to a neutral default so the layout never breaks; the original value is kept
 *   in `data.genderRaw` for display/styling.
 */

/** The flat node shape expected by `family-chart` (mirrors its `Datum` type). */
export interface FamilyChartDatum {
  id: string;
  data: {
    gender: "M" | "F";
    /** Original domain gender, preserved for display/styling. */
    genderRaw: Gender;
    name: string;
    /** Compact lifespan for the card, e.g. "b. 1969" or "1953 – 2005". */
    years: string;
    /** Birthplace (falls back to current location) for the card subtitle. */
    location: string | null;
    avatar: string | null;
    /** "Maternal" | "Paternal" — kept for downstream use (not the card tint). */
    branch: string;
    deceased: boolean;
  };
  rels: {
    parents: string[];
    spouses: string[];
    children: string[];
  };
}

function toF3Gender(gender: Gender): "M" | "F" {
  if (gender === "Male") return "M";
  if (gender === "Female") return "F";
  // f3's layout engine only understands M/F; default the rest neutrally.
  return "M";
}

/** Convert a {@link TreeDTO} into the `family-chart` data array. */
export function toFamilyChartData(tree: TreeDTO): FamilyChartDatum[] {
  const byId = new Map<string, FamilyChartDatum>();

  for (const person of tree.nodes) {
    byId.set(person.id, {
      id: person.id,
      data: {
        gender: toF3Gender(person.gender),
        genderRaw: person.gender,
        name: person.displayName,
        years: compactYears(person),
        location: person.birthplace ?? person.currentLocation,
        avatar: person.photoUrl,
        branch: person.branch,
        deceased: person.isDeceased,
      },
      rels: { parents: [], spouses: [], children: [] },
    });
  }

  const pushUnique = (list: string[], id: string): void => {
    if (!list.includes(id)) list.push(id);
  };

  for (const edge of tree.edges) {
    const a = byId.get(edge.fromPersonId);
    const b = byId.get(edge.toPersonId);
    // Skip edges that reference people not in this (possibly filtered) tree.
    if (!a || !b) continue;

    if (edge.type === "ParentOf") {
      // from = parent, to = child
      pushUnique(a.rels.children, b.id);
      pushUnique(b.rels.parents, a.id);
    } else if (edge.type === "SpouseOf") {
      pushUnique(a.rels.spouses, b.id);
      pushUnique(b.rels.spouses, a.id);
    }
    // SiblingOf: intentionally ignored — see file header.
  }

  return [...byId.values()];
}
