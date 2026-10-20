import { getArtworks } from "@/lib/artworks";
import { SiteProvider } from "@/components/site/SiteProvider";
import { Navbar } from "@/components/site/Navbar";
import { Hero } from "@/components/site/Hero";
import { Gallery } from "@/components/site/Gallery";
import { ArtworkModal } from "@/components/site/ArtworkModal";
import { Bio } from "@/components/site/Bio";
import { Contact } from "@/components/site/Contact";
import { Footer } from "@/components/site/Footer";
import { SkipLink } from "@/components/site/SkipLink";
import { absolute, site } from "@/lib/site";
import { artistLd, artworkLd, JsonLd } from "@/lib/structured-data";

export default function Home() {
  const artworks = getArtworks();
  const featured = artworks.filter((a) => a.isFeatured).slice(0, 6);

  return (
    <SiteProvider artworks={artworks}>
      <JsonLd
        data={{
          "@graph": [
            {
              "@type": "WebSite",
              "@id": absolute("#website"),
              url: absolute(),
              name: site.name,
              description: site.description,
              publisher: { "@id": absolute("#artist") },
            },
            { ...artistLd, description: site.description },
            {
              "@type": "CollectionPage",
              url: absolute(),
              name: "Prichard Art gallery",
              mainEntity: {
                "@type": "ItemList",
                numberOfItems: artworks.length,
                itemListElement: artworks.map((a, i) => ({ "@type": "ListItem", position: i + 1, item: artworkLd(a) })),
              },
            },
          ],
        }}
      />
      <SkipLink />
      <Navbar />
      <main id="main" tabIndex={-1} className="outline-none">
        <Hero featured={featured.length ? featured : artworks.slice(0, 1)} />
        <Gallery />
        <Bio />
        <Contact />
      </main>
      <Footer />
      <ArtworkModal />
    </SiteProvider>
  );
}
