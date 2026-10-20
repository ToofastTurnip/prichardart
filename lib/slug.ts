export function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Appends -2, -3… until the slug is not in `taken`. */
export function uniqueSlug(title: string, taken: Set<string>) {
  const base = slugify(title) || "untitled";
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  return slug;
}
