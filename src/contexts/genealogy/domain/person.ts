import {
  ApproximateDate,
  type Branch,
  type PersonId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";

export type Gender = "Male" | "Female" | "Other" | "Unknown";
export type Visibility = "Public" | "Restricted" | "Unlisted";

export const Gender = {
  values: ["Male", "Female", "Other", "Unknown"] as const,
  is(value: string): value is Gender {
    return (
      value === "Male" ||
      value === "Female" ||
      value === "Other" ||
      value === "Unknown"
    );
  },
};

export const Visibility = {
  values: ["Public", "Restricted", "Unlisted"] as const,
  is(value: string): value is Visibility {
    return value === "Public" || value === "Restricted" || value === "Unlisted";
  },
};

export interface PersonProps {
  readonly id: PersonId;
  readonly legalName: string;
  readonly nickname?: string;
  readonly gender: Gender;
  readonly birth?: ApproximateDate;
  readonly passing?: ApproximateDate;
  readonly birthplace?: string;
  readonly currentLocation?: string;
  readonly bio?: string;
  readonly photoUrl?: string;
  readonly visibility: Visibility;
  readonly branch: Branch;
}

/**
 * Person — aggregate root of the Genealogy context (TECHNICAL_DESIGN §4.3).
 * Immutable: mutating operations return a new Person (or a Result for guarded
 * ones). Construct via {@link Person.create}, which validates invariants.
 */
export class Person {
  private constructor(private readonly props: PersonProps) {}

  static create(props: PersonProps): Result<Person> {
    const legalName = props.legalName.trim();
    if (legalName.length === 0) {
      return fail("PERSON_NAME_REQUIRED", "A person must have a legal name.");
    }
    if (!Gender.is(props.gender)) {
      return fail("PERSON_GENDER_INVALID", `Invalid gender: ${props.gender}.`);
    }
    if (!Visibility.is(props.visibility)) {
      return fail(
        "PERSON_VISIBILITY_INVALID",
        `Invalid visibility: ${props.visibility}.`,
      );
    }
    if (
      props.birth &&
      props.passing &&
      props.passing.compare(props.birth) < 0
    ) {
      return fail(
        "PERSON_PASSING_BEFORE_BIRTH",
        "Date of passing cannot precede date of birth.",
      );
    }
    return ok(
      new Person({
        ...props,
        legalName,
        nickname: props.nickname?.trim() || undefined,
        birthplace: props.birthplace?.trim() || undefined,
        currentLocation: props.currentLocation?.trim() || undefined,
        bio: props.bio?.trim() || undefined,
        photoUrl: props.photoUrl?.trim() || undefined,
      }),
    );
  }

  get id(): PersonId {
    return this.props.id;
  }
  get legalName(): string {
    return this.props.legalName;
  }
  get nickname(): string | undefined {
    return this.props.nickname;
  }
  get displayName(): string {
    return this.props.nickname ?? this.props.legalName;
  }
  get gender(): Gender {
    return this.props.gender;
  }
  get birth(): ApproximateDate | undefined {
    return this.props.birth;
  }
  get passing(): ApproximateDate | undefined {
    return this.props.passing;
  }
  get birthplace(): string | undefined {
    return this.props.birthplace;
  }
  get currentLocation(): string | undefined {
    return this.props.currentLocation;
  }
  get bio(): string | undefined {
    return this.props.bio;
  }
  get photoUrl(): string | undefined {
    return this.props.photoUrl;
  }
  get visibility(): Visibility {
    return this.props.visibility;
  }
  get branch(): Branch {
    return this.props.branch;
  }

  /** Deceased iff a date of passing is recorded. */
  get isDeceased(): boolean {
    return this.props.passing !== undefined;
  }

  /** Unlisted people are excluded from feeds/reminders (TECHNICAL_DESIGN §4.3). */
  get isUnlisted(): boolean {
    return this.props.visibility === "Unlisted";
  }

  /**
   * Invariant guard: a deceased person cannot gain a future-dated life event
   * (an event after their recorded passing).
   */
  canAddEvent(eventDate: ApproximateDate): Result<true> {
    if (this.props.passing && eventDate.compare(this.props.passing) > 0) {
      return fail(
        "DECEASED_FUTURE_EVENT",
        "A deceased person cannot gain a life event after their passing.",
      );
    }
    return ok(true);
  }

  /** Returns a new Person with the given fields changed (re-validated). */
  withChanges(changes: PersonChanges): Result<Person> {
    return Person.create({ ...this.props, ...changes });
  }
}

/** Mutable patch shape for {@link Person.withChanges}. */
export type PersonChanges = {
  -readonly [K in keyof Omit<PersonProps, "id">]?: PersonProps[K];
};
