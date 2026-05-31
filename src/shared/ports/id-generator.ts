/** IdGenerator port — mints raw unique strings; callers brand them. */
export interface IdGenerator {
  next(): string;
}

export class UuidGenerator implements IdGenerator {
  next(): string {
    if (
      typeof globalThis.crypto !== "undefined" &&
      typeof globalThis.crypto.randomUUID === "function"
    ) {
      return globalThis.crypto.randomUUID();
    }
    // Fallback for environments without crypto.randomUUID.
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}

/** Deterministic generator for tests: prefix-1, prefix-2, … */
export class SequentialIdGenerator implements IdGenerator {
  private counter = 0;
  constructor(private readonly prefix = "id") {}
  next(): string {
    this.counter += 1;
    return `${this.prefix}-${this.counter}`;
  }
}
