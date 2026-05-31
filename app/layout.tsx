import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Providers } from "@/bootstrap/Providers";
import { MemberSwitcher } from "@/contexts/identity/ui/MemberSwitcher";

export const metadata: Metadata = {
  title: "Family Fabric",
  description: "Your family's tree, memories, and milestones — woven together.",
};

const NAV = [
  { href: "/tree", label: "Family Tree" },
  { href: "/memories", label: "Memories" },
  { href: "/timeline", label: "Timeline" },
  { href: "/calendar", label: "Calendar" },
  { href: "/feed", label: "Activity" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div className="flex min-h-screen flex-col">
            <header className="border-b border-border bg-background">
              <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-3">
                <Link href="/tree" className="text-xl font-bold text-primary">
                  Family Fabric
                </Link>
                <nav className="flex flex-1 flex-wrap items-center gap-1">
                  {NAV.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="rounded-lg px-3 py-2 font-medium hover:bg-muted"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <MemberSwitcher />
              </div>
            </header>
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
