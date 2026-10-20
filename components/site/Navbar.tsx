"use client";

import { useEffect, useState } from "react";
import { basePath } from "@/lib/site";

// Full paths so the links also work from an artwork's own page.
const links = [
  { href: `${basePath}/#gallery`, label: "Gallery" },
  { href: `${basePath}/#about`, label: "About" },
  { href: `${basePath}/#contact`, label: "Contact" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-30 border-b bg-linen/95 backdrop-blur-sm transition-colors duration-200 ${
        scrolled ? "border-sand" : "border-transparent"
      }`}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex min-h-16 max-w-7xl flex-wrap items-center justify-between gap-x-4 px-4 sm:px-6 lg:px-10"
      >
        <a href={`${basePath}/`} className="py-2 font-serif text-[1.375rem] font-semibold tracking-tight text-ink sm:text-2xl">
          Prichard <span className="font-medium italic text-rust-text">Art</span>
        </a>
        <ul className="-mx-2 flex items-center sm:mx-0 sm:gap-2">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="inline-flex min-h-11 items-center px-2 text-[0.95rem] text-ink-soft transition-colors hover:text-ink sm:px-3"
              >
                {l.label}
              </a>
            </li>
          ))}
          <li className="hidden sm:block">
            <a
              href={`${basePath}/admin/`}
              className="ml-2 inline-flex min-h-11 items-center border-l border-sand pl-5 text-[0.95rem] text-ink-soft transition-colors hover:text-ink"
            >
              Studio
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
