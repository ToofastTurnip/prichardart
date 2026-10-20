"use client";

import { useState } from "react";
import { ArrowDown } from "lucide-react";
import { asset, srcSet } from "@/lib/site";
import type { Artwork } from "@/lib/types";
import { useSite } from "./SiteProvider";

export function Hero({ featured }: { featured: Artwork[] }) {
  const { openArtwork } = useSite();
  const [index, setIndex] = useState(0);
  const piece = featured[index];

  return (
    <section id="top" className="mx-auto max-w-7xl px-4 pt-10 pb-20 sm:px-6 lg:grid lg:grid-cols-12 lg:gap-12 lg:px-10 lg:pt-12 lg:pb-28">
      <div className="flex flex-col lg:col-span-5 lg:pt-10">
        <p className="text-ink-soft">Middle River, Maryland</p>
        <h1 className="mt-3 font-serif text-[clamp(4.25rem,11vw,8.5rem)] leading-[0.88] font-semibold tracking-[-0.02em]">
          Prichard
        </h1>
        <p className="mt-6 max-w-md font-serif text-[1.65rem] leading-snug italic text-ink">
          Herons in the shallows, workboats at the pilings, and old trucks left out in the weather.
        </p>
        <p className="mt-6 max-w-md text-ink-soft">
          Original pastels and paintings of the Chesapeake and the back roads around it, made by
          hand in a home studio on Cold Spring Road.{" "}
          <a href="#contact" className="text-bay underline decoration-bay/40 underline-offset-4 transition-colors hover:decoration-bay">
            Commissions of boats, homes and people
          </a>{" "}
          are welcome.
        </p>

        <a
          href="#gallery"
          className="group mt-10 inline-flex min-h-11 items-center gap-3 self-start border-b border-ink pb-1 text-lg font-medium text-ink"
        >
          See the paintings
          <ArrowDown className="size-4 transition-transform duration-200 group-hover:translate-y-0.5" aria-hidden />
        </a>

        {featured.length > 1 && (
          <div className="mt-auto hidden pt-14 lg:block">
            <p className="text-sm text-ink-soft">On the wall this season</p>
            <ul className="mt-3 flex gap-3">
              {featured.map((f, i) => (
                <li key={f.id}>
                  <button
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show ${f.title}`}
                    aria-pressed={i === index}
                    className={`block size-16 cursor-pointer overflow-hidden border bg-paper p-1 transition-all duration-200 ${
                      i === index ? "border-ink shadow-md" : "border-sand opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={asset(f.thumbnailUrl ?? f.imageUrl)} alt="" className="size-full object-cover" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {piece && (
        <figure className="mt-12 lg:col-span-7 lg:mt-0">
          <button
            type="button"
            onClick={() => openArtwork(piece.id, featured)}
            className="group block w-full cursor-zoom-in"
            aria-label={`View ${piece.title} larger`}
          >
            <div className="mx-auto w-fit border border-sand bg-paper p-3 shadow-[0_1px_2px_rgb(30_36_43/0.06),0_18px_40px_-18px_rgb(30_36_43/0.35)] sm:p-5">
              <img
                key={piece.id}
                src={asset(piece.imageUrl)}
                srcSet={srcSet(piece)}
                sizes="(min-width: 1024px) 55vw, 92vw"
                width={piece.width}
                height={piece.height}
                alt={`${piece.title}, ${piece.medium.toLowerCase()}`}
                fetchPriority="high"
                className="block h-auto max-h-[70vh] lg:max-h-[calc(100dvh-15rem)] w-auto max-w-full animate-fade-in"
              />
            </div>
          </button>
          <figcaption className="mx-auto mt-5 flex max-w-xl items-baseline justify-between gap-6 border-t border-sand pt-3 text-sm text-ink-soft">
            <span>
              <span className="font-serif text-lg italic text-ink">{piece.title}</span>
              <span className="mx-2" aria-hidden>·</span>
              {piece.medium}
            </span>
            <span className="shrink-0">{piece.category}</span>
          </figcaption>
        </figure>
      )}
    </section>
  );
}
