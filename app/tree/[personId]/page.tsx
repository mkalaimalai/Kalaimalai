import { PersonProfileClient } from "./PersonProfileClient";

/**
 * Person IDs are generated at runtime and live in the visitor's browser, so
 * there are none to pre-render at build time. The static export (`output:
 * "export"`) requires at least one param, so we emit a single placeholder; the
 * page is fully client-side (it reads the id via `useParams`), and real URLs
 * are served by in-app navigation and the SPA 404 fallback.
 */
export function generateStaticParams() {
  return [{ personId: "_" }];
}

export default function PersonProfilePage() {
  return <PersonProfileClient />;
}
