import { type Clock, type IdGenerator } from "@/shared/ports";
import {
  CommentId,
  MemberId,
  MemoryId,
  type Result,
  fail,
  map,
} from "@/shared/kernel";
import { Comment } from "../domain/comment";
import type { CommentRepository, MemoriesReadPort } from "./ports";
import { type CommentDTO, toCommentDTO } from "./dtos";

export interface CommentOnMemoryInput {
  memberId: string;
  memoryId: string;
  text: string;
}

export interface CommentOnMemoryDeps {
  comments: CommentRepository;
  memories: MemoriesReadPort;
  clock: Clock;
  ids: IdGenerator;
}

/**
 * CommentOnMemory (TECHNICAL_DESIGN §10.5). Records a member's comment on an
 * existing memory. Validates that the memory exists via the injected read port.
 */
export function makeCommentOnMemory(deps: CommentOnMemoryDeps) {
  return async function commentOnMemory(
    input: CommentOnMemoryInput,
  ): Promise<Result<CommentDTO>> {
    const memories = await deps.memories.listMemories();
    if (!memories.some((m) => m.id === input.memoryId)) {
      return fail("MEMORY_NOT_FOUND", "Cannot comment on an unknown memory.");
    }
    const created = Comment.create({
      id: CommentId(deps.ids.next()),
      targetType: "Memory",
      targetId: MemoryId(input.memoryId),
      memberId: MemberId(input.memberId),
      text: input.text,
      createdAtMs: deps.clock.now(),
    });
    if (!created.ok) return created;
    await deps.comments.save(created.value);
    return map(created, toCommentDTO);
  };
}
