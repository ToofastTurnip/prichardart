import { basePath } from "@/lib/site";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { SkipLink } from "@/components/site/SkipLink";

export default function NotFound() {
  return (
    <>
      <SkipLink />
      <Navbar />
      <main id="main" tabIndex={-1} className="mx-auto max-w-3xl px-4 py-28 outline-none sm:px-6">
        <h1 className="font-serif text-5xl font-semibold">That page isn&rsquo;t on the wall</h1>
        <p className="mt-5 text-lg text-ink-soft">
          The painting may have sold or been renamed.{" "}
          <a href={`${basePath}/#gallery`} className="text-bay underline underline-offset-4">
            Browse the gallery
          </a>{" "}
          or{" "}
          <a href={`${basePath}/#contact`} className="text-bay underline underline-offset-4">
            get in touch
          </a>
          .
        </p>
      </main>
      <Footer />
    </>
  );
}
