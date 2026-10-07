# CORE website workspace

Source-of-truth workspace for CORE's public HTML/CSS/JavaScript SPA, public media, and GoHighLevel deployment handoff.

**Status: development foundation, not the finished website and not deployed to GHL.** The member experience stays in GHL's native portal. This repository does not implement authentication or contain private CRM/member data.

## Start locally

Use Node.js 22 or later. No package installation is required; the starter uses Node built-ins and browser-native JavaScript.

```sh
git clone https://github.com/hustlescientist/core.git
cd core
npm run dev
```

Open `http://127.0.0.1:4173`. Edit `src/`, then refresh. Open `core.code-workspace` in VS Code or Cursor for the shared workspace and tasks.

```sh
npm run check   # Syntax, bilingual configuration, media, and file-size checks
npm test        # 28 automated foundation/media tests
npm run build   # Local preview and paste-ready development embed
```

Output: `dist/index.html`, `dist/ghl-embed.html`, and `dist/build-manifest.json`. `dist/` is generated and Git-ignored. `npm run build:release` deliberately fails until production routing and launch reviews are implemented; changing config flags alone is insufficient.

## Workspace map

| Location | Edit or track here |
|---|---|
| `src/shell.html` | The scoped application mount and semantic HTML shell |
| `src/css/` | CORE brand tokens and responsive component styles |
| `src/js/app.js` | Public navigation, language switching, focus, and initialization |
| `src/content/en.json`, `es.json` | Matching English/Spanish content, currently draft |
| `src/config/site.json` | Public contact details, integration destinations, review flags |
| `media/` | Approved web assets and the acquisition/approval register |
| `docs/` | Scope, architecture, brand, legacy inventory, backlog, QA, deployment |
| `scripts/`, `tests/` | Preview/build/check tools and automated tests |
| `.github/` | Issue and pull-request templates; CI validation workflow |
| `AGENTS.md` | Boundaries for Codex and other coding agents |

## What works now

The site has 11 public views, English/Spanish switching that preserves the current view, responsive navigation, keyboard focus handling, honest fallback behavior for unconfigured integrations, and a self-contained development embed. It now uses 16 selected assets from the supplied labeled archive: the full CORE logo, photographs, program icons, illustration, school images, and report cover. The three program cards keep distinct destinations. GHL hydration hooks still require testing in the real GHL environment.

**Not built yet:** final site content, resource search, events, live forms/payments, portal configuration, production routing/SEO, or a full accessibility audit. No font files are bundled. Hash routing is preview-only, and the standalone preview is marked noindex.

## Work tracking and Git flow

Start with [the issue backlog](https://github.com/hustlescientist/core/issues) and [docs/BACKLOG.md](docs/BACKLOG.md). Six initial workstreams have acceptance checklists; assignees remain open.

```sh
git switch main
git pull --ff-only
git switch -c feat/homepage
# Edit source, translations, and media register together.
npm run check && npm test && npm run build
git add src docs media
git commit -m "feat: build CORE homepage sections"
git push -u origin feat/homepage
```

Open a pull request into `main`. Include the linked issue, screenshots, test results, content/media approvals, and GHL impact. `main` is the reviewed source, **not an automatic production deployment**. Branch protection and a GitHub Projects board are not configured by this scaffold.

## Media and privacy

Current images load from their original CORE-hosted URLs; they are not republished to GitHub or GHL. `media/manifest.json` retains stable IDs, exact labels/filenames, bilingual alternatives, page bindings, original URLs, and optional future `ghlUrl` overrides. Set `mediaProvider` in `src/config/site.json` to `ghl` only when ready; missing overrides fall back to originals.

All 534 source label records are preserved in a metadata-only archive. Run `npm run media:catalog` to export JSON/CSV, including a migration list for the 16 selected assets. Source image binaries remain in the supplied ZIP; no font files are bundled. See [media/README.md](media/README.md) for migration instructions and [docs/MEDIA-QA.md](docs/MEDIA-QA.md) for tests and limitations. Keep the original media URLs served before any domain migration.

Before any GHL publish, follow [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Preserve the previous embed for rollback and record the source commit and build hash.
