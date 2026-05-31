"use client";

import * as React from "react";
import type { Role } from "../domain/role";
import { useGetCurrentMemberQuery } from "./api";

/**
 * useCurrentRole — the signed-in member's role, or null while loading / when
 * nobody is signed in. Backed by the RTK Query `getCurrentMember` cache.
 */
export function useCurrentRole(): Role | null {
  const { data } = useGetCurrentMemberQuery();
  return data?.role ?? null;
}

export interface RoleGateProps {
  /** A single role or any-of list that may view the children. */
  allow: Role | readonly Role[];
  /** Rendered when the current role is not permitted (default: nothing). */
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * RoleGate — renders children only when the current member holds a required
 * role (TECHNICAL_DESIGN §10.6, role-gated navigation). Authorization itself is
 * enforced in use cases; this is a presentation guard.
 */
export function RoleGate({
  allow,
  fallback = null,
  children,
}: RoleGateProps): React.ReactElement {
  const role = useCurrentRole();
  const allowed: readonly Role[] = Array.isArray(allow) ? allow : [allow];
  const permitted = role !== null && allowed.includes(role);
  return <>{permitted ? children : fallback}</>;
}
