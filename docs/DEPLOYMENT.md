# GHL build, staging, and release handoff

**No GHL page, domain, portal, or production setting has been changed by the workspace setup.** GitHub is the code source, not automatic hosting.

## Build a development preview

```sh
npm run check && npm test && npm run build
```

`dist/index.html`: standalone noindex preview. `dist/ghl-embed.html`: style + `#core-app` shell + JSON + script, without full-document tags. `dist/build-manifest.json`: source commit when available, build time, embed SHA-256, and byte count. The hash fingerprints the generated code; a dirty checkout may differ from its HEAD commit, so release only from a reviewed clean checkout.

`npm run build:release` is deliberately blocked. Production routing, final metadata, content, translations, integration behavior, and approvals are not implemented by toggling config flags.

## GHL staging procedure

1. Preserve the current GHL page/embedded code and record its version before editing. Use an approved non-production page for the first integration test.
2. Configure a full-width host section with no unwanted host padding/background. Add one custom HTML/code element and paste the entire generated embed. Avoid duplicate app roots, scripts, or host headers/footers.
3. Ensure GHL executes the custom script at the correct lifecycle stage. The scaffold listens on `document` for `hydrationDone`; verify GHL's script-optimization settings, initial load, preview, and published staging behavior. Reference: https://help.gohighlevel.com/support/solutions/articles/155000002421-hydration-event-in-custom-code-in-funnels
4. Keep staging non-indexed using GHL's page settings. The embed itself cannot be relied on to set head-level robots/canonical metadata. The standalone noindex tag is not automatically copied into the host page.
5. Use verified public GHL/CDN media URLs and actual approved integration destinations. Local `/media/` paths and private GitHub URLs will not become public assets merely by pasting HTML.
6. Validate host CSS, mobile layout, real form iframes, language selection, native portal handoff, focus, direct links, refresh, and history. No forms/payments are configured in the starter.

## Before production

Implement and test real GHL paths/page shells and language-specific URLs; complete legacy redirects and per-page metadata. Remove development notices and use correct production indexability only after explicit approval. Complete `QA.md` and issues #1-#6. Do not publish draft translations or unverified metrics.

Merge reviewed source, verify a clean checkout, rebuild, retain the generated output as a release artifact, and tag the approved source. Record an entry below. Publishing is manual and controlled; CI does not call GHL or hold deployment credentials.

## Rollback

Restore the previously saved GHL embed/page version and any associated host metadata/redirect settings. Restore referenced CDN assets when needed. Reverting Git alone does not roll back an already pasted GHL page. Record the rollback and test the restored public tasks.

## Deployment log

| Date | Environment | Source commit / tag | Embed hash | GHL page | Reviewer | Result |
|---|---|---|---|---|---|---|
| 2026-10-07 | Workspace only | See Git history | Generated locally | Not configured | Pending | Foundation; not deployed |
