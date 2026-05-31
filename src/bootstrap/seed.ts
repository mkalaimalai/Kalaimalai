import type { AppContainer, SharedDeps } from "./container";
import type { Branch } from "@/shared/kernel";

/**
 * Seeds a believable starter family on first run so the app is "alive"
 * immediately (TECHNICAL_DESIGN §8; PRD activation metric). Idempotent: guarded
 * by a flag namespace and a non-empty-tree check.
 */
const SEED_FLAG = "ff:seed:done";

function dataUrlSwatch(hue: number): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='120'><rect width='160' height='120' fill='hsl(${hue},45%,72%)'/><circle cx='80' cy='52' r='26' fill='hsl(${hue},45%,55%)'/><rect x='40' y='84' width='80' height='30' rx='12' fill='hsl(${hue},45%,55%)'/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export async function seedIfEmpty(
  container: AppContainer,
  deps: SharedDeps,
): Promise<void> {
  if (deps.store.read(SEED_FLAG)) return;
  const existing = await container.genealogy.getTree();
  if (existing.nodes.length > 0) {
    deps.store.write(SEED_FLAG, "1");
    return;
  }

  const g = container.genealogy;

  async function person(input: {
    legalName: string;
    nickname?: string;
    gender: "Male" | "Female" | "Other" | "Unknown";
    birthYear?: number;
    birthMonth?: number;
    birthDay?: number;
    passingYear?: number;
    branch: Branch;
    birthplace?: string;
    bio?: string;
  }): Promise<string> {
    const birth =
      input.birthYear != null
        ? {
            year: input.birthYear,
            month: input.birthMonth ?? null,
            day: input.birthDay ?? null,
          }
        : null;
    const passing =
      input.passingYear != null
        ? { year: input.passingYear, month: null, day: null }
        : null;
    const res = await g.addPerson({
      legalName: input.legalName,
      nickname: input.nickname,
      gender: input.gender,
      birth,
      passing,
      birthplace: input.birthplace,
      bio: input.bio,
      visibility: "Public",
      branch: input.branch,
    });
    if (!res.ok) {
      throw new Error(`seed addPerson failed: ${res.error.message}`);
    }
    return res.value.id;
  }

  async function relate(
    type: "ParentOf" | "SpouseOf",
    from: string,
    to: string,
  ): Promise<void> {
    const proposed = await g.proposeRelationshipChange({
      action: "add",
      type,
      fromPersonId: from,
      toPersonId: to,
      proposedBy: "system-seed",
    });
    if (!proposed.ok) {
      throw new Error(`seed propose failed: ${proposed.error.message}`);
    }
    const approved = await g.approveRelationshipChange({
      changeRequestId: proposed.value.id,
      actorRole: "Admin",
    });
    if (!approved.ok) {
      throw new Error(`seed approve failed: ${approved.error.message}`);
    }
  }

  // --- Generation 1: grandparents ---
  const krishna = await person({
    legalName: "Krishna Murthy K V",
    gender: "Male",
    birthYear: 1953,
    passingYear: 2005,
    branch: "Paternal",
    birthplace: "Tirupati",
    bio: "Patriarch of the Kalaimalai family; schoolteacher.",
  });
  const indrani = await person({
    legalName: "Indrani V R",
    gender: "Female",
    birthYear: 1958,
    branch: "Paternal",
    birthplace: "Madurai",
  });
  const dharwadkar = await person({
    legalName: "Narasimha Rao Dharwakar",
    gender: "Male",
    birthYear: 1943,
    passingYear: 2025,
    branch: "Maternal",
    birthplace: "Tirupati",
  });
  const laxmi = await person({
    legalName: "Laxmi Devi",
    gender: "Female",
    birthYear: 1954,
    branch: "Maternal",
    birthplace: "Tirupati",
  });

  // --- Generation 2: parents + siblings ---
  const madhu = await person({
    legalName: "Madhu Kalaimalai",
    gender: "Male",
    birthYear: 1969,
    birthMonth: 9,
    birthDay: 10,
    branch: "Paternal",
    bio: "Civil engineer; Software Architect.",
  });
  const usha = await person({
    legalName: "Usha KV",
    gender: "Female",
    birthYear: 1970,
    birthMonth: 11,
    birthDay: 14,
    branch: "Paternal",
  });
  const lata = await person({
    legalName: "Lata Kalaimalai",
    nickname: "Lata",
    gender: "Female",
    birthYear: 1971,
    birthMonth: 4,
    birthDay: 6,
    branch: "Maternal",
    bio: "Doctor; married into the Kalaimalai family.",
  });

  // --- Generation 3: children ---
  const manasa = await person({
    legalName: "Manasa Kalaimalai",
    gender: "Female",
    birthYear: 2003,
    birthMonth: 5,
    birthDay: 10,
    branch: "Paternal",
  });
  const bhumika = await person({
    legalName: "Bhumika Kalaimalai",
    gender: "Female",
    birthYear: 2004,
    birthMonth: 11,
    birthDay: 19,
    branch: "Paternal",
  });

  // --- Relationships ---
  await relate("SpouseOf", krishna, indrani);
  await relate("SpouseOf", dharwadkar, laxmi);
  await relate("SpouseOf", madhu, lata);

  await relate("ParentOf", krishna, madhu);
  await relate("ParentOf", indrani, madhu);
  await relate("ParentOf", krishna, usha);
  await relate("ParentOf", indrani, usha);
  await relate("ParentOf", dharwadkar, lata);
  await relate("ParentOf", laxmi, lata);

  await relate("ParentOf", madhu, manasa);
  await relate("ParentOf", lata, manasa);
  await relate("ParentOf", madhu, bhumika);
  await relate("ParentOf", lata, bhumika);

  // --- A few memories so Timeline / Feed are alive ---
  const m = container.memories;
  await m.addMemory({
    caption: "Diwali 2019 at the family home",
    media: dataUrlSwatch(35),
    storeMedia: true,
    date: { year: 2019, month: 10, day: 27 },
    place: "Madurai",
    taggedPeople: [madhu, lata, manasa, bhumika],
  });
  await m.addMemory({
    caption: "manasa's college graduation",
    media: dataUrlSwatch(150),
    storeMedia: true,
    date: { year: 2020, month: 6, day: 12 },
    place: "Chennai",
    taggedPeople: [manasa, madhu, lata],
  });
  await m.addMemory({
    caption: "bhumika's first cricket match",
    media: dataUrlSwatch(210),
    storeMedia: true,
    date: { year: 2015, month: 7, day: 18 },
    place: "Bengaluru",
    taggedPeople: [bhumika, madhu],
  });

  // Sign in as a starter Admin, linked to a real person in the tree, so
  // role-gated UI (e.g. approving structural changes) works out of the box.
  await container.identity.ensureSeedAdmin({
    displayName: "madhu Kalaimalai",
    linkedPersonId: madhu,
  });

  deps.store.write(SEED_FLAG, "1");
}
