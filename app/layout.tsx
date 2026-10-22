import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Source_Sans_3 } from "next/font/google";
import { absolute, site, siteUrl } from "@/lib/site";
import { getArtworks } from "@/lib/artworks";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const sourceSans = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-source-sans",
  display: "swap",
});

const cover = getArtworks().find((a) => a.isFeatured) ?? getArtworks()[0];

export const metadata: Metadata = {
  metadataBase: new URL(`${siteUrl}/`),
  title: "Prichard Art | Chesapeake paintings from Middle River, Maryland",
  description:
    "Original pastels and paintings of herons, workboats, lighthouses and old farmhouses by Ralph Prichard, a Middle River, Maryland artist. Commissions welcome.",
  alternates: { canonical: absolute() },
  openGraph: {
    type: "website",
    siteName: site.name,
    url: absolute(),
    title: "Prichard Art",
    description: site.tagline,
    locale: "en_US",
    images: cover ? [{ url: absolute(cover.imageUrl), width: cover.width, height: cover.height, alt: cover.title }] : [],
  },
  twitter: { card: "summary_large_image" },
  verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined },
};

export const viewport: Viewport = {
  themeColor: "#f4f1ea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${cormorant.variable} ${sourceSans.variable}`}>
      <body>{children}</body>
    </html>
  );
}
