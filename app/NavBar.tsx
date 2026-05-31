"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MemberSwitcher } from "@/contexts/identity/ui/MemberSwitcher";

const NAV = [
  { href: "/tree", label: "Family Tree" },
  { href: "/memories", label: "Memories" },
  { href: "/timeline", label: "Timeline" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Activity" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-10 bg-background/95 shadow-[0_2px_14px_rgba(31,111,139,0.08)] backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <Link
          href="/tree"
          className="mr-2 flex items-center gap-2 text-xl font-extrabold text-brand"
        >
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-lg"
            style={{
              background: "linear-gradient(135deg, #5ab0d6, #7cc6a6)",
            }}
            aria-hidden
          >
            🌿
          </span>
          Family Fabric
        </Link>
        <nav className="flex flex-1 flex-wrap items-center gap-1">
          {NAV.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={
                  "rounded-full px-3 py-2 font-medium transition-colors " +
                  (active
                    ? "bg-muted text-brand"
                    : "text-muted-foreground hover:bg-muted")
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <MemberSwitcher />
      </div>
    </header>
  );
}
