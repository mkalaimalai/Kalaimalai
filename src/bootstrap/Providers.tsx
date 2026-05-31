"use client";

import * as React from "react";
import { Provider } from "react-redux";
import { makeStore, type AppStore } from "@/store";
import { bootstrapContainer } from "./compose";
import { seedIfEmpty } from "./seed";

/**
 * App-wide providers. Creates the Redux store once, installs the composition
 * root, seeds the starter family on first run, and gates rendering until the
 * container is ready so RTK Query `queryFn`s never resolve before `setContainer`.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  const storeRef = React.useRef<AppStore | null>(null);
  if (storeRef.current === null) {
    storeRef.current = makeStore();
  }

  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    let active = true;
    void (async () => {
      const { container, deps } = bootstrapContainer();
      await seedIfEmpty(container, deps);
      // Ensure a current Admin exists even for stores seeded by older runs.
      await container.identity.ensureSeedAdmin({ displayName: "Family Admin" });
      if (active) setReady(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  return (
    <Provider store={storeRef.current}>
      {ready ? children : <BootSplash />}
    </Provider>
  );
}

function BootSplash() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-lg text-muted-foreground">Gathering the family…</p>
    </div>
  );
}
