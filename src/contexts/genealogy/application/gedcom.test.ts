import { describe, expect, it } from "vitest";
import { SequentialIdGenerator } from "@/shared/ports";
import {
  FakePersonRepository,
  FakeRelationshipRepository,
} from "./fakes";
import { exportGedcom, importGedcom, parseGedcomDate } from "./gedcom";

const SAMPLE = `0 HEAD
1 CHAR UTF-8
0 @I1@ INDI
1 NAME John /Smith/
1 SEX M
1 BIRT
2 DATE 12 JAN 1950
0 @I2@ INDI
1 NAME Jane /Smith/
1 SEX F
1 BIRT
2 DATE 1952
0 @I3@ INDI
1 NAME Junior /Smith/
1 SEX M
1 BIRT
2 DATE MAR 1980
0 @F1@ FAM
1 HUSB @I1@
1 WIFE @I2@
1 CHIL @I3@
0 TRLR
`;

function deps() {
  return {
    people: new FakePersonRepository(),
    relationships: new FakeRelationshipRepository(),
    ids: new SequentialIdGenerator("ged"),
  };
}

describe("parseGedcomDate", () => {
  it("parses day-precise dates", () => {
    const d = parseGedcomDate("12 JAN 1998");
    expect(d?.year).toBe(1998);
    expect(d?.month).toBe(1);
    expect(d?.day).toBe(12);
  });
  it("parses month and year precision", () => {
    expect(parseGedcomDate("MAR 1980")?.precision).toBe("month");
    expect(parseGedcomDate("1950")?.precision).toBe("year");
  });
  it("ignores approximation qualifiers", () => {
    expect(parseGedcomDate("ABT 1900")?.year).toBe(1900);
  });
});

describe("importGedcom", () => {
  it("imports individuals and parent/child links", async () => {
    const d = deps();
    const r = await importGedcom(SAMPLE, d);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.peopleAdded).toBe(3);
    expect(r.value.relationshipsAdded).toBe(2); // father+mother -> child

    const people = await d.people.list();
    const john = people.find((p) => p.legalName.includes("John"));
    expect(john?.gender).toBe("Male");
    expect(john?.birth?.year).toBe(1950);

    const rels = await d.relationships.list();
    expect(rels.every((rel) => rel.type === "ParentOf")).toBe(true);
  });

  it("fails on text with no individuals", async () => {
    const d = deps();
    const r = await importGedcom("0 HEAD\n0 TRLR\n", d);
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.error.code).toBe("GEDCOM_EMPTY");
  });
});

describe("exportGedcom round-trip", () => {
  it("re-imports its own export with the same structure", async () => {
    const d1 = deps();
    await importGedcom(SAMPLE, d1);
    const text = await exportGedcom(d1);

    expect(text).toContain("0 HEAD");
    expect(text).toContain("INDI");
    expect(text).toContain("FAM");
    expect(text).toContain("0 TRLR");

    const d2 = deps();
    const r = await importGedcom(text, d2);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.value.peopleAdded).toBe(3);
    expect(r.value.relationshipsAdded).toBe(2);
  });
});
