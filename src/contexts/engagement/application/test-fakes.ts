import type { MemoryView, PersonView } from "@/shared/views";
import type { Reaction } from "../domain/reaction";
import type { Comment } from "../domain/comment";
import type { Wish } from "../domain/wish";
import type { Target } from "../domain/target";
import type {
  CommentRepository,
  MemoriesReadPort,
  PeopleReadPort,
  ReactionRepository,
  WishRepository,
} from "./ports";

/** In-memory port fakes (TECHNICAL_DESIGN §12: app tests use port fakes). */

export class FakeReactionRepository implements ReactionRepository {
  readonly items: Reaction[] = [];
  async save(reaction: Reaction): Promise<void> {
    this.items.push(reaction);
  }
  async listAll(): Promise<Reaction[]> {
    return this.items.slice();
  }
  async listFor(target: Target): Promise<Reaction[]> {
    return this.items.filter(
      (r) => r.targetType === target.targetType && r.targetId === target.targetId,
    );
  }
}

export class FakeCommentRepository implements CommentRepository {
  readonly items: Comment[] = [];
  async save(comment: Comment): Promise<void> {
    this.items.push(comment);
  }
  async listAll(): Promise<Comment[]> {
    return this.items.slice();
  }
  async listFor(target: Target): Promise<Comment[]> {
    return this.items.filter(
      (c) => c.targetType === target.targetType && c.targetId === target.targetId,
    );
  }
}

export class FakeWishRepository implements WishRepository {
  readonly items: Wish[] = [];
  async save(wish: Wish): Promise<void> {
    this.items.push(wish);
  }
  async listAll(): Promise<Wish[]> {
    return this.items.slice();
  }
}

export class FakeMemoriesReadPort implements MemoriesReadPort {
  constructor(private readonly memories: MemoryView[] = []) {}
  async listMemories(): Promise<MemoryView[]> {
    return this.memories.slice();
  }
}

export class FakePeopleReadPort implements PeopleReadPort {
  constructor(private readonly people: PersonView[] = []) {}
  async listPeople(): Promise<PersonView[]> {
    return this.people.slice();
  }
}

export const memoryView = (
  id: string,
  caption = "A memory",
  date: MemoryView["date"] = null,
): MemoryView => ({
  id,
  caption,
  date,
  place: null,
  taggedPersonIds: [],
  albumId: null,
  mediaRef: null,
});

export const personView = (id: string, displayName = "Someone"): PersonView => ({
  id,
  displayName,
  branch: "Maternal",
  gender: "Unknown",
  birth: null,
  passing: null,
  isDeceased: false,
  isUnlisted: false,
});
