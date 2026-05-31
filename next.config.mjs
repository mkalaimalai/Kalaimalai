/**
 * The app is a fully client-side SPA (data lives in the visitor's localStorage;
 * there are no API routes or server components), so it ships as a static export
 * to GitHub Pages.
 *
 * On GitHub Pages the site is served from a sub-path (`/<repo>/`), so the CI
 * build sets `NEXT_PUBLIC_BASE_PATH=/Kalaimalai`. Local `dev`/`build` leave it
 * empty and run at the root, unchanged.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  // Per-route `index.html` files so GitHub Pages serves nested paths cleanly.
  trailingSlash: true,
  // next/image optimization needs a server; export ships images as-is.
  images: { unoptimized: true },
};

export default nextConfig;
