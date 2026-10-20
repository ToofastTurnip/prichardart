import data from "@/content/artworks.json";
import type { Artwork } from "./types";

export function getArtworks(): Artwork[] {
  return [...(data as Artwork[])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

