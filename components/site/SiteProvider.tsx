"use client";

import { createContext, useCallback, useContext, useState } from "react";
import type { Artwork } from "@/lib/types";

interface SiteState {
  artworks: Artwork[];
  /** Opens the lightbox on `id`; prev/next move through `sequence`. */
  openArtwork: (id: string, sequence: Artwork[]) => void;
  closeArtwork: () => void;
  active: Artwork | null;
  sequence: Artwork[];
  /** Title of the piece the visitor asked about, picked up by the contact form. */
  inquiry: { title: string; nonce: number } | null;
  inquireAbout: (title: string) => void;
}

const SiteContext = createContext<SiteState | null>(null);

export function SiteProvider({ artworks, children }: { artworks: Artwork[]; children: React.ReactNode }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sequence, setSequence] = useState<Artwork[]>(artworks);
  const [inquiry, setInquiry] = useState<SiteState["inquiry"]>(null);

  const openArtwork = useCallback((id: string, seq: Artwork[]) => {
    setSequence(seq);
    setActiveId(id);
  }, []);

  const closeArtwork = useCallback(() => setActiveId(null), []);

  const inquireAbout = useCallback((title: string) => {
    setActiveId(null);
    setInquiry({ title, nonce: Date.now() });
  }, []);

  const active = artworks.find((a) => a.id === activeId) ?? null;

  return (
    <SiteContext.Provider
      value={{ artworks, openArtwork, closeArtwork, active, sequence, inquiry, inquireAbout }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside SiteProvider");
  return ctx;
}
