/**
 * WhatsApp deep-link helper (PRD F6.2 — manual share).
 *
 * Builds a `https://wa.me/?text=...` link (or a number-targeted variant) the UI
 * can offer for one-tap manual sharing. No contacts are read; the user picks the
 * recipient in WhatsApp itself.
 */

export interface WhatsAppDeepLinkInput {
  /** Message text to pre-fill. */
  text: string;
  /** Optional recipient phone number; non-digits are stripped per wa.me rules. */
  phone?: string;
}

/** Build a `wa.me` deep-link with URL-encoded prefilled text. */
export function buildWhatsAppDeepLink(input: WhatsAppDeepLinkInput): string {
  const query = `text=${encodeURIComponent(input.text)}`;
  const digits = input.phone?.replace(/\D/g, "") ?? "";
  return digits.length > 0
    ? `https://wa.me/${digits}?${query}`
    : `https://wa.me/?${query}`;
}
