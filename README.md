# CORE website workspace

Private source-of-truth workspace for CORE's public HTML/CSS/JavaScript SPA, public media, and GoHighLevel deployment handoff.

**Status:** development foundation, not the finished website and not deployed to GHL. The member experience stays in GHL's native portal; this repository does not implement authentication or contain private CRM/member data.

## Start locally

Use Node.js 22 or later. The starter uses Node built-ins and browser-native JavaScript: no package installation is required.

```sh
git clone https://github.com/hustlescientist/core.git
cd core
npm run dev
```

Open `http://127.0.0.1:4173`. Edit `src/`, then refresh the browser. Use `npm test` for checks and `npm run build` to generate the GHL handoff.

## Workspace map

- `src/`: HTML shell, scoped CSS, vanilla JavaScript, bilingual copy, and public integration configuration.
- `media/`: approved web assets, a media register, and asset-handling instructions. Large originals are excluded by default; private documents and consent records never belong here.
- `docs/`: project brief, brand direction, content inventory, architecture, backlog, QA, and deployment instructions.
- `scripts/`: dependency-free preview, validation, and build tools.
- `tests/`: automated foundation checks.
- `.github/`: issue/PR templates and build-check workflow.
- `dist/`: generated local preview and paste-ready GHL embed; ignored by Git.
- `core.code-workspace`: VS Code/Cursor workspace settings.
- `AGENTS.md`: implementation boundaries and instructions for coding agents.

## Daily workflow

Create a branch such as `feat/homepage`, `content/spanish-review`, or `media/program-photos`. Keep source, translations, and media-register changes together. Run `npm test && npm run build`, review desktop/mobile behavior, then open a pull request into `main`.

`main` is the reviewed source, not an automatic production deployment. Publish to GHL only after staging review. Tag approved releases and record the commit and GHL page in `docs/DEPLOYMENT.md`. Never edit generated `dist/` output as the source of truth.

## First build priorities

1. Approve copy, brand details, translations, source logo, and public-media permissions.
2. Build the homepage and audience/program views using the inventory in `docs/CONTENT-INVENTORY.md`.
3. Configure and test GHL forms, the native portal link, payment destination, and published media URLs.
4. Validate routing/SEO in GHL; finish accessibility, language, device, and integration checks before launch.

See `docs/BACKLOG.md` for the work register and `docs/PROJECT-BRIEF.md` for the approved architecture and source references.
