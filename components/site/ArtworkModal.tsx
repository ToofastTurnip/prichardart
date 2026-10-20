"use client";

import { useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { artworkPath, asset } from "@/lib/site";
import { useSite } from "./SiteProvider";
import { StatusBadge } from "./StatusBadge";

export function ArtworkModal() {
  const { active, sequence, openArtwork, closeArtwork, inquireAbout, artworks } = useSite();
  const dialog = useRef<HTMLDialogElement>(null);

  // Open a piece from a shared link (?piece=slug).
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("piece");
    const match = slug && artworks.find((a) => a.slug === slug);
    if (match) openArtwork(match.id, artworks);
  }, [artworks, openArtwork]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const url = new URL(window.location.href);
    if (active) {
      if (!el.open) el.showModal();
      url.searchParams.set("piece", active.slug);
    } else {
      if (el.open) el.close();
      url.searchParams.delete("piece");
    }
    window.history.replaceState(null, "", url);
  }, [active]);

  const index = active ? sequence.findIndex((a) => a.id === active.id) : -1;
  const step = (dir: 1 | -1) => {
    if (index < 0 || sequence.length < 2) return;
    const next = sequence[(index + dir + sequence.length) % sequence.length];
    openArtwork(next.id, sequence);
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  // Warm the cache for neighbours so arrowing through feels instant.
  useEffect(() => {
    if (index < 0) return;
    for (const d of [1, -1]) {
      const n = sequence[(index + d + sequence.length) % sequence.length];
      if (n) new Image().src = asset(n.imageUrl);
    }
  }, [index, sequence]);

  // Horizontal swipe on phones; the arrow buttons remain for everyone else.
  const touch = useRef<{ x: number; y: number } | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const t = touch.current;
    touch.current = null;
    if (!t) return;
    const dx = e.changedTouches[0].clientX - t.x;
    const dy = e.changedTouches[0].clientY - t.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) step(dx < 0 ? 1 : -1);
  };

  const a = active;
  const arrow =
    "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80";

  return (
    <dialog
      ref={dialog}
      onClose={closeArtwork}
      onClick={(e) => e.target === e.currentTarget && closeArtwork()}
      aria-labelledby="artwork-title"
      className="m-0 h-dvh max-h-none w-screen max-w-none overscroll-contain bg-linen p-0 backdrop:backdrop-blur-[2px] lg:m-auto lg:h-[min(92vh,980px)] lg:w-[min(94vw,1400px)] lg:bg-transparent"
    >
      {a && (
        <div className="relative flex h-full flex-col overflow-y-auto bg-linen lg:flex-row lg:overflow-hidden lg:shadow-2xl">
          <button
            type="button"
            onClick={closeArtwork}
            aria-label="Close"
            autoFocus
            className="fixed top-3 right-3 z-10 grid size-11 cursor-pointer place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80 lg:absolute lg:rounded-none lg:bg-transparent lg:text-ink-soft lg:hover:bg-transparent lg:hover:text-ink"
          >
            <X className="size-5" aria-hidden />
          </button>

          <div
            className="relative flex shrink-0 items-center justify-center bg-[#15191e] px-4 pt-16 pb-6 sm:px-8 lg:min-h-0 lg:flex-1 lg:shrink lg:py-8"
            onClick={(e) => e.target === e.currentTarget && closeArtwork()}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <img
              key={a.id}
              src={asset(a.imageUrl)}
              width={a.width}
              height={a.height}
              alt={`${a.title}, ${a.medium.toLowerCase()}`}
              className="h-auto max-h-[68dvh] w-auto max-w-full animate-fade-in object-contain lg:max-h-full"
            />
            {sequence.length > 1 && (
              <>
                <button type="button" onClick={() => step(-1)} aria-label="Previous piece" className={`${arrow} left-2 sm:left-4`}>
                  <ChevronLeft className="size-5" aria-hidden />
                </button>
                <button type="button" onClick={() => step(1)} aria-label="Next piece" className={`${arrow} right-2 sm:right-4`}>
                  <ChevronRight className="size-5" aria-hidden />
                </button>
              </>
            )}
          </div>

          <aside className="flex shrink-0 flex-col px-5 pt-6 pb-10 sm:px-8 lg:w-[380px] lg:overflow-y-auto lg:border-l lg:border-sand lg:px-9 lg:pt-14 lg:pb-8">
            <p className="text-sm text-ink-soft">{a.category}</p>
            <h2 id="artwork-title" className="mt-2 font-serif text-4xl leading-[1.05] font-semibold lg:pr-8">
              {a.title}
            </h2>

            <dl className="mt-8 divide-y divide-sand border-y border-sand text-[0.95rem]">
              <Row label="Medium">{a.medium}</Row>
              {a.dimensions && <Row label="Size">{a.dimensions}</Row>}
              <Row label="Status">
                <StatusBadge status={a.status} className="text-ink" />
              </Row>
              {(a.status === "Available" || a.status === "Prints Available") && (
                <Row label="Price">{a.price || "On request"}</Row>
              )}
            </dl>

            <button
              type="button"
              onClick={() => {
                inquireAbout(a.title);
                requestAnimationFrame(() =>
                  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }),
                );
              }}
              className="mt-8 min-h-12 w-full cursor-pointer bg-bay px-5 font-medium text-white transition-colors duration-200 hover:bg-bay-deep"
            >
              Inquire about this piece
            </button>
            <a
              href={asset(artworkPath(a.slug))}
              className="mt-3 inline-flex min-h-11 items-center justify-center text-sm text-ink-soft underline decoration-sand underline-offset-4 hover:text-ink"
            >
              Open this painting&rsquo;s own page
            </a>

            {sequence.length > 1 && (
              <p className="mt-auto pt-8 text-sm tabular-nums text-ink-soft">
                {index + 1} of {sequence.length}
                <span className="hidden lg:inline"> · use the arrow keys to browse</span>
                <span className="lg:hidden"> · swipe the picture to browse</span>
              </p>
            )}
          </aside>
        </div>
      )}
    </dialog>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 py-3">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right text-ink">{children}</dd>
    </div>
  );
}
