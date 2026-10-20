// Browser-side client for the GitHub REST API. The admin signs in with a
// fine-grained personal access token limited to this repository (Contents: read & write).
// Every change is a single commit, which triggers the Pages deploy workflow.

import type { Artwork } from "./types";

const API = "https://api.github.com";
export const CATALOG_PATH = "content/artworks.json";

export interface RepoConfig {
  repo: string; // "owner/name"
  branch: string;
}

export const defaultRepo: RepoConfig = {
  repo: process.env.NEXT_PUBLIC_GITHUB_REPO ?? "",
  branch: process.env.NEXT_PUBLIC_GITHUB_BRANCH || "main",
};

export class GitHubError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

export interface FileChange {
  path: string;
  /** Base64 for binary files, or plain text. `null` deletes the file. */
  content: { base64: string } | { text: string } | null;
}

export function createClient(token: string, { repo, branch }: RepoConfig) {
  async function gh<T>(path: string, init: RequestInit = {}): Promise<T> {
    const res = await fetch(`${API}${path}`, {
      ...init,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...init.headers,
      },
      cache: "no-store",
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        message = (await res.json()).message ?? message;
      } catch {}
      throw new GitHubError(message, res.status);
    }
    return res.status === 204 ? (undefined as T) : res.json();
  }

  return {
    /** Confirms the token can push to the repo. Returns the signed-in login. */
    async verify() {
      const [user, info] = await Promise.all([
        gh<{ login: string }>("/user").catch(() => ({ login: "" })),
        gh<{ permissions?: { push?: boolean } }>(`/repos/${repo}`),
      ]);
      if (!info.permissions?.push) {
        throw new GitHubError(
          "This token can read the repository but cannot save changes. Give it Contents: Read and write.",
          403,
        );
      }
      return user.login;
    },

    async readCatalog(): Promise<Artwork[]> {
      const file = await gh<{ content: string }>(
        `/repos/${repo}/contents/${CATALOG_PATH}?ref=${encodeURIComponent(branch)}`,
      );
      const bytes = Uint8Array.from(atob(file.content.replace(/\n/g, "")), (c) => c.charCodeAt(0));
      return JSON.parse(new TextDecoder().decode(bytes));
    },

    /** Writes, replaces, and deletes several files in one commit. Retries once if the branch moved. */
    async commit(message: string, changes: FileChange[]) {
      const blobs = await Promise.all(
        changes.map(async (c) => {
          if (c.content === null) return { path: c.path, sha: null };
          const body =
            "base64" in c.content
              ? { content: c.content.base64, encoding: "base64" }
              : { content: c.content.text, encoding: "utf-8" };
          const blob = await gh<{ sha: string }>(`/repos/${repo}/git/blobs`, {
            method: "POST",
            body: JSON.stringify(body),
          });
          return { path: c.path, sha: blob.sha };
        }),
      );

      for (let attempt = 0; ; attempt++) {
        const ref = await gh<{ object: { sha: string } }>(`/repos/${repo}/git/ref/heads/${branch}`);
        const parent = await gh<{ tree: { sha: string } }>(`/repos/${repo}/git/commits/${ref.object.sha}`);
        const tree = await gh<{ sha: string }>(`/repos/${repo}/git/trees`, {
          method: "POST",
          body: JSON.stringify({
            base_tree: parent.tree.sha,
            tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
          }),
        });
        const commit = await gh<{ sha: string }>(`/repos/${repo}/git/commits`, {
          method: "POST",
          body: JSON.stringify({ message, tree: tree.sha, parents: [ref.object.sha] }),
        });
        try {
          await gh(`/repos/${repo}/git/refs/heads/${branch}`, {
            method: "PATCH",
            body: JSON.stringify({ sha: commit.sha }),
          });
          return commit.sha;
        } catch (err) {
          if (attempt === 0 && err instanceof GitHubError && err.status === 422) continue;
          throw err;
        }
      }
    },

    /** Status of the most recent deploy run, so the admin can say when changes are live. */
    async latestDeploy() {
      const runs = await gh<{
        workflow_runs: { status: string; conclusion: string | null; head_sha: string; html_url: string }[];
      }>(`/repos/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=1`).catch(() => null);
      return runs?.workflow_runs[0] ?? null;
    },
  };
}

export type GitHubClient = ReturnType<typeof createClient>;

export function catalogChange(artworks: Artwork[]): FileChange {
  return { path: CATALOG_PATH, content: { text: JSON.stringify(artworks, null, 2) + "\n" } };
}
