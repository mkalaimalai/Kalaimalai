import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/bootstrap/Providers";
import { NavBar } from "./NavBar";

export const metadata: Metadata = {
  title: "Family Fabric",
  description: "Your family's tree, memories, and milestones — woven together.",
};

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
            <NavBar />
            <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
