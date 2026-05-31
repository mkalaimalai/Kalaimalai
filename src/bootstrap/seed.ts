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
  const arjun = await person({
    legalName: "Krishna Murthy K V",
    nickname: "Appa",
    gender: "Male",
    birthYear: 1940,
    passingYear: 2018,
    branch: "Paternal",
    birthplace: "Tirupati",
    bio: "Patriarch of the Sharma family; schoolteacher.",
  });
  const lakshmi = await person({
    legalName: "Indrani V R",
    nickname: "Amma",
    gender: "Female",
    birthYear: 1945,
    branch: "Paternal",
    birthplace: "Madurai",
  });
  const raman = await person({
    legalName: "Seshadri V",
    gender: "Male",
    birthYear: 1942,
    passingYear: 2020,
    branch: "Maternal",
    birthplace: "Tirupati",
  });
  const saroja = await person({
    legalName: "Leelavathi",
    gender: "Female",
    birthYear: 1947,
    branch: "Maternal",
    birthplace: "Tirupati",
  });

  // --- Generation 2: parents + siblings ---
  const vijay = await person({
    legalName: "Madhu Kalaimalai",
    gender: "Male",
    birthYear: 1969,
    birthMonth: 9,
    birthDay: 10,
    branch: "Paternal",
    bio: "Civil engineer; Software Architect.",
  });
  const priya = await person({
    legalName: "Priya Sharma",
    gender: "Female",
    birthYear: 1970,
    birthMonth: 11,
    birthDay: 2,
    branch: "Paternal",
  });
  const meena = await person({
    legalName: "Meena Sharma",
    nickname: "Meenu",
    gender: "Female",
    birthYear: 1972,
    birthMonth: 8,
    birthDay: 23,
    branch: "Maternal",
    bio: "Doctor; married into the Sharma family.",
  });

  // --- Generation 3: children ---
  const anika = await person({
    legalName: "Anika Sharma",
    gender: "Female",
    birthYear: 1998,
    birthMonth: 3,
    birthDay: 4,
    branch: "Paternal",
  });
  const rohan = await person({
    legalName: "Rohan Sharma",
    gender: "Male",
    birthYear: 2001,
    birthMonth: 12,
    birthDay: 25,
    branch: "Paternal",
  });

  // --- Relationships ---
  await relate("SpouseOf", arjun, lakshmi);
  await relate("SpouseOf", raman, saroja);
  await relate("SpouseOf", vijay, meena);

  await relate("ParentOf", arjun, vijay);
  await relate("ParentOf", lakshmi, vijay);
  await relate("ParentOf", arjun, priya);
  await relate("ParentOf", lakshmi, priya);
  await relate("ParentOf", raman, meena);
  await relate("ParentOf", saroja, meena);

  await relate("ParentOf", vijay, anika);
  await relate("ParentOf", meena, anika);
  await relate("ParentOf", vijay, rohan);
  await relate("ParentOf", meena, rohan);

  // --- A few memories so Timeline / Feed are alive ---
  const m = container.memories;
  await m.addMemory({
    caption: "Diwali 2019 at the family home",
    media: dataUrlSwatch(35),
    storeMedia: true,
    date: { year: 2019, month: 10, day: 27 },
    place: "Madurai",
    taggedPeople: [vijay, meena, anika, rohan],
  });
  await m.addMemory({
    caption: "Anika's college graduation",
    media: dataUrlSwatch(150),
    storeMedia: true,
    date: { year: 2020, month: 6, day: 12 },
    place: "Chennai",
    taggedPeople: [anika, vijay, meena],
  });
  await m.addMemory({
    caption: "Rohan's first cricket match",
    media: dataUrlSwatch(210),
    storeMedia: true,
    date: { year: 2015, month: 7, day: 18 },
    place: "Bengaluru",
    taggedPeople: [rohan, vijay],
  });

  // Sign in as a starter Admin, linked to a real person in the tree, so
  // role-gated UI (e.g. approving structural changes) works out of the box.
  await container.identity.ensureSeedAdmin({
    displayName: "Vijay Sharma",
    linkedPersonId: vijay,
  });

  deps.store.write(SEED_FLAG, "1");
}
