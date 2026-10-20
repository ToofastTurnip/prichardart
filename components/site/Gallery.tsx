"use client";

import { useEffect, useMemo, useState } from "react";
import { asset } from "@/lib/site";
import { CATEGORIES, type Artwork } from "@/lib/types";
import { StatusBadge } from "./StatusBadge";
import { useSite } from "./SiteProvider";

const FILTERS = ["All", ...CATEGORIES] as const;
type Filter = (typeof FILTERS)[number];

function useColumnCount() {
  const [count, setCount] = useState<number | null>(null);
  useEffect(() => {
    const lg = window.matchMedia("(min-width: 1024px)");
    const sm = window.matchMedia("(min-width: 640px)");
    const update = () => setCount(lg.matches ? 3 : sm.matches ? 2 : 1);
    update();
    lg.addEventListener("change", update);
    sm.addEventListener("change", update);
    return () => {
      lg.removeEventListener("change", update);
      sm.removeEventListener("change", update);
    };
  }, []);
  return count;
}

/** Places each piece in the currently shortest column so rows read left to right, newest first. */
function balance(items: Artwork[], count: number) {
  const cols: Artwork[][] = Array.from({ length: count }, () => []);
  const heights = new Array(count).fill(0);
  for (const item of items) {
    const i = heights.indexOf(Math.min(...heights));
    cols[i].push(item);
    heights[i] += item.height / item.width + 0.32; // the caption adds roughly a third of a card
  }
  return cols;
}

export function Gallery() {
  const { artworks, openArtwork } = useSite();
  const [filter, setFilter] = useState<Filter>("All");
  const columns = useColumnCount();

  const visible = useMemo(
    () => (filter === "All" ? artworks : artworks.filter((a) => a.category === filter)),
    [artworks, filter],
  );

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: artworks.length };
    for (const a of artworks) c[a.category] = (c[a.category] ?? 0) + 1;
    return c;
  }, [artworks]);

  const card = (a: Artwork) => (
    <li key={a.id} className="mb-8 break-inside-avoid">
      <ArtworkCard artwork={a} onOpen={() => openArtwork(a.id, visible)} />
    </li>
  );

  return (
    <section id="gallery" aria-labelledby="gallery-title" className="border-t border-sand bg-mist/50 py-20 lg:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <h2 id="gallery-title" className="font-serif text-5xl font-semibold tracking-tight sm:text-6xl">
            Gallery
          </h2>
          <p className="max-w-sm text-ink-soft">
            Click any piece to see it larger. Originals and prints can be reserved by email.
          </p>
        </div>

        <div className="mt-10">
          <div role="group" aria-label="Filter by subject" className="flex flex-wrap gap-x-6 gap-y-1 sm:gap-x-7 sm:border-b sm:border-sand">
            {FILTERS.map((f) => {
              const active = f === filter;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilter(f)}
                  className={`-mb-px flex min-h-11 cursor-pointer items-center gap-2 border-b-2 pt-2 pb-2.5 text-[0.95rem] transition-colors duration-200 ${
                    active ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"
                  }`}
                >
                  {f}
                  <span aria-hidden className="text-xs tabular-nums text-ink-soft">{counts[f] ?? 0}</span>
                  <span className="sr-only">, {counts[f] ?? 0} pieces</span>
                </button>
              );
            })}
          </div>
        </div>

        <p className="sr-only" aria-live="polite">
          Showing {visible.length} {visible.length === 1 ? "piece" : "pieces"}
        </p>

        {visible.length === 0 ? (
          <p className="mt-16 text-ink-soft">
            Nothing in this group yet.{" "}
            <a href="#contact" className="text-bay underline underline-offset-4">
              Ask about a commission
            </a>
            .
          </p>
        ) : columns === null ? (
          <ul className="mt-12 columns-1 gap-8 sm:columns-2 lg:columns-3">{visible.map(card)}</ul>
        ) : (
          <div className="mt-12 grid gap-8" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {balance(visible, columns).map((col, i) => (
              <ul key={i}>{col.map(card)}</ul>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function ArtworkCard({ artwork: a, onOpen }: { artwork: Artwork; onOpen: () => void }) {
  return (
    <article className="group border border-stone-200 bg-paper shadow-sm transition-shadow duration-300 hover:shadow-md">
      <button
        type="button"
        onClick={onOpen}
        className="block w-full cursor-zoom-in p-3 text-left"
        aria-label={`View ${a.title}`}
      >
        <div className="overflow-hidden bg-mist">
          <img
            src={asset(a.thumbnailUrl ?? a.imageUrl)}
            width={a.width}
            height={a.height}
            alt={`${a.title}, ${a.medium.toLowerCase()}`}
            loading="lazy"
            decoding="async"
            className="block h-auto w-full transition-transform duration-500 ease-out-soft group-hover:scale-[1.015]"
          />
        </div>
      </button>
      <div className="px-4 pt-1 pb-4">
        <h3 className="font-serif text-[1.45rem] leading-tight font-semibold">{a.title}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {a.medium}
          {a.dimensions && <span>, {a.dimensions}</span>}
        </p>
        <StatusBadge status={a.status} className="mt-3" />
      </div>
    </article>
  );
}
