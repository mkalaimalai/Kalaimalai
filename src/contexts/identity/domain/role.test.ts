import { describe, expect, it } from "vitest";
import {
  ROLES,
  canApproveMembers,
  canApproveStructuralChanges,
  canCreateInvites,
  isRole,
} from "./role";

describe("Role", () => {
  it("lists the three Phase-0 roles", () => {
    expect(ROLES).toEqual(["Admin", "Member", "ElderViewer"]);
  });

  it("recognizes valid roles and rejects others", () => {
    expect(isRole("Admin")).toBe(true);
    expect(isRole("Member")).toBe(true);
    expect(isRole("ElderViewer")).toBe(true);
    expect(isRole("Owner")).toBe(false);
    expect(isRole(42)).toBe(false);
    expect(isRole(undefined)).toBe(false);
  });

  it("permits only Admin to approve structural changes", () => {
    expect(canApproveStructuralChanges("Admin")).toBe(true);
    expect(canApproveStructuralChanges("Member")).toBe(false);
    expect(canApproveStructuralChanges("ElderViewer")).toBe(false);
  });

  it("permits only Admin to approve members", () => {
    expect(canApproveMembers("Admin")).toBe(true);
    expect(canApproveMembers("Member")).toBe(false);
    expect(canApproveMembers("ElderViewer")).toBe(false);
  });

  it("permits only Admin to create invites", () => {
    expect(canCreateInvites("Admin")).toBe(true);
    expect(canCreateInvites("Member")).toBe(false);
    expect(canCreateInvites("ElderViewer")).toBe(false);
  });
});
