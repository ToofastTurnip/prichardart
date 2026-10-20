# Prichard Art

Portfolio site and studio admin for Prichard, a Middle River, Maryland painter.
It's a static Next.js site hosted for free on GitHub Pages. There's no server, no database, and nothing to pay for.

- **Public site** (`/`): hero with featured paintings, filterable gallery, lightbox with shareable
  `?piece=` links, bio, and a contact form.
- **Artwork pages** (`/art/<slug>/`): one indexable page per painting with structured data,
  generated at build time from the catalog.
- **Studio** (`/admin/`): add, edit, delete, feature, and mark pieces as sold. It signs in with a
  fine-grained GitHub token. Each save is one commit to this repo, and the deploy workflow publishes
  it in about a minute.

## How it fits together

| What | Where |
| --- | --- |
| Artwork catalog | `content/artworks.json` |
| Web-sized images | `public/gallery/<id>.webp` and `<id>-thumb.webp` |
| Bio photos | `public/studio/` |
| Contact details | `lib/site.ts` |
| Deploy | `.github/workflows/deploy.yml` (builds on every push to `main`) |

The studio resizes each photo in the browser (2000px full, 800px thumbnail) before uploading,
so only small files reach the repo.

## One-time setup

1. **Create a public GitHub repository** and push this folder to its `main` branch. GitHub Pages
   is only free for public repos. **Name the repo `<your-username>.github.io`** so the site is served
   from the root of a domain. Search engines and AI crawlers only read `robots.txt` and `llms.txt`
   at a domain's root, so a project URL like `<user>.github.io/prichard-art/` would hide them.
   A custom domain also works (about $12/year, the only thing here that costs money).
2. In the repo, open **Settings › Pages** and set **Source** to **GitHub Actions**.
3. Push or re-run the "Deploy site" workflow. The workflow reads the live address from the Pages
   settings, so canonical links, the sitemap and social previews use the right URL automatically,
   including a custom domain if you add one later.
4. **Make the studio token.** On GitHub, go to Settings › Developer settings ›
   [Fine-grained tokens](https://github.com/settings/personal-access-tokens/new):
   - Repository access: **Only select repositories**, then this repo
   - Permissions: **Contents: Read and write**
   - Optional: **Actions: Read-only**, which lets the studio show "Publishing…" and "Live"
   - Pick an expiration and set a reminder to renew it. The studio will ask for a new token
     when the old one expires.
5. Open `/admin/` on the live site, paste the token, and sign in.

The token is kept only in that browser's storage and can only touch this one repository.
Every change is a normal commit, so anything can be undone from the repo history.

## Search engines and AI assistants

Built automatically on every deploy from the current catalog:

| File | Purpose |
| --- | --- |
| `/robots.txt` | Allows all search engines and AI crawlers (Google, Bing, GPTBot, ClaudeBot, PerplexityBot and others), blocks only `/admin/`, and points to the sitemap and `llms.txt` |
| `/sitemap.txt` | The home page plus every artwork page, one URL per line |
| `/llms.txt` | A plain-language summary for AI assistants: who the artist is, what's for sale, when the site is a good recommendation, and how to buy or commission |

Every page also carries schema.org data (Person, WebSite, VisualArtwork), canonical URLs, and
Open Graph images for link previews.

**Google Search Console:** add the site as a property, verify it with the **HTML tag** method: copy the
tag's `content` value into a repository variable named `GOOGLE_SITE_VERIFICATION` (Settings ›
Secrets and variables › Actions › Variables) and re-run the deploy. Then under **Sitemaps**
submit `sitemap.txt`. Do the same in Bing Webmaster Tools, which also feeds
ChatGPT and Copilot search.

## Accessibility

The site targets WCAG 2.2 AA: text and form-field contrast is checked, every control works by
keyboard with visible focus, there's a skip link, form errors are announced and tied to their
fields, the lightbox traps focus and closes with Esc, motion respects reduced-motion settings,
and layouts reflow to 320px wide without sideways scrolling. Keep new artwork titles and
mediums filled in, since they become each image's alt text.

### Optional: send contact messages without a mail app

By default the contact form opens the visitor's email app with the message filled in. To have it
send directly instead, get a free access key from [web3forms.com](https://web3forms.com) for
`bogart1109@aol.com`. Then add it as a repository **variable** (not a secret) named
`WEB3FORMS_KEY` under Settings › Secrets and variables › Actions › Variables.

## Local development

```bash
npm install
npm run dev            # http://localhost:3000
npm run build          # static output in ./out
```

To use the studio locally, sign in at `/admin/` and enter the repository as `owner/name`.
Saves go to the real repo.

`npm run seed -- --force` rebuilds the catalog from the original photos in `art/`.
This **replaces** `content/artworks.json`, so only use it to start over.
