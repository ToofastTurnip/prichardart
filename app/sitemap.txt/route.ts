import { getArtworks } from "@/lib/artworks";
import { absolute, artworkPath } from "@/lib/site";

export const dynamic = "force-static";

// Plain-text sitemap (one URL per line), accepted by Google Search Console and Bing.
export function GET() {
  const urls = [absolute(), ...getArtworks().map((a) => absolute(artworkPath(a.slug)))];
  return new Response(urls.join("\n") + "\n", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}
