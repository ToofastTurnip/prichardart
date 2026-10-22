export const site = {
  name: "Prichard Art",
  email: "bogart1109@aol.com",
  address: { street: "1109 Cold Spring Rd", city: "Middle River, MD 21220" },
  mapUrl: "https://maps.google.com/?q=1109+Cold+Spring+Rd,+Middle+River,+MD+21220",
  facebookUrl: "https://www.facebook.com/profile.php?id=61557970603191",
  messengerName: "Prichard ART",
  tagline: "Original pastels and paintings of the Chesapeake Bay and Maryland's back roads",
  description:
    "Ralph Prichard is a Middle River, Maryland artist painting great blue herons, ospreys, blue crabs, Chesapeake workboats, lighthouses, stone farmhouses and rusted trucks in soft pastel and oil. Originals are 16 by 20 inches, prints are $60, and he takes commissions of boats, homes, pets and portraits.",
};

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Public address of the site, including any base path. Set by the deploy workflow. */
export const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || `http://localhost:3000${basePath}`).replace(/\/$/, "");

/** Resolves a repo-relative asset path ("gallery/x.webp") to a URL on this site. */
export function asset(p: string) {
  if (/^(https?:|blob:|data:)/.test(p)) return p;
  return `${basePath}/${p.replace(/^\//, "")}`;
}

/** Absolute URL for crawlers, sitemaps and social cards. */
export function absolute(p = "") {
  return `${siteUrl}/${p.replace(/^\//, "")}`;
}

export const artworkPath = (slug: string) => `art/${slug}/`;

/** Lets phones download the 800px thumbnail instead of the full image. */
export function srcSet(a: { imageUrl: string; thumbnailUrl?: string; width: number; height: number }) {
  if (!a.thumbnailUrl) return undefined;
  const thumbW = Math.min(800, a.width);
  return `${asset(a.thumbnailUrl)} ${thumbW}w, ${asset(a.imageUrl)} ${a.width}w`;
}
