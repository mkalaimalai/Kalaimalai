import {
  type ApproximateDate,
  type EventId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";

/**
 * FamilyEvent — a grouping aggregate for memories tied to an occasion
 * (e.g. "Diwali 2019"), with either a single approximate date or a date range
 * (TECHNICAL_DESIGN §4.3). Named `FamilyEvent` to avoid clashing with the DOM
 * `Event` global.
 */

export interface DateRange {
  readonly start: ApproximateDate;
  readonly end: ApproximateDate;
}

export interface EventProps {
  readonly id: EventId;
  readonly title: string;
  readonly date?: ApproximateDate;
  readonly dateRange?: DateRange;
}

export class FamilyEvent {
  private constructor(
    readonly id: EventId,
    readonly title: string,
    readonly date: ApproximateDate | null,
    readonly dateRange: DateRange | null,
  ) {}

  static create(props: EventProps): Result<FamilyEvent> {
    const title = props.title.trim();
    if (title.length === 0) {
      return fail("EVENT_TITLE_REQUIRED", "An event needs a title.");
    }
    if (props.dateRange) {
      if (props.dateRange.end.compare(props.dateRange.start) < 0) {
        return fail(
          "EVENT_RANGE_INVALID",
          "An event's end date cannot precede its start date.",
        );
      }
    }
    return ok(
      new FamilyEvent(
        props.id,
        title,
        props.date ?? null,
        props.dateRange ?? null,
      ),
    );
  }
}
