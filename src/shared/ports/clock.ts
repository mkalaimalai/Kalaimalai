/** Clock port — the domain never reads `Date.now()` directly (testability). */
export interface Clock {
  /** Current instant as epoch milliseconds. */
  now(): number;
  /** Current civil date in the given IANA timezone, as Y/M/D parts (N6, TZ-aware). */
  today(timeZone?: string): { year: number; month: number; day: number };
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }

  today(timeZone?: string): { year: number; month: number; day: number } {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(new Date());
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  }
}

/** Deterministic clock for tests/fixtures. */
export class FixedClock implements Clock {
  constructor(private readonly epochMs: number) {}
  now(): number {
    return this.epochMs;
  }
  today(timeZone?: string): { year: number; month: number; day: number } {
    const fmt = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const parts = fmt.formatToParts(new Date(this.epochMs));
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  }
}
