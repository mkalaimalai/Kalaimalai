import {
  type Clock,
  type IdGenerator,
} from "@/shared/ports";
import { MemberId, MemoryId, ReactionId, type Result, fail, map } from "@/shared/kernel";
import { Reaction } from "../domain/reaction";
import type { MemoriesReadPort, ReactionRepository } from "./ports";
import { type ReactionDTO, toReactionDTO } from "./dtos";

export interface ReactToMemoryInput {
  memberId: string;
  memoryId: string;
  kind: string;
}

export interface ReactToMemoryDeps {
  reactions: ReactionRepository;
  memories: MemoriesReadPort;
  clock: Clock;
  ids: IdGenerator;
}

/**
 * ReactToMemory (TECHNICAL_DESIGN §10.5). Records a member's reaction to an
 * existing memory. Validates that the memory exists via the injected read port.
 */
export function makeReactToMemory(deps: ReactToMemoryDeps) {
  return async function reactToMemory(
    input: ReactToMemoryInput,
  ): Promise<Result<ReactionDTO>> {
    const memories = await deps.memories.listMemories();
    if (!memories.some((m) => m.id === input.memoryId)) {
      return fail("MEMORY_NOT_FOUND", "Cannot react to an unknown memory.");
    }
    const created = Reaction.create({
      id: ReactionId(deps.ids.next()),
      targetType: "Memory",
      targetId: MemoryId(input.memoryId),
      memberId: MemberId(input.memberId),
      kind: input.kind,
      createdAtMs: deps.clock.now(),
    });
    if (!created.ok) return created;
    await deps.reactions.save(created.value);
    return map(created, toReactionDTO);
  };
}
