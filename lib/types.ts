export const CATEGORIES = [
  "Maritime & Watercraft",
  "Wildlife & Nature",
  "Historic & Rustic",
  "Portraits & Commissions",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const STATUSES = ["Available", "Prints Available", "Sold", "NFS"] as const;

export type Status = (typeof STATUSES)[number];

// Wording used in the admin dropdown.
export const STATUS_LABELS: Record<Status, string> = {
  Available: "Original Available",
  "Prints Available": "Prints Only",
  Sold: "Sold",
  NFS: "NFS",
};

// Wording shown to visitors.
export const STATUS_PUBLIC: Record<Status, string> = {
  Available: "Original available",
  "Prints Available": "Prints available",
  Sold: "Sold",
  NFS: "Not for sale",
};

export interface Artwork {
  id: string;
  title: string;
  slug: string;
  /** Path relative to the site root, e.g. "gallery/<id>.webp". */
  imageUrl: string;
  thumbnailUrl?: string;
  width: number;
  height: number;
  category: Category;
  medium: string;
  dimensions: string;
  status: Status;
  price?: string;
  isFeatured: boolean;
  createdAt: string;
}
