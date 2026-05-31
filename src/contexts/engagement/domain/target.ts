/**
 * What a reaction or comment attaches to (TECHNICAL_DESIGN §10.5). Engagement
 * is reusable across Memories and People, so a target is a small value object:
 * a kind discriminator + the opaque id of the thing being engaged with.
 */
export type TargetType = "Memory" | "Person";

export interface Target {
  readonly targetType: TargetType;
  readonly targetId: string;
}

export function isTargetType(value: string): value is TargetType {
  return value === "Memory" || value === "Person";
}
