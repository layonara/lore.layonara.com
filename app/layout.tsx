import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://lore.layonara.com"),
  title: {
    default: "Layonara Lore",
    template: "%s · Layonara Lore",
  },
  description:
    "A growing collection of Layonara player tools and references — characters, items, recipes, areas, and more.",
  // Phase 1 stance — also enforced via X-Robots-Tag header in next.config.ts
  // and robots.txt at app/robots.ts.
  robots: { index: false, follow: false },
  icons: { icon: "/favicon.ico" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-forge-bg text-forge-text">
        {children}
      </body>
    </html>
  );
}
