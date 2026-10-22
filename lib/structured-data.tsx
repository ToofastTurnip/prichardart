import { absolute, artworkPath, site } from "./site";
import type { Artwork } from "./types";

export const artistLd = {
  "@type": "Person",
  "@id": absolute("#artist"),
  name: "Ralph Prichard",
  jobTitle: "Artist",
  description:
    "Maryland artist living on the Chesapeake Bay. Class artist of 1971, taught by Maryland painter David Turnbaugh, mostly self-taught, and painting again since retiring in 2019.",
  url: absolute(),
  email: `mailto:${site.email}`,
  address: {
    "@type": "PostalAddress",
    streetAddress: site.address.street,
    addressLocality: "Middle River",
    addressRegion: "MD",
    postalCode: "21220",
    addressCountry: "US",
  },
  knowsAbout: ["Pastel painting", "Watercolor", "Acrylic painting", "Chesapeake Bay wildlife", "Maritime art", "Commissioned portraits"],
};

export function artworkLd(a: Artwork) {
  const [medium, surface] = a.medium.split(/ on /i);
  return {
    "@type": "VisualArtwork",
    "@id": absolute(`${artworkPath(a.slug)}#artwork`),
    name: a.title,
    url: absolute(artworkPath(a.slug)),
    image: absolute(a.imageUrl),
    artform: "Painting",
    artMedium: medium || a.medium,
    ...(surface ? { artworkSurface: surface } : {}),
    genre: a.category,
    ...(a.dimensions ? { size: a.dimensions } : {}),
    creator: { "@id": absolute("#artist") },
    dateCreated: a.createdAt.slice(0, 10),
  };
}

export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify({ "@context": "https://schema.org", ...data }).replace(/</g, "\\u003c") }}
    />
  );
}
