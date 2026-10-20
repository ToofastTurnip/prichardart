"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ExternalLink, LogOut, Pencil, Plus, Search, Star, Trash2, X } from "lucide-react";
import { catalogChange, createClient, GitHubError, type FileChange, type RepoConfig } from "@/lib/github";
import { blobToBase64, prepareImage } from "@/lib/image";
import { uniqueSlug } from "@/lib/slug";
import { asset } from "@/lib/site";
import { CATEGORIES, STATUSES, STATUS_LABELS, type Artwork, type Status } from "@/lib/types";
import { clearSession, loadSession, saveSession } from "./session";
import { SignIn } from "./SignIn";
import { ArtworkEditor, type Draft } from "./ArtworkEditor";

type Session = { token: string; repo: RepoConfig; login: string };
type View = { kind: "list" } | { kind: "edit"; id: string | null };
type Publish = { state: "idle" } | { state: "publishing"; sha: string } | { state: "live" } | { state: "failed"; url: string };

export function AdminApp() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [notice, setNotice] = useState<string>();
  const [artworks, setArtworks] = useState<Artwork[] | null>(null);
  const [loadError, setLoadError] = useState("");
  const [view, setView] = useState<View>({ kind: "list" });
  const [toast, setToast] = useState("");
  const [publish, setPublish] = useState<Publish>({ state: "idle" });
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [confirmDelete, setConfirmDelete] = useState<Artwork | null>(null);
  const listHeading = useRef<HTMLHeadingElement>(null);
  const returning = useRef(false);

  // Coming back from the editor, put focus on the list heading.
  useEffect(() => {
    if (view.kind === "list" && returning.current) listHeading.current?.focus();
    returning.current = view.kind === "edit";
  }, [view]);

  const client = useMemo(() => (session ? createClient(session.token, session.repo) : null), [session]);

  const signOut = useCallback((message?: string) => {
    clearSession();
    setSession(null);
    setArtworks(null);
    setNotice(message);
  }, []);

  // Restore a saved session.
  useEffect(() => {
    const stored = loadSession();
    if (!stored) return setBooting(false);
    createClient(stored.token, stored.repo)
      .verify()
      .then((login) => setSession({ ...stored, login }))
      .catch((err) => {
        if (err instanceof GitHubError && (err.status === 401 || err.status === 403 || err.status === 404)) {
          clearSession();
          setNotice("Your saved token no longer works. It may have expired. Please sign in again.");
        } else {
          setNotice("Couldn't reach GitHub. Check your connection and try again.");
        }
      })
      .finally(() => setBooting(false));
  }, []);

  const handleError = useCallback(
    (err: unknown) => {
      if (err instanceof GitHubError && err.status === 401) {
        signOut("GitHub stopped accepting your token. It may have expired. Please sign in again.");
        return "";
      }
      return err instanceof Error ? err.message : "Something went wrong.";
    },
    [signOut],
  );

  useEffect(() => {
    if (!client) return;
    setLoadError("");
    client
      .readCatalog()
      .then(setArtworks)
      .catch((err) => setLoadError(handleError(err) || ""));
  }, [client, handleError]);

  // After a save, watch the deploy workflow (needs Actions: read on the token; silently skipped otherwise).
  useEffect(() => {
    if (!client || publish.state !== "publishing") return;
    let stopped = false;
    const started = Date.now();
    const tick = async () => {
      if (stopped) return;
      const run = await client.latestDeploy();
      if (!run || Date.now() - started > 6 * 60_000) return setPublish({ state: "idle" });
      if (run.head_sha === publish.sha && run.status === "completed") {
        return setPublish(run.conclusion === "success" ? { state: "live" } : { state: "failed", url: run.html_url });
      }
      setTimeout(tick, 8000);
    };
    const t = setTimeout(tick, 6000);
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, [client, publish]);

  // Confirmations fade after a while; problems stay until dismissed.
  useEffect(() => {
    if (!toast || toast.startsWith("Couldn")) return;
    const t = setTimeout(() => setToast(""), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  /** Re-reads the catalog, applies `mutate`, and commits it with any extra files in one commit. */
  async function commit(message: string, mutate: (list: Artwork[]) => Artwork[], extra: FileChange[] = []) {
    if (!client) throw new Error("Not signed in.");
    const fresh = await client.readCatalog();
    const next = mutate(fresh);
    const sha = await client.commit(message, [...extra, catalogChange(next)]);
    setArtworks(next);
    setPublish({ state: "publishing", sha });
  }

  async function quickUpdate(a: Artwork, patch: Partial<Artwork>, message: string) {
    setPending((p) => new Set(p).add(a.id));
    setArtworks((list) => list?.map((x) => (x.id === a.id ? { ...x, ...patch } : x)) ?? list);
    try {
      await commit(message, (list) => list.map((x) => (x.id === a.id ? { ...x, ...patch } : x)));
      setToast("Saved. The site updates in about a minute.");
    } catch (err) {
      setArtworks((list) => list?.map((x) => (x.id === a.id ? a : x)) ?? list);
      const msg = handleError(err);
      if (msg) setToast(`Couldn't save: ${msg}`);
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(a.id);
        return n;
      });
    }
  }

  async function saveArtwork(existing: Artwork | undefined, draft: Draft, file: File | null) {
    try {
      const id = existing?.id ?? crypto.randomUUID();
      const extra: FileChange[] = [];
      let image: Pick<Artwork, "imageUrl" | "thumbnailUrl" | "width" | "height"> | null = null;

      if (file) {
        const img = await prepareImage(file);
        // A fresh file name for replacements so browsers don't show the old cached photo.
        const stem = existing ? `${id}-${Date.now().toString(36)}` : id;
        const full = `gallery/${stem}.${img.ext}`;
        const thumb = `gallery/${stem}-thumb.${img.ext}`;
        extra.push(
          { path: `public/${full}`, content: { base64: await blobToBase64(img.full) } },
          { path: `public/${thumb}`, content: { base64: await blobToBase64(img.thumb) } },
        );
        if (existing) {
          extra.push({ path: `public/${existing.imageUrl}`, content: null });
          if (existing.thumbnailUrl) extra.push({ path: `public/${existing.thumbnailUrl}`, content: null });
        }
        image = { imageUrl: full, thumbnailUrl: thumb, width: img.width, height: img.height };
      }

      await commit(
        existing ? `Update artwork: ${draft.title}` : `Add artwork: ${draft.title}`,
        (list) => {
          const taken = new Set(list.filter((x) => x.id !== id).map((x) => x.slug));
          if (existing) {
            return list.map((x) =>
              x.id === id
                ? {
                    ...x,
                    ...draft,
                    ...image,
                    slug: x.title === draft.title ? x.slug : uniqueSlug(draft.title, taken),
                  }
                : x,
            );
          }
          const created: Artwork = {
            id,
            ...draft,
            ...image!,
            slug: uniqueSlug(draft.title, taken),
            createdAt: new Date().toISOString(),
          };
          return [created, ...list];
        },
        extra,
      );
      setView({ kind: "list" });
      setToast(existing ? "Changes saved. The site updates in about a minute." : `“${draft.title}” added. It will appear on the site in about a minute.`);
    } catch (err) {
      const msg = handleError(err);
      throw new Error(msg ? `Couldn't save: ${msg}` : "Please sign in again.");
    }
  }

  async function deleteArtwork(a: Artwork) {
    setConfirmDelete(null);
    setPending((p) => new Set(p).add(a.id));
    try {
      const files: FileChange[] = [{ path: `public/${a.imageUrl}`, content: null }];
      if (a.thumbnailUrl) files.push({ path: `public/${a.thumbnailUrl}`, content: null });
      await commit(`Remove artwork: ${a.title}`, (list) => list.filter((x) => x.id !== a.id), files);
      setToast(`“${a.title}” removed. It stays in the repository history if you ever need it back.`);
    } catch (err) {
      const msg = handleError(err);
      if (msg) setToast(`Couldn't remove it: ${msg}`);
    } finally {
      setPending((p) => {
        const n = new Set(p);
        n.delete(a.id);
        return n;
      });
    }
  }

  // Images come straight from the repo so new uploads show before the site redeploys.
  const src = (path: string) =>
    session ? `https://raw.githubusercontent.com/${session.repo.repo}/${session.repo.branch}/public/${path}` : asset(path);

  if (booting) {
    return <p className="grid min-h-dvh place-items-center text-ink-soft">Opening the studio…</p>;
  }

  if (!session) {
    return (
      <SignIn
        notice={notice}
        onSignedIn={(token, repo, login, remember) => {
          saveSession({ token, repo }, remember);
          setNotice(undefined);
          setSession({ token, repo, login });
        }}
      />
    );
  }

  const sorted = [...(artworks ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const mediums = [...new Set(sorted.map((a) => a.medium).filter(Boolean))].sort();
  const editing = view.kind === "edit" && view.id ? sorted.find((a) => a.id === view.id) : undefined;
  const q = query.trim().toLowerCase();
  const filtered = sorted.filter(
    (a) => (category === "All" || a.category === category) && (!q || `${a.title} ${a.medium}`.toLowerCase().includes(q)),
  );

  return (
    <>
      <header className="border-b border-sand bg-paper">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-10">
          <div className="flex items-baseline gap-3">
            <Link href="/" className="font-serif text-xl font-semibold">Prichard Art</Link>
            <span className="text-sm text-ink-soft">Studio</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span aria-live="polite">
              <PublishStatus publish={publish} />
            </span>
            <Link href="/" target="_blank" className="hidden min-h-11 items-center gap-1.5 px-2 text-ink-soft hover:text-ink sm:inline-flex">
              View site <ExternalLink className="size-3.5" aria-hidden />
              <span className="sr-only"> (opens in a new tab)</span>
            </Link>
            <button type="button" onClick={() => signOut()} className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 px-2 text-ink-soft hover:text-ink">
              <LogOut className="size-4" aria-hidden /> <span className="sr-only sm:not-sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {view.kind === "edit" ? (
        <ArtworkEditor
          key={view.id ?? "new"}
          artwork={editing}
          imageSrc={editing ? src(editing.imageUrl) : undefined}
          imageFallback={editing ? asset(editing.imageUrl) : undefined}
          mediums={mediums}
          onCancel={() => setView({ kind: "list" })}
          onSave={(draft, file) => saveArtwork(editing, draft, file)}
        />
      ) : (
        <main id="main" className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6 lg:px-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 ref={listHeading} tabIndex={-1} className="font-serif text-4xl font-semibold outline-none">
                Artwork
              </h1>
              <p className="mt-1 text-ink-soft">
                {artworks ? `${artworks.length} pieces in the gallery` : loadError ? "" : "Loading the catalog…"}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setView({ kind: "edit", id: null })}
              disabled={!artworks}
              className="inline-flex min-h-12 cursor-pointer items-center gap-2 bg-ink px-5 font-medium text-linen transition-colors hover:bg-bay-deep disabled:opacity-50"
            >
              <Plus className="size-4" aria-hidden /> Add artwork
            </button>
          </div>

          {loadError && (
            <p role="alert" className="mt-8 border border-rust/40 bg-paper p-4 text-rust-text">
              Couldn&rsquo;t load the catalog: {loadError}
            </p>
          )}

          {artworks && (
            <>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <label className="relative flex-1">
                  <span className="sr-only">Search artwork</span>
                  <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search by title or medium"
                    className="field pl-10"
                  />
                </label>
                <label>
                  <span className="sr-only">Category</span>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="field cursor-pointer sm:w-64"
                  >
                    <option>All</option>
                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </label>
              </div>

              <ul className="mt-6 divide-y divide-sand border-y border-sand bg-paper">
                {filtered.map((a) => {
                  const busy = pending.has(a.id);
                  return (
                    <li key={a.id} aria-busy={busy} className={`flex flex-wrap items-center gap-x-5 gap-y-3 p-3 sm:flex-nowrap sm:p-4 ${busy ? "opacity-60" : ""}`}>
                      <img
                        src={src(a.thumbnailUrl ?? a.imageUrl)}
                        onError={(e) => {
                          const img = e.currentTarget;
                          if (img.dataset.fallback) return;
                          img.dataset.fallback = "1";
                          img.src = asset(a.thumbnailUrl ?? a.imageUrl);
                        }}
                        alt=""
                        loading="lazy"
                        className="size-16 shrink-0 border border-sand object-cover sm:size-20"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-serif text-xl font-semibold">{a.title}</p>
                        <p className="truncate text-sm text-ink-soft">
                          {a.category}
                          {a.medium && ` · ${a.medium}`}
                          {a.dimensions && ` · ${a.dimensions}`}
                        </p>
                      </div>
                      <div className="flex w-full items-center gap-2 sm:w-auto">
                        <label className="flex-1 sm:flex-none">
                          <span className="sr-only">Status of {a.title}</span>
                          <select
                            value={a.status}
                            disabled={busy}
                            onChange={(e) => {
                              const status = e.target.value as Status;
                              quickUpdate(a, { status }, `Mark "${a.title}" as ${STATUS_LABELS[status]}`);
                            }}
                            className="field min-h-11 cursor-pointer py-2 sm:w-48"
                          >
                            {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                          </select>
                        </label>
                        <button
                          type="button"
                          disabled={busy}
                          aria-pressed={a.isFeatured}
                          aria-label={`Feature ${a.title} on the home page`}
                          title="Feature on the home page"
                          onClick={() =>
                            quickUpdate(a, { isFeatured: !a.isFeatured }, `${a.isFeatured ? "Unfeature" : "Feature"} "${a.title}"`)
                          }
                          className={`grid size-11 cursor-pointer place-items-center border transition-colors ${
                            a.isFeatured ? "border-bay bg-bay text-white" : "border-sand text-ink-soft hover:text-ink"
                          }`}
                        >
                          <Star className="size-4" fill={a.isFeatured ? "currentColor" : "none"} aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setView({ kind: "edit", id: a.id })}
                          aria-label={`Edit ${a.title}`}
                          className="grid size-11 cursor-pointer place-items-center border border-sand text-ink-soft transition-colors hover:text-ink"
                        >
                          <Pencil className="size-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => setConfirmDelete(a)}
                          aria-label={`Delete ${a.title}`}
                          className="grid size-11 cursor-pointer place-items-center border border-sand text-ink-soft transition-colors hover:border-rust hover:text-rust-text"
                        >
                          <Trash2 className="size-4" aria-hidden />
                        </button>
                      </div>
                    </li>
                  );
                })}
                {filtered.length === 0 && <li className="p-8 text-center text-ink-soft">No artwork matches that search.</li>}
              </ul>
            </>
          )}
        </main>
      )}

      <ConfirmDelete artwork={confirmDelete} onCancel={() => setConfirmDelete(null)} onConfirm={deleteArtwork} />

      <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center px-4">
        {toast && (
          <div className="pointer-events-auto flex max-w-lg items-start gap-3 bg-ink py-3 pr-2 pl-5 text-sm text-linen shadow-lg">
            <p className="py-1">{toast}</p>
            <button type="button" onClick={() => setToast("")} aria-label="Dismiss message" className="grid size-8 shrink-0 cursor-pointer place-items-center text-linen/80 hover:text-linen">
              <X className="size-4" aria-hidden />
            </button>
          </div>
        )}
      </div>
    </>
  );
}

function PublishStatus({ publish }: { publish: Publish }) {
  if (publish.state === "publishing")
    return (
      <span className="inline-flex items-center gap-2 text-ink-soft">
        <span className="size-2 animate-pulse rounded-full bg-rust" aria-hidden /> Publishing…
      </span>
    );
  if (publish.state === "live")
    return (
      <span className="inline-flex items-center gap-2 text-ink-soft">
        <span className="size-2 rounded-full bg-bay" aria-hidden /> Live
      </span>
    );
  if (publish.state === "failed")
    return (
      <a href={publish.url} target="_blank" rel="noreferrer" className="text-rust-text underline">
        Publish failed
      </a>
    );
  return null;
}

function ConfirmDelete({
  artwork,
  onCancel,
  onConfirm,
}: {
  artwork: Artwork | null;
  onCancel: () => void;
  onConfirm: (a: Artwork) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (artwork && !ref.current?.open) ref.current?.showModal();
    if (!artwork && ref.current?.open) ref.current.close();
  }, [artwork]);

  return (
    <dialog ref={ref} onClose={onCancel} aria-labelledby="del-title" className="m-auto w-[min(92vw,28rem)] bg-paper p-0 shadow-2xl">
      {artwork && (
        <div className="p-6">
          <h2 id="del-title" className="font-serif text-2xl font-semibold">
            Delete &ldquo;{artwork.title}&rdquo;?
          </h2>
          <p className="mt-3 text-ink-soft">
            It will be taken off the website. The photo stays in the GitHub history, so it can be
            restored later if needed.
          </p>
          <div className="mt-6 flex justify-end gap-3">
            <button type="button" onClick={onCancel} autoFocus className="min-h-11 cursor-pointer px-4 text-ink-soft hover:text-ink">
              Keep it
            </button>
            <button
              type="button"
              onClick={() => onConfirm(artwork)}
              className="min-h-11 cursor-pointer bg-rust-text px-5 font-medium text-white transition-colors hover:bg-rust"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
