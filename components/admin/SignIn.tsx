"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { createClient, defaultRepo, GitHubError, type RepoConfig } from "@/lib/github";

export function SignIn({
  notice,
  onSignedIn,
}: {
  notice?: string;
  onSignedIn: (token: string, repo: RepoConfig, login: string, remember: boolean) => void;
}) {
  const [token, setToken] = useState("");
  const [repo, setRepo] = useState(defaultRepo.repo);
  const [reveal, setReveal] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(notice ?? "");
  const [busy, setBusy] = useState(false);
  const needsRepo = !defaultRepo.repo;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!token.trim()) return setError("Paste your access token to continue.");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo.trim())) return setError("Enter the repository as owner/name.");
    setBusy(true);
    setError("");
    const config = { repo: repo.trim(), branch: defaultRepo.branch };
    try {
      const login = await createClient(token.trim(), config).verify();
      onSignedIn(token.trim(), config, login, remember);
    } catch (err) {
      if (err instanceof GitHubError && err.status === 401) setError("GitHub didn't accept that token. It may have expired or been copied incompletely.");
      else if (err instanceof GitHubError && err.status === 404) setError(`This token doesn't have access to ${config.repo}. Check the token's repository access.`);
      else setError(err instanceof Error ? err.message : "Couldn't reach GitHub. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-4 py-16">
      <Link href="/" className="font-serif text-2xl font-semibold">
        Prichard <span className="italic font-medium text-rust-text">Art</span>
      </Link>
      <h1 className="mt-10 font-serif text-4xl font-semibold">Studio sign in</h1>
      <p className="mt-3 text-ink-soft">
        Changes you make here are saved to the site&rsquo;s GitHub repository and go live about a
        minute later.
      </p>

      <form onSubmit={submit} className="mt-8 space-y-5 border border-stone-200 bg-paper p-6 shadow-sm">
        {needsRepo && (
          <div>
            <label htmlFor="repo" className="text-sm font-medium">Repository</label>
            <input
              id="repo"
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="owner/repo-name"
              autoComplete="off"
              className="field mt-2"
            />
          </div>
        )}
        <div>
          <label htmlFor="token" className="text-sm font-medium">GitHub access token</label>
          <div className="relative mt-2">
            <input
              id="token"
              type={reveal ? "text" : "password"}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="github_pat_…"
              autoComplete="current-password"
              spellCheck={false}
              aria-invalid={!!error && !token.trim()}
              aria-describedby={error ? "signin-error" : undefined}
              className="field pr-12 font-mono"
            />
            <button
              type="button"
              onClick={() => setReveal((r) => !r)}
              aria-label={reveal ? "Hide token" : "Show token"}
              className="absolute inset-y-0 right-0 grid w-12 cursor-pointer place-items-center text-ink-soft hover:text-ink"
            >
              {reveal ? <EyeOff className="size-4" aria-hidden /> : <Eye className="size-4" aria-hidden />}
            </button>
          </div>
        </div>
        <label className="flex cursor-pointer items-center gap-3 text-sm">
          <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="size-4 accent-bay" />
          Keep me signed in on this computer
        </label>
        {error && (
          <p id="signin-error" role="alert" className="text-sm text-rust-text">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="min-h-12 w-full cursor-pointer bg-ink font-medium text-linen transition-colors hover:bg-bay-deep disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>

      <details className="mt-6 text-sm text-ink-soft">
        <summary className="min-h-11 cursor-pointer py-2 font-medium text-ink">How to make a token</summary>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
          <li>
            On GitHub, open{" "}
            <a className="text-bay underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
              Settings › Developer settings › Fine-grained tokens
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
            .
          </li>
          <li>Name it &ldquo;Studio&rdquo; and pick an expiration date.</li>
          <li>Under Repository access, choose <em>Only select repositories</em> and pick this site&rsquo;s repository.</li>
          <li>Under Permissions, set <em>Contents</em> to <em>Read and write</em>. Optionally set <em>Actions</em> to <em>Read-only</em> to see when changes are live.</li>
          <li>Generate the token, copy it, and paste it above.</li>
        </ol>
        <p className="mt-3">The token only works on this one repository and is stored only in this browser.</p>
      </details>
    </main>
  );
}
