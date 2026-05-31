import type { OccasionKind, SuggestedGreetingDTO } from "./dtos";

export interface GetSuggestedGreetingInput {
  readonly occasionKind: OccasionKind;
  /** Optional recipient/occasion name to personalize the message. */
  readonly name?: string;
}

/**
 * GetSuggestedGreeting — returns a friendly, ready-to-send message for an
 * occasion (TECHNICAL_DESIGN §10.4). Pure: deterministic from its input, no I/O.
 */
export function getSuggestedGreeting(
  input: GetSuggestedGreetingInput,
): SuggestedGreetingDTO {
  const name = input.name?.trim();
  const who = name && name.length > 0 ? name : null;

  let message: string;
  switch (input.occasionKind) {
    case "birthday":
      message = who
        ? `Happy birthday, ${who}! Wishing you a wonderful year ahead. 🎂`
        : "Happy birthday! Wishing you a wonderful year ahead. 🎂";
      break;
    case "anniversary":
      message = who
        ? `Happy anniversary, ${who}! Wishing you many more years of love and happiness. 💕`
        : "Happy anniversary! Wishing you many more years of love and happiness. 💕";
      break;
    case "festival":
      message = who
        ? `Wishing you and your family a joyful ${who}! 🎉`
        : "Wishing you and your family a joyful celebration! 🎉";
      break;
  }

  return { occasionKind: input.occasionKind, message };
}
