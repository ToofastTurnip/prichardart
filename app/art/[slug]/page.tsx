import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArtworks } from "@/lib/artworks";
import { absolute, artworkPath } from "@/lib/site";
import { ArtworkDetail } from "@/components/site/ArtworkDetail";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return getArtworks().map((a) => ({ slug: a.slug }));
}

export const dynamicParams = false;

function describe(a: ReturnType<typeof getArtworks>[number]) {
  const status =
    a.status === "Sold" ? "This original has sold." : a.status === "NFS" ? "This piece is not for sale." : a.status === "Prints Available" ? "Prints are available." : "The original is available.";
  return `${a.title}, ${a.medium.toLowerCase()} by Ralph Prichard, a Middle River, Maryland artist. ${status} Commissions welcome.`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = getArtworks().find((x) => x.slug === slug);
  if (!a) return {};
  const url = absolute(artworkPath(a.slug));
  return {
    title: `${a.title} by Ralph Prichard | Prichard Art`,
    description: describe(a),
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${a.title} by Ralph Prichard`,
      description: describe(a),
      images: [{ url: absolute(a.imageUrl), width: a.width, height: a.height, alt: a.title }],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default async function ArtworkPage({ params }: Props) {
  const { slug } = await params;
  const all = getArtworks();
  const i = all.findIndex((x) => x.slug === slug);
  if (i < 0) notFound();
  return <ArtworkDetail artwork={all[i]} newer={all[i - 1]} older={all[i + 1]} />;
}

