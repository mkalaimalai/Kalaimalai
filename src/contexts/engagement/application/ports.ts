import type { MemoryView, PersonView } from "@/shared/views";
import type { Reaction } from "../domain/reaction";
import type { Comment } from "../domain/comment";
import type { Wish } from "../domain/wish";
import type { Target } from "../domain/target";

/**
 * Ports for the Engagement context (TECHNICAL_DESIGN §10.5, AGENT_CONTRACTS
 * "Cross-context reads").
 *
 * Cross-context READ ports — implemented by the integrator by delegating to the
 * Memories / Genealogy modules' query methods. Engagement NEVER imports those
 * contexts' code; it only knows the `@/shared/views` shapes.
 */
export interface MemoriesReadPort {
  listMemories(): Promise<MemoryView[]>;
}

export interface PeopleReadPort {
  listPeople(): Promise<PersonView[]>;
}

/**
 * Output ports for Engagement's OWN persistence. Adapters live in
 * `infrastructure/` over a `Collection`.
 */
export interface ReactionRepository {
  save(reaction: Reaction): Promise<void>;
  listAll(): Promise<Reaction[]>;
  listFor(target: Target): Promise<Reaction[]>;
}

export interface CommentRepository {
  save(comment: Comment): Promise<void>;
  listAll(): Promise<Comment[]>;
  listFor(target: Target): Promise<Comment[]>;
}

export interface WishRepository {
  save(wish: Wish): Promise<void>;
  listAll(): Promise<Wish[]>;
}
