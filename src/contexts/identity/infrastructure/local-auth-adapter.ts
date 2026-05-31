import type { KeyValueStore } from "@/shared/infrastructure";
import type { AuthPort } from "../application/ports";

const NAMESPACE = "ff:identity:session";

/**
 * LocalAuthAdapter — Phase-0 stub auth backed by a KeyValueStore
 * (TECHNICAL_DESIGN §9.1: pick-a-member / magic-link simulation). Stores only
 * the current member id; a passwordless backend swaps this adapter later.
 */
export class LocalAuthAdapter implements AuthPort {
  constructor(private readonly store: KeyValueStore) {}

  getCurrentMemberId(): string | null {
    return this.store.read(NAMESPACE);
  }

  setCurrentMember(id: string): void {
    this.store.write(NAMESPACE, id);
  }
}
