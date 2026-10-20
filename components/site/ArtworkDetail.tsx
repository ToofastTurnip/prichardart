import { ArrowLeft, ArrowRight } from "lucide-react";
import { artworkPath, asset, basePath, srcSet } from "@/lib/site";
import { artistLd, artworkLd, JsonLd } from "@/lib/structured-data";
import type { Artwork } from "@/lib/types";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { SkipLink } from "./SkipLink";
import { StatusBadge } from "./StatusBadge";

// Lives outside app/art/[slug] so Tailwind's source scan always picks up its classes.
export function ArtworkDetail({ artwork: a, newer, older }: { artwork: Artwork; newer?: Artwork; older?: Artwork }) {
  return (
    <>
      <JsonLd data={{ "@graph": [artworkLd(a), artistLd] }} />
      <SkipLink />
      <Navbar />
      <main id="main" tabIndex={-1} className="mx-auto max-w-7xl px-4 pt-6 pb-20 outline-none sm:px-6 lg:px-10 lg:pt-10">
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-x-3 text-sm text-ink-soft">
            <li>
              <a href={`${basePath}/#gallery`} className="inline-flex min-h-11 items-center underline decoration-sand underline-offset-4 hover:text-ink">
                Gallery
              </a>
            </li>
            <li aria-hidden className="text-sand">/</li>
            <li>{a.category}</li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-10 lg:grid-cols-12 lg:gap-14">
          <figure className="lg:col-span-8">
            <div className="mx-auto w-fit border border-sand bg-paper p-3 shadow-[0_1px_2px_rgb(30_36_43/0.06),0_18px_40px_-18px_rgb(30_36_43/0.35)] sm:p-5">
              <img
                src={asset(a.imageUrl)}
                srcSet={srcSet(a)}
                sizes="(min-width: 1024px) 60vw, 92vw"
                width={a.width}
                height={a.height}
                alt={`${a.title}, ${a.medium.toLowerCase()}`}
                fetchPriority="high"
                className="block h-auto max-h-[80vh] w-auto max-w-full"
              />
            </div>
          </figure>

          <div className="lg:col-span-4 lg:pt-4">
            <p className="text-ink-soft">{a.category}</p>
            <h1 className="mt-2 font-serif text-5xl leading-[1.02] font-semibold tracking-tight">{a.title}</h1>
            <p className="mt-4 text-lg text-ink-soft">By Prichard, Middle River, Maryland</p>

            <dl className="mt-8 divide-y divide-sand border-y border-sand">
              <Row label="Medium">{a.medium}</Row>
              {a.dimensions && <Row label="Size">{a.dimensions}</Row>}
              <Row label="Status">
                <StatusBadge status={a.status} className="text-ink" />
              </Row>
              {(a.status === "Available" || a.status === "Prints Available") && <Row label="Price">{a.price || "On request"}</Row>}
            </dl>

            <a
              href={`${basePath}/?inquire=${encodeURIComponent(a.slug)}#contact`}
              className="mt-8 flex min-h-12 items-center justify-center bg-bay px-5 font-medium text-white transition-colors duration-200 hover:bg-bay-deep"
            >
              Inquire about this piece
            </a>
          </div>
        </div>

        <nav aria-label="More paintings" className="mt-16 grid gap-4 border-t border-sand pt-6 sm:grid-cols-2">
          {newer ? (
            <a href={asset(artworkPath(newer.slug))} className="group flex min-h-11 items-center gap-3 text-ink-soft hover:text-ink">
              <ArrowLeft className="size-4 shrink-0" aria-hidden />
              <span>
                <span className="block text-sm">Newer</span>
                <span className="font-serif text-xl text-ink italic">{newer.title}</span>
              </span>
            </a>
          ) : (
            <span />
          )}
          {older && (
            <a href={asset(artworkPath(older.slug))} className="group flex min-h-11 items-center justify-end gap-3 text-right text-ink-soft hover:text-ink">
              <span>
                <span className="block text-sm">Older</span>
                <span className="font-serif text-xl text-ink italic">{older.title}</span>
              </span>
              <ArrowRight className="size-4 shrink-0" aria-hidden />
            </a>
          )}
        </nav>
      </main>
      <Footer />
    </>
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
