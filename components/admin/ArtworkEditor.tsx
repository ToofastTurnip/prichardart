"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { CATEGORIES, STATUSES, STATUS_LABELS, type Artwork, type Category, type Status } from "@/lib/types";

export interface Draft {
  title: string;
  category: Category;
  medium: string;
  dimensions: string;
  status: Status;
  price: string;
  isFeatured: boolean;
}

const blank: Draft = {
  title: "",
  category: "Maritime & Watercraft",
  medium: "",
  dimensions: "",
  status: "Available",
  price: "",
  isFeatured: false,
};

export function ArtworkEditor({
  artwork,
  imageSrc,
  imageFallback,
  mediums,
  onCancel,
  onSave,
}: {
  artwork?: Artwork;
  imageSrc?: string;
  imageFallback?: string;
  mediums: string[];
  onCancel: () => void;
  onSave: (draft: Draft, file: File | null) => Promise<void>;
}) {
  const initial: Draft = artwork
    ? {
        title: artwork.title,
        category: artwork.category,
        medium: artwork.medium,
        dimensions: artwork.dimensions,
        status: artwork.status,
        price: artwork.price ?? "",
        isFeatured: artwork.isFeatured,
      }
    : blank;

  const [draft, setDraft] = useState<Draft>(initial);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; image?: string }>({});
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const titleInput = useRef<HTMLInputElement>(null);
  const ids = useId();
  const heading = useRef<HTMLHeadingElement>(null);

  // Move focus to the new view's heading so screen readers announce it.
  useEffect(() => heading.current?.focus(), []);

  const dirty = file !== null || JSON.stringify(draft) !== JSON.stringify(initial);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function pick(f: File | undefined) {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      setErrors((e) => ({ ...e, image: "That file isn't an image. Use a JPEG, PNG or WebP photo." }));
      return;
    }
    setErrors((e) => ({ ...e, image: undefined }));
    setFile(f);
  }

  const update = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const next: typeof errors = {};
    if (!draft.title.trim()) next.title = "Give the piece a title.";
    if (!artwork && !file) next.image = "Add a photo of the piece.";
    setErrors(next);
    if (next.title) return titleInput.current?.focus();
    if (next.image) return;

    setSaving(true);
    setFailure("");
    try {
      await onSave({ ...draft, title: draft.title.trim(), medium: draft.medium.trim(), dimensions: draft.dimensions.trim(), price: draft.price.trim() }, file);
    } catch (err) {
      setFailure(err instanceof Error ? err.message : "Saving failed. Please try again.");
      setSaving(false);
    }
  }

  function cancel() {
    if (dirty && !window.confirm("Discard your changes to this piece?")) return;
    onCancel();
  }

  const shown = preview ?? imageSrc;
  const input = "field mt-2";

  return (
    <main id="main">
      <form onSubmit={submit} noValidate aria-labelledby={`${ids}-heading`} className="mx-auto max-w-6xl px-4 pt-6 pb-24 sm:px-6 lg:px-10">
        <button type="button" onClick={cancel} className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-ink-soft hover:text-ink">
          <ArrowLeft className="size-4" aria-hidden /> All artwork
        </button>
        <h1 id={`${ids}-heading`} ref={heading} tabIndex={-1} className="mt-2 font-serif text-4xl font-semibold outline-none">{artwork ? `Edit “${artwork.title}”` : "Add artwork"}</h1>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
          <div>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                pick(e.dataTransfer.files[0]);
              }}
              className={`relative flex min-h-64 items-center justify-center border-2 border-dashed p-4 transition-colors duration-200 sm:min-h-80 ${
                dragging ? "border-bay bg-bay/5" : errors.image ? "border-rust-text" : "border-field bg-paper"
              }`}
            >
              {shown ? (
                <img
                  src={shown}
                  onError={(e) => {
                    const img = e.currentTarget;
                    if (preview || !imageFallback || img.dataset.fallback) return;
                    img.dataset.fallback = "1";
                    img.src = imageFallback;
                  }}
                  alt="Preview of the painting" className="max-h-[65vh] w-auto max-w-full object-contain shadow-sm" />
              ) : (
                <div className="py-12 text-center">
                  <ImagePlus className="mx-auto size-10 text-sage" aria-hidden />
                  <p className="mt-4 text-lg">
                    <span className="hidden sm:inline">Drag a photo of the painting here, or use the button below</span>
                    <span className="sm:hidden">Use the button below to pick a photo</span>
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">It&rsquo;s resized for the web automatically.</p>
                </div>
              )}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                className="min-h-11 cursor-pointer border border-ink px-4 text-sm font-medium transition-colors hover:bg-ink hover:text-linen"
              >
                {shown ? "Replace photo" : "Choose a photo"}
              </button>
              {file && <span className="truncate text-sm text-ink-soft">{file.name}</span>}
              <input
                ref={fileInput}
                type="file"
                accept="image/*"
                className="sr-only"
                tabIndex={-1}
                aria-hidden
                onChange={(e) => pick(e.target.files?.[0])}
              />
            </div>
            {errors.image && <p role="alert" className="mt-2 text-sm text-rust-text">{errors.image}</p>}
          </div>

          <div className="space-y-6">
            <div>
              <label htmlFor={`${ids}-title`} className="text-sm font-medium">
                Title <span className="text-rust-text" aria-hidden>*</span>
              </label>
              <input
                ref={titleInput}
                id={`${ids}-title`}
                value={draft.title}
                onChange={(e) => update("title", e.target.value)}
                aria-invalid={!!errors.title}
                aria-required="true"
                aria-describedby={errors.title ? `${ids}-title-err` : undefined}
                className={input}
              />
              {errors.title && <p id={`${ids}-title-err`} role="alert" className="mt-1.5 text-sm text-rust-text">{errors.title}</p>}
            </div>

            <div>
              <label htmlFor={`${ids}-category`} className="text-sm font-medium">Category</label>
              <select id={`${ids}-category`} value={draft.category} onChange={(e) => update("category", e.target.value as Category)} className={`${input} cursor-pointer`}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor={`${ids}-medium`} className="text-sm font-medium">Medium</label>
                <input id={`${ids}-medium`} list={`${ids}-mediums`} value={draft.medium} onChange={(e) => update("medium", e.target.value)} placeholder="Pastel on paper" className={input} />
                <datalist id={`${ids}-mediums`}>
                  {mediums.map((m) => <option key={m} value={m} />)}
                </datalist>
              </div>
              <div>
                <label htmlFor={`${ids}-dimensions`} className="text-sm font-medium">Dimensions</label>
                <input id={`${ids}-dimensions`} value={draft.dimensions} onChange={(e) => update("dimensions", e.target.value)} placeholder={'18" x 24"'} className={input} />
              </div>
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor={`${ids}-status`} className="text-sm font-medium">Status</label>
                <select id={`${ids}-status`} value={draft.status} onChange={(e) => update("status", e.target.value as Status)} className={`${input} cursor-pointer`}>
                  {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor={`${ids}-price`} className="flex justify-between text-sm font-medium">
                  Price <span className="font-normal text-ink-soft">Optional</span>
                </label>
                <input id={`${ids}-price`} value={draft.price} onChange={(e) => update("price", e.target.value)} placeholder="$450" className={input} />
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-4 border border-field bg-paper p-4">
              <input type="checkbox" checked={draft.isFeatured} onChange={(e) => update("isFeatured", e.target.checked)} className="mt-1 size-5 shrink-0 accent-bay" />
              <span>
                <span className="font-medium">Feature on the home page</span>
                <span className="mt-0.5 block text-sm text-ink-soft">Featured pieces take turns in the large frame at the top of the site.</span>
              </span>
            </label>

            {failure && <p role="alert" className="text-sm text-rust-text">{failure}</p>}

            <div className="flex items-center gap-4 border-t border-sand pt-6">
              <button
                type="submit"
                disabled={saving}
                className="min-h-12 flex-1 cursor-pointer bg-ink px-6 font-medium text-linen transition-colors hover:bg-bay-deep disabled:cursor-wait disabled:opacity-60"
              >
                {saving ? (file ? "Uploading…" : "Saving…") : artwork ? "Save changes" : "Add to gallery"}
              </button>
              <button type="button" onClick={cancel} className="min-h-12 cursor-pointer px-4 text-ink-soft hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </main>
  );
}
