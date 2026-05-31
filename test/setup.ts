import "@testing-library/jest-dom/vitest";

// jsdom does not implement these; stub for components that touch them.
if (typeof window !== "undefined") {
  // matchMedia stub for any responsive hooks.
  if (!window.matchMedia) {
    window.matchMedia = (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: () => {},
        removeEventListener: () => {},
        addListener: () => {},
        removeListener: () => {},
        dispatchEvent: () => false,
      }) as unknown as MediaQueryList;
  }
}
