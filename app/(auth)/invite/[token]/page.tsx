import { InvitePageClient } from "./InvitePageClient";

/**
 * Invite tokens are only known at link-share time, never at build time. The
 * static export (`output: "export"`) requires at least one param, so we emit a
 * single placeholder; the page reads the real token client-side via `useParams`
 * and the SPA 404 fallback boots it on a direct visit.
 */
export function generateStaticParams() {
  return [{ token: "_" }];
}

export default function InvitePage() {
  return <InvitePageClient />;
}
