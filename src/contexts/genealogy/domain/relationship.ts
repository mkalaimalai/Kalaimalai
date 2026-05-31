import {
  type PersonId,
  type RelationshipId,
  type Result,
  fail,
  ok,
} from "@/shared/kernel";

export type RelationshipType = "ParentOf" | "SpouseOf" | "SiblingOf";
export type RelationshipQualifier = "adoption" | "step" | "remarriage";

export const RelationshipType = {
  values: ["ParentOf", "SpouseOf", "SiblingOf"] as const,
  is(value: string): value is RelationshipType {
    return value === "ParentOf" || value === "SpouseOf" || value === "SiblingOf";
  },
};

export const RelationshipQualifier = {
  values: ["adoption", "step", "remarriage"] as const,
  is(value: string): value is RelationshipQualifier {
    return value === "adoption" || value === "step" || value === "remarriage";
  },
};

export interface RelationshipProps {
  readonly id: RelationshipId;
  readonly type: RelationshipType;
  /** For ParentOf, `from` is the parent. */
  readonly from: PersonId;
  /** For ParentOf, `to` is the child. */
  readonly to: PersonId;
  readonly qualifier?: RelationshipQualifier;
}

/**
 * Relationship — a typed, directed edge between two people
 * (TECHNICAL_DESIGN §4.3). ParentOf is directional (from=parent, to=child);
 * SpouseOf / SiblingOf are conceptually symmetric but stored as a single edge.
 */
export class Relationship {
  private constructor(private readonly props: RelationshipProps) {}

  static create(props: RelationshipProps): Result<Relationship> {
    if (!RelationshipType.is(props.type)) {
      return fail(
        "RELATIONSHIP_TYPE_INVALID",
        `Invalid relationship type: ${props.type}.`,
      );
    }
    if (props.from === props.to) {
      return fail(
        "RELATIONSHIP_SELF_EDGE",
        "A person cannot have a relationship to themselves.",
      );
    }
    if (
      props.qualifier !== undefined &&
      !RelationshipQualifier.is(props.qualifier)
    ) {
      return fail(
        "RELATIONSHIP_QUALIFIER_INVALID",
        `Invalid qualifier: ${props.qualifier}.`,
      );
    }
    return ok(new Relationship(props));
  }

  get id(): RelationshipId {
    return this.props.id;
  }
  get type(): RelationshipType {
    return this.props.type;
  }
  get from(): PersonId {
    return this.props.from;
  }
  get to(): PersonId {
    return this.props.to;
  }
  get qualifier(): RelationshipQualifier | undefined {
    return this.props.qualifier;
  }

  /** True when this edge connects the two given people (ignoring direction). */
  connects(a: PersonId, b: PersonId): boolean {
    return (
      (this.props.from === a && this.props.to === b) ||
      (this.props.from === b && this.props.to === a)
    );
  }
}
