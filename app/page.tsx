import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-20">
      {/* Subtle parchment-flavor background, anchored bottom and very faded
          so the warm Forge surface stays the dominant tone. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-[0.06] mix-blend-screen"
        style={{ backgroundImage: "url('/page-bg.jpg')" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forge-bg"
      />

      <main className="relative z-10 w-full max-w-2xl text-center">
        <Image
          src="/layonara.png"
          alt="Layonara"
          width={260}
          height={94}
          priority
          className="mx-auto h-auto w-[180px] sm:w-[220px]"
        />
        <p className="mt-8 font-mono text-xs uppercase tracking-[0.3em] text-forge-text-secondary">
          The Lore
        </p>
        <h1 className="font-heading mt-4 text-5xl font-medium leading-tight text-forge-text sm:text-6xl">
          Knowledge of the realm.
        </h1>
        <p className="mx-auto mt-6 max-w-md text-balance text-base leading-relaxed text-forge-text-secondary">
          Player tools and references for the world of Layonara. Items,
          recipes, and areas to follow.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/characters"
            className="inline-flex items-center gap-2 rounded-full border border-forge-accent/60 bg-forge-accent/15 px-6 py-3 text-sm font-medium uppercase tracking-[0.18em] text-forge-accent transition hover:bg-forge-accent/25 hover:text-forge-text"
          >
            Browse characters
            <span aria-hidden>→</span>
          </Link>
        </div>

        <nav className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-forge-text-secondary">
          <Link
            href="https://wiki.layonara.com"
            className="transition hover:text-forge-text"
          >
            Wiki
          </Link>
          <span aria-hidden className="text-forge-border">
            ·
          </span>
          <Link
            href="https://forum.layonara.com"
            className="transition hover:text-forge-text"
          >
            Forum
          </Link>
          <span aria-hidden className="text-forge-border">
            ·
          </span>
          <Link
            href="https://www.layonara.com"
            className="transition hover:text-forge-text"
          >
            About
          </Link>
        </nav>
      </main>
    </div>
  );
}
