import {
  ApproximateDate,
  Branch,
  PersonId,
  RelationshipId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";
import type { IdGenerator } from "@/shared/ports";
import { Person, type Gender } from "../domain/person";
import { Relationship } from "../domain/relationship";
import type { PersonRepository, RelationshipRepository } from "./ports";

/**
 * Minimal but real GEDCOM 5.5.1 support (PRD F1.6). Parses/emits INDI and FAM
 * records covering name (NAME), sex (SEX), birth date (BIRT/DATE), and
 * parent/child links (FAM HUSB/WIFE/CHIL → ParentOf edges). Other tags are
 * ignored on import and omitted on export — intentionally narrow, not lossy of
 * what it claims to support.
 */

interface GedcomLine {
  level: number;
  tag: string;
  pointer?: string; // @I1@ on the record-defining line
  value?: string;
}

function parseLine(raw: string): GedcomLine | null {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  const match = /^(\d+)\s+(@[^@]+@\s+)?(\S+)(?:\s+(.*))?$/.exec(trimmed);
  if (!match) return null;
  const level = Number(match[1]);
  const xrefOnLine = match[2]?.trim();
  const tag = match[3] ?? "";
  const value = match[4];
  if (xrefOnLine) {
    // Record-defining line: "0 @I1@ INDI"
    return { level, tag, pointer: xrefOnLine, value };
  }
  return { level, tag, value };
}

const MONTHS: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
};
const MONTH_NAMES = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

/** Parse a GEDCOM DATE value (e.g. "12 JAN 1998", "JAN 1998", "1998"). */
export function parseGedcomDate(value: string): ApproximateDate | undefined {
  const parts = value.trim().toUpperCase().split(/\s+/).filter(Boolean);
  // Drop qualifiers like ABT, EST, BEF, AFT.
  const tokens = parts.filter((t) => !/^(ABT|EST|CAL|BEF|AFT|FROM|TO)$/.test(t));
  if (tokens.length === 0) return undefined;
  let day: number | undefined;
  let month: number | undefined;
  let year: number | undefined;
  for (const tok of tokens) {
    if (MONTHS[tok] !== undefined) month = MONTHS[tok];
    else if (/^\d{1,2}$/.test(tok) && day === undefined && year === undefined && month === undefined)
      day = Number(tok);
    else if (/^\d{3,4}$/.test(tok)) year = Number(tok);
    else if (/^\d{1,2}$/.test(tok) && day === undefined) day = Number(tok);
  }
  if (year === undefined) return undefined;
  try {
    if (day !== undefined && month !== undefined)
      return ApproximateDate.day(year, month, day);
    if (month !== undefined)
      return ApproximateDate.fromParts({ year, month });
    return ApproximateDate.year(year);
  } catch {
    return undefined;
  }
}

function formatGedcomDate(date: ApproximateDate): string {
  switch (date.precision) {
    case "day":
      return `${date.day} ${MONTH_NAMES[(date.month ?? 1) - 1]} ${date.year}`;
    case "month":
      return `${MONTH_NAMES[(date.month ?? 1) - 1]} ${date.year}`;
    case "year":
      return String(date.year);
  }
}

function sexToGender(sex: string | undefined): Gender {
  if (sex === "M") return "Male";
  if (sex === "F") return "Female";
  return "Unknown";
}

function genderToSex(gender: Gender): string | null {
  if (gender === "Male") return "M";
  if (gender === "Female") return "F";
  return null;
}

interface ParsedIndividual {
  xref: string;
  name?: string;
  sex?: string;
  birth?: ApproximateDate;
}

interface ParsedFamily {
  husband?: string;
  wife?: string;
  children: string[];
}

export interface GedcomImportResult {
  peopleAdded: number;
  relationshipsAdded: number;
}

/** Apply a GEDCOM text import into the given repositories. */
export async function importGedcom(
  text: string,
  deps: {
    people: PersonRepository;
    relationships: RelationshipRepository;
    ids: IdGenerator;
  },
): Promise<Result<GedcomImportResult>> {
  const lines = text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((l): l is GedcomLine => l !== null);

  const individuals = new Map<string, ParsedIndividual>();
  const families: ParsedFamily[] = [];

  let currentIndi: ParsedIndividual | null = null;
  let currentFam: ParsedFamily | null = null;
  let context: "BIRT" | null = null;

  for (const line of lines) {
    if (line.level === 0) {
      currentIndi = null;
      currentFam = null;
      context = null;
      if (line.tag === "INDI" && line.pointer) {
        currentIndi = { xref: line.pointer };
        individuals.set(line.pointer, currentIndi);
      } else if (line.tag === "FAM") {
        currentFam = { children: [] };
        families.push(currentFam);
      }
      continue;
    }

    if (currentIndi) {
      if (line.level === 1) {
        context = null;
        if (line.tag === "NAME" && line.value) {
          currentIndi.name = line.value.replace(/\//g, " ").replace(/\s+/g, " ").trim();
        } else if (line.tag === "SEX" && line.value) {
          currentIndi.sex = line.value.trim();
        } else if (line.tag === "BIRT") {
          context = "BIRT";
        }
      } else if (line.level === 2 && context === "BIRT" && line.tag === "DATE" && line.value) {
        currentIndi.birth = parseGedcomDate(line.value);
      }
    } else if (currentFam) {
      if (line.level === 1 && line.value) {
        const ptr = line.value.trim();
        if (line.tag === "HUSB") currentFam.husband = ptr;
        else if (line.tag === "WIFE") currentFam.wife = ptr;
        else if (line.tag === "CHIL") currentFam.children.push(ptr);
      }
    }
  }

  if (individuals.size === 0) {
    return fail("GEDCOM_EMPTY", "No INDI records found in the GEDCOM text.");
  }

  // Mint local PersonIds for each xref and persist people.
  const xrefToId = new Map<string, PersonId>();
  let peopleAdded = 0;
  for (const indi of individuals.values()) {
    const id = PersonId(deps.ids.next());
    xrefToId.set(indi.xref, id);
    const created = Person.create({
      id,
      legalName: indi.name && indi.name.length > 0 ? indi.name : "Unknown",
      gender: sexToGender(indi.sex),
      birth: indi.birth,
      visibility: "Public",
      branch: Branch.Paternal,
    });
    if (!created.ok) return created;
    await deps.people.save(created.value);
    peopleAdded += 1;
  }

  // Create ParentOf edges from family parent→child links.
  let relationshipsAdded = 0;
  for (const fam of families) {
    const parents = [fam.husband, fam.wife].filter(
      (p): p is string => p !== undefined,
    );
    for (const childXref of fam.children) {
      const childId = xrefToId.get(childXref);
      if (!childId) continue;
      for (const parentXref of parents) {
        const parentId = xrefToId.get(parentXref);
        if (!parentId) continue;
        const rel = Relationship.create({
          id: RelationshipId(deps.ids.next()),
          type: "ParentOf",
          from: parentId,
          to: childId,
        });
        if (!rel.ok) return rel;
        await deps.relationships.save(rel.value);
        relationshipsAdded += 1;
      }
    }
  }

  return ok({ peopleAdded, relationshipsAdded });
}

/** Emit GEDCOM text for the current people + ParentOf relationships. */
export async function exportGedcom(deps: {
  people: PersonRepository;
  relationships: RelationshipRepository;
}): Promise<string> {
  const people = await deps.people.list();
  const relationships = await deps.relationships.list();

  const idToXref = new Map<string, string>();
  people.forEach((p, i) => idToXref.set(p.id as string, `@I${i + 1}@`));

  const out: string[] = [];
  out.push("0 HEAD");
  out.push("1 SOUR FamilyFabric");
  out.push("1 GEDC");
  out.push("2 VERS 5.5.1");
  out.push("1 CHAR UTF-8");

  for (const person of people) {
    const xref = idToXref.get(person.id as string);
    out.push(`0 ${xref} INDI`);
    out.push(`1 NAME ${person.legalName}`);
    const sex = genderToSex(person.gender);
    if (sex) out.push(`1 SEX ${sex}`);
    if (person.birth) {
      out.push("1 BIRT");
      out.push(`2 DATE ${formatGedcomDate(person.birth)}`);
    }
    if (person.passing) {
      out.push("1 DEAT");
      out.push(`2 DATE ${formatGedcomDate(person.passing)}`);
    }
  }

  // Group ParentOf edges into families keyed by the (sorted) parent set.
  const parentEdges = relationships.filter((r) => r.type === "ParentOf");
  const childToParents = new Map<string, Set<string>>();
  for (const edge of parentEdges) {
    const child = edge.to as string;
    const set = childToParents.get(child) ?? new Set<string>();
    set.add(edge.from as string);
    childToParents.set(child, set);
  }
  const familyMap = new Map<string, { parents: string[]; children: string[] }>();
  for (const [child, parents] of childToParents) {
    const key = Array.from(parents).sort().join("|");
    const fam = familyMap.get(key) ?? { parents: Array.from(parents), children: [] };
    fam.children.push(child);
    familyMap.set(key, fam);
  }

  let famIndex = 1;
  const genderOf = new Map(people.map((p) => [p.id as string, p.gender]));
  for (const fam of familyMap.values()) {
    out.push(`0 @F${famIndex}@ FAM`);
    for (const parentId of fam.parents) {
      const xref = idToXref.get(parentId);
      if (!xref) continue;
      const tag = genderOf.get(parentId) === "Female" ? "WIFE" : "HUSB";
      out.push(`1 ${tag} ${xref}`);
    }
    for (const childId of fam.children) {
      const xref = idToXref.get(childId);
      if (xref) out.push(`1 CHIL ${xref}`);
    }
    famIndex += 1;
  }

  out.push("0 TRLR");
  return out.join("\n") + "\n";
}
