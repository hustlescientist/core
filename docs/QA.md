# CORE quality assurance

## Foundation verification - October 7, 2026

Automated: 13 Node tests covering config, EN/ES shape, navigation pages, unique program IDs, safe inline JSON, HTTPS URL validation, unapproved-release rejection, media provenance/duplicates/path traversal, script syntax, and generated embed structure. `npm run check` adds syntax and a web-file budget check. `npm run build` produces the development handoff.

Browser smoke checks were run in headless Chromium against the generated HTML through an offline fixture. This environment blocked browser navigation to localhost, so these checks are **not live GHL tests** and do not establish real-device, server-route, or full accessibility behavior.

The checked fixture supports equivalent-view EN/ES switching, language/title updates, remounting, fragment history, pending-integration feedback, keyboard skip/focus behavior, mobile menu/Escape, 11 views in both languages, unknown routes, and simulated repeated/root-replacing hydration. The homepage was checked for horizontal overflow at 320, 390, 768, and 1440 CSS pixels. The localhost server was checked separately for rejection of private/source paths. No JS page errors remained in these checks.

## Required whole-site review

| Area | Evidence required before launch |
|---|---|
| Content | Approved copy, names, current dates, eligibility, contact details, metrics and reporting periods |
| Language | EN/ES pages, forms, validation, confirmations, notifications, native portal content and recovery reviewed |
| Accessibility | Keyboard, screen reader, focus order, headings, contrast, image alternatives, captions, errors, reduced motion, zoom/reflow |
| Devices | Actual iPhone/Android plus desktop; long Spanish labels; slower connection |
| GHL | Host styling, hydration, repeated embed loads, iframe sizing, real direct links/refresh/history |
| Operations | Authorized test submissions reach correct staff; duplicate/consent handling and acknowledgments work |
| Native portal | Separate-account access checks, approval/revocation, recovery, contact-specific files, youth controls |
| Giving | Correct checkout, cancellation/error handling, confirmation, and approved acknowledgment process |
| Privacy/media | No secrets/private records; approved assets and public-only files; minimal identifying metadata |
| SEO/release | Legacy routes, canonical/language metadata, robots/sitemap, approved source/build artifact, rollback rehearsal |

Accessibility target: WCAG 2.2 AA, not a certification from unit tests. A later browser audit should combine automated tools with manual and assistive-technology testing. Performance targets from the PDD are LCP <=2.5s, INP <=200ms, and CLS <=0.1, assessed in the actual deployment; no field measurements exist for this starter.

Run `npm run check && npm test && npm run build` for each PR. Attach representative desktop/mobile EN/ES screenshots and document limitations. Do not mark a task complete solely because its URL is present or a preview rendered once.
