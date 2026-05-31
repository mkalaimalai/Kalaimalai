import { type Clock, type IdGenerator } from "@/shared/ports";
import {
  MemberId,
  PersonId,
  WishId,
  type Result,
  fail,
  map,
} from "@/shared/kernel";
import { Wish } from "../domain/wish";
import type { PeopleReadPort, WishRepository } from "./ports";
import { type WishDTO, toWishDTO } from "./dtos";

export interface PostWishInput {
  fromMemberId: string;
  toPersonId: string;
  message: string;
  occasion?: string;
}

export interface PostWishDeps {
  wishes: WishRepository;
  people: PeopleReadPort;
  clock: Clock;
  ids: IdGenerator;
}

/**
 * PostWish (TECHNICAL_DESIGN §10.5). Records a greeting from a member to a
 * person. Validates that the recipient exists via the injected read port.
 */
export function makePostWish(deps: PostWishDeps) {
  return async function postWish(
    input: PostWishInput,
  ): Promise<Result<WishDTO>> {
    const people = await deps.people.listPeople();
    if (!people.some((p) => p.id === input.toPersonId)) {
      return fail("PERSON_NOT_FOUND", "Cannot wish an unknown person.");
    }
    const created = Wish.create({
      id: WishId(deps.ids.next()),
      toPersonId: PersonId(input.toPersonId),
      fromMemberId: MemberId(input.fromMemberId),
      message: input.message,
      occasion: input.occasion,
      createdAtMs: deps.clock.now(),
    });
    if (!created.ok) return created;
    await deps.wishes.save(created.value);
    return map(created, toWishDTO);
  };
}
