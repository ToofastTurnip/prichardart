import Link from "next/link";
import { site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="bg-ink text-linen/80">
      <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-12 text-sm sm:px-6 md:flex-row md:items-end md:justify-between lg:px-10">
        <div>
          <p className="font-serif text-2xl font-semibold text-linen">Prichard Art</p>
          <p className="mt-2">
            {site.address.street}, {site.address.city}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
          <a href={`mailto:${site.email}`} className="inline-flex min-h-11 items-center hover:text-linen">
            {site.email}
          </a>
          <Link href="/admin/" className="inline-flex min-h-11 items-center hover:text-linen">
            Studio login
          </Link>
          <span>© {new Date().getFullYear()} Prichard Art</span>
        </div>
      </div>
    </footer>
  );
}
