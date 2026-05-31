/**
 * KeyValueStore — the low-level persistence seam (TECHNICAL_DESIGN §8).
 * Phase 0 ships an in-memory and a localStorage adapter; a backend swap
 * replaces these without touching repositories.
 */
export interface KeyValueStore {
  read(namespace: string): string | null;
  write(namespace: string, payload: string): void;
  remove(namespace: string): void;
}

/** In-memory adapter — used by tests/fixtures and as the SSR-safe default. */
export class InMemoryKeyValueStore implements KeyValueStore {
  private readonly map = new Map<string, string>();
  read(namespace: string): string | null {
    return this.map.has(namespace) ? (this.map.get(namespace) as string) : null;
  }
  write(namespace: string, payload: string): void {
    this.map.set(namespace, payload);
  }
  remove(namespace: string): void {
    this.map.delete(namespace);
  }
}

/** Browser adapter. Guards against SSR (no window) by no-op'ing reads. */
export class LocalStorageKeyValueStore implements KeyValueStore {
  private get ls(): Storage | null {
    return typeof window !== "undefined" ? window.localStorage : null;
  }
  read(namespace: string): string | null {
    return this.ls?.getItem(namespace) ?? null;
  }
  write(namespace: string, payload: string): void {
    this.ls?.setItem(namespace, payload);
  }
  remove(namespace: string): void {
    this.ls?.removeItem(namespace);
  }
}
