/**
 * Role — the capabilities a Member holds (TECHNICAL_DESIGN §10.6).
 * Admin governs structural changes; Member participates; ElderViewer is a
 * read-focused role for elders (PRD N5, elder-first).
 */
export type Role = "Admin" | "Member" | "ElderViewer";

export const ROLES: readonly Role[] = ["Admin", "Member", "ElderViewer"];

export function isRole(value: unknown): value is Role {
  return (
    value === "Admin" || value === "Member" || value === "ElderViewer"
  );
}

/**
 * Capability check: only an Admin may approve structural changes to the family
 * tree (PRD F1.5; TECHNICAL_DESIGN §9.2 — authorization lives in the domain).
 */
export function canApproveStructuralChanges(role: Role): boolean {
  return role === "Admin";
}

/** Only an Admin may approve a pending member into the family. */
export function canApproveMembers(role: Role): boolean {
  return role === "Admin";
}

/** Only an Admin may create invites. */
export function canCreateInvites(role: Role): boolean {
  return role === "Admin";
}
