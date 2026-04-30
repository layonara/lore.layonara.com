export default function Home() {
  return (
    <main className="flex flex-1 items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl text-center">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-zinc-500">
          layonara
        </p>
        <h1 className="mt-3 text-5xl font-semibold tracking-tight sm:text-6xl">
          Lore
        </h1>
        <p className="mx-auto mt-6 max-w-md text-balance text-base leading-relaxed text-zinc-400">
          A growing collection of player tools and references for the world of
          Layonara. Characters, items, recipes, areas — coming soon.
        </p>
        <div className="mt-12 flex items-center justify-center gap-6 text-sm text-zinc-500">
          <a
            href="https://wiki.layonara.com"
            className="transition hover:text-zinc-200"
          >
            Wiki
          </a>
          <span className="text-zinc-700">·</span>
          <a
            href="https://forum.layonara.com"
            className="transition hover:text-zinc-200"
          >
            Forum
          </a>
          <span className="text-zinc-700">·</span>
          <a
            href="https://www.layonara.com"
            className="transition hover:text-zinc-200"
          >
            About
          </a>
        </div>
      </div>
    </main>
  );
}
