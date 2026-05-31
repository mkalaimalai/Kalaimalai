/**
 * Branded identifier types. A `PersonId` can never be passed where a `MemoryId`
 * is expected, even though both are strings at runtime (TECHNICAL_DESIGN §4.2).
 */

declare const brand: unique symbol;
type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PersonId = Brand<string, "PersonId">;
export type MemberId = Brand<string, "MemberId">;
export type MemoryId = Brand<string, "MemoryId">;
export type AlbumId = Brand<string, "AlbumId">;
export type EventId = Brand<string, "EventId">;
export type RelationshipId = Brand<string, "RelationshipId">;
export type ChangeRequestId = Brand<string, "ChangeRequestId">;
export type InviteId = Brand<string, "InviteId">;
export type ReactionId = Brand<string, "ReactionId">;
export type CommentId = Brand<string, "CommentId">;
export type WishId = Brand<string, "WishId">;
export type ReminderId = Brand<string, "ReminderId">;

/** Smart constructors — the ONLY way to mint a branded id from a raw string. */
export const PersonId = (raw: string): PersonId => raw as PersonId;
export const MemberId = (raw: string): MemberId => raw as MemberId;
export const MemoryId = (raw: string): MemoryId => raw as MemoryId;
export const AlbumId = (raw: string): AlbumId => raw as AlbumId;
export const EventId = (raw: string): EventId => raw as EventId;
export const RelationshipId = (raw: string): RelationshipId =>
  raw as RelationshipId;
export const ChangeRequestId = (raw: string): ChangeRequestId =>
  raw as ChangeRequestId;
export const InviteId = (raw: string): InviteId => raw as InviteId;
export const ReactionId = (raw: string): ReactionId => raw as ReactionId;
export const CommentId = (raw: string): CommentId => raw as CommentId;
export const WishId = (raw: string): WishId => raw as WishId;
export const ReminderId = (raw: string): ReminderId => raw as ReminderId;
