# Labeled media enrichment - verification

Date: October 7, 2026. Related work: issue #1 (media), #2 (public SPA), and #4 (language/accessibility).

## Delivered

16 selected assets now enrich the 11-view public SPA: original full logo in header/footer, photographic homepage hero and archive gallery, three existing program icons, program-detail imagery, family/partner/involvement/about visuals, two school photographs, book illustration, and the 2025 report cover. Exact source labels and filenames are retained even when their original heuristic page/role labels were imperfect.

All 534 source catalog records are preserved losslessly in `media/archive/asset-labels.json.br`. `npm run media:catalog` exports readable JSON/CSV and a selected-asset migration list. Runtime HTML includes only the 16 selected records, not the whole catalog or any image/font binaries.

## Completed local checks

- `npm run check`: syntax, translation shape, provider settings, asset bindings, original-label preservation, URL safety, source-catalog checksum, dimensions, variant provenance, and file sizes passed.
- `npm test`: **28 tests passed**, including original/GHL selection, partial migration fallback, provider-specific srcsets, alternative-language text, preservation of 534 records, and blocking unapproved production media.
- `npm run build`: standalone noindex preview and GHL development embed generated successfully.
- Browser matrix: **66 layouts** (11 views x EN/ES x 1440/390/320 CSS-pixel widths), no horizontal overflow, all displayed images decoded, all media labels/provider attributes retained, no JavaScript page errors. Across the matrix, 27 distinct original/variant image URLs were exercised.
- Browser interactions: language switch retains view and moves heading focus; mobile menu and Escape behavior; honest pending-integration feedback; translated unknown route; simulated repeated hydration; GHL-error retry to original; bounded fallback when both an original and its variants fail.
- Desktop English and mobile Spanish screenshots were visually reviewed. Original logo proportions/endorsement, program icon associations, and actual photography were checked against the supplied files.

## Test boundaries

Browser layout tests rendered the generated HTML and fulfilled image requests with the matching user-supplied archive bytes at their original request URLs. This is an offline fixture test, not proof of live-origin availability, real-device behavior, GHL compatibility, or WCAG conformance. Browser network navigation was restricted in this environment.

The public web tool successfully returned the original logo and three original program-icon URLs. Additional photo URL checks were inconclusive due to tool accessibility/cache failures; those are not recorded as confirmed 404s. Retained photo URLs match the supplied archive, whose extraction metadata is dated October 7, 2026.

No GHL uploads, production publication, DNS changes, live form/payment tests, or native member-portal changes were performed. Original images must remain served until a future migration is complete. Production content/media approvals, routing/SEO, full accessibility testing, and issue #7's remote Actions startup problem remain separate work.
