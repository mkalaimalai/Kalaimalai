/** Dual lineage (TECHNICAL_DESIGN §4). A person may belong to either side. */
export type Branch = "Maternal" | "Paternal";

export const Branch = {
  Maternal: "Maternal" as Branch,
  Paternal: "Paternal" as Branch,
  values: ["Maternal", "Paternal"] as const,
  is(value: string): value is Branch {
    return value === "Maternal" || value === "Paternal";
  },
};
