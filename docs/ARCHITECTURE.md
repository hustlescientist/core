# Architecture and decisions

## Public build

`src/shell.html` + `src/css/*.css` + `src/js/media.js` + `src/js/app.js` + public JSON -> `scripts/build.mjs` -> `dist/ghl-embed.html` and `dist/index.html`.

The embed inlines CSS, JSON, and a classic script. It needs no module imports or runtime package CDN. JSON is escaped before it enters a script-data element; UI text is escaped before HTML rendering. Public integration URLs must use HTTPS and cannot include embedded credentials. This is not a complete security audit.

CSS is scoped to `#core-app`. Standalone body reset exists only in the preview wrapper. The script mounts once per live root, cleans up root/hash listeners when remounting, and listens for GHL's document-level `hydrationDone` event. Host CSS, custom-code placement, and optimization settings still need real GHL testing.

## Routing and language

The development router uses `#/en/`, `#/es/resources`, etc. It updates page titles and root language, moves focus to the new heading on navigation, and handles browser history. Language preference uses localStorage only when available; blocked storage does not prevent navigation. No sensitive data is stored.

Hash routes are NOT the production SEO plan. Validate real GHL path/page-shell behavior, language URLs, redirects, canonical metadata, and direct-link refresh before implementing the final router. `build:release` deliberately rejects this unfinished foundation even if approval flags are changed.

English/Spanish keys must match. Draft language coverage in the SPA does not translate a GHL iframe or the native portal. Forms, portal UI, member content, and notifications require separate configuration and review.

## Integrations

`src/config/site.json` holds public portal/donation destinations and bilingual form URL placeholders. Empty portal/donation URLs show a truthful development notice rather than a fake link. Form fields are configuration slots only: form embedding and submission flows are not implemented yet.

No backend, API key, contact fetch, custom auth, account state, or payment processing is included. The eventual portal button is a normal link to the approved native GHL portal. Do not place private files in public media, even when this repository itself is private.

## Media and build boundary

`media/manifest.json` is the selected-asset registry. `src/js/media.js` resolves original-host versus optional GHL URLs from `site.mediaProvider`. Layouts use stable IDs, not image URLs. Labels, filenames, original URLs, and responsive variant provenance are validated against the lossless 534-record source catalog; the catalog stays out of the browser payload.

The current build uses 16 selected hosted assets. Review-status assets are permitted in development but rejected for production until approved. There are no local raster or font binaries in this revision. Approved local files can still be copied by the build when deliberately registered, but the runtime resolver remains public-HTTPS-only.

Changing the provider is gradual and reversible while the original host remains available. Missing GHL overrides fall back to originals; original srcsets never override a configured GHL image. The app retries a failed hosted image once against its original URL, then shows a readable fallback. This does not guarantee live availability or preserve old WordPress URLs after a domain move.

No automatic GHL upload, private GitHub media serving, or DNS change is implemented. See `../media/README.md` and `MEDIA-QA.md`.

## Authoritative references

- HighLevel hydration event: https://help.gohighlevel.com/support/solutions/articles/155000002421-hydration-event-in-custom-code-in-funnels (checked October 7, 2026).
- GitHub large files: https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github (checked October 7, 2026).
- The selected product scope is recorded in `PROJECT-BRIEF.md`; it does not certify account-level portal capability.
