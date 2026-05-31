/**
 * ApproximateDate — a date whose precision may be year, year-month, or full day
 * (TECHNICAL_DESIGN §4.2; PRD F2.1/F4). Pure value object: immutable, comparable,
 * serializable. No timezone — these are calendar facts ("born in 1998").
 */

export type DatePrecision = "year" | "month" | "day";

export interface ApproximateDateProps {
  readonly year: number;
  /** 1-12, present when precision is month or day. */
  readonly month?: number;
  /** 1-31, present when precision is day. */
  readonly day?: number;
}

export interface ApproximateDateJSON {
  readonly year: number;
  readonly month: number | null;
  readonly day: number | null;
}

export class ApproximateDate {
  private constructor(
    readonly year: number,
    readonly month: number | null,
    readonly day: number | null,
  ) {}

  static fromParts(props: ApproximateDateProps): ApproximateDate {
    const { year, month, day } = props;
    if (!Number.isInteger(year)) {
      throw new Error(`ApproximateDate: year must be an integer (${year})`);
    }
    if (month !== undefined) {
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new Error(`ApproximateDate: month out of range (${month})`);
      }
    }
    if (day !== undefined) {
      if (month === undefined) {
        throw new Error("ApproximateDate: day requires a month");
      }
      if (!Number.isInteger(day) || day < 1 || day > 31) {
        throw new Error(`ApproximateDate: day out of range (${day})`);
      }
    }
    return new ApproximateDate(year, month ?? null, day ?? null);
  }

  static year(year: number): ApproximateDate {
    return ApproximateDate.fromParts({ year });
  }

  static day(year: number, month: number, day: number): ApproximateDate {
    return ApproximateDate.fromParts({ year, month, day });
  }

  static fromJSON(json: ApproximateDateJSON): ApproximateDate {
    return ApproximateDate.fromParts({
      year: json.year,
      month: json.month ?? undefined,
      day: json.day ?? undefined,
    });
  }

  get precision(): DatePrecision {
    if (this.day !== null) return "day";
    if (this.month !== null) return "month";
    return "year";
  }

  /** Earliest concrete day this approximate date could represent. */
  toEarliestDate(): Date {
    return new Date(Date.UTC(this.year, (this.month ?? 1) - 1, this.day ?? 1));
  }

  /**
   * Sort key for chronological ordering. Unknown components sort to the start of
   * their range so "1998" precedes "1998-03-04".
   */
  sortKey(): number {
    return this.toEarliestDate().getTime();
  }

  /** Same month/day, used by recurring reminders. Null when not day-precise. */
  monthDay(): { month: number; day: number } | null {
    if (this.month === null || this.day === null) return null;
    return { month: this.month, day: this.day };
  }

  equals(other: ApproximateDate): boolean {
    return (
      this.year === other.year &&
      this.month === other.month &&
      this.day === other.day
    );
  }

  compare(other: ApproximateDate): number {
    return this.sortKey() - other.sortKey();
  }

  toJSON(): ApproximateDateJSON {
    return { year: this.year, month: this.month, day: this.day };
  }

  /** Locale-aware display (N6). Falls back gracefully for coarse precision. */
  format(locale = "en-US"): string {
    switch (this.precision) {
      case "day":
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
          day: "numeric",
        }).format(this.toEarliestDate());
      case "month":
        return new Intl.DateTimeFormat(locale, {
          year: "numeric",
          month: "long",
        }).format(this.toEarliestDate());
      case "year":
        return String(this.year);
    }
  }
}
