# CORE media: stable labels, swappable hosting

The SPA now uses **16 selected assets** from `corewecan_site_assets_labeled.zip`: the original full CORE logo, authentic archive photography, the existing program icons, the book illustration, school images, and the 2025 report cover.

**Current provider: original.** Images load from their existing `https://corewecan.org/wp-content/uploads/...` URLs. The repository tracks source, labels, placements, variants, and future GHL overrides; it does not duplicate the 100+ MB raster library or use private GitHub raw URLs as a CDN. No font binaries are imported.

## Files

- `manifest.json`: editable selected-asset records, stable IDs, page bindings, bilingual alternatives, approval status, original URLs, responsive variants, and empty `ghlUrl` fields.
- `archive/asset-labels.json.br`: lossless, checksum-verified copy of the **entire original 534-record JSON label catalog**. Metadata only, not image/font binaries. Indices in the manifest point to this catalog using zero-based positions. All original labels, filenames, URLs, roles, and referencing pages remain recoverable.
- `logos/`, `images/`, `icons/`, `documents/`: reserved for future approved local derivatives. They are not the live source for this revision.

Run `npm run media:catalog` to export the original JSON, a 534-row CSV, and a selected-asset CSV into `dist/media-catalog/`. Edit `media/manifest.json`, not generated CSVs, to change application settings. The compressed source catalog should remain immutable.

## How hosting selection works

`src/config/site.json` contains:

```json
"mediaProvider": "original"
```

For each asset:

| Field | Meaning |
|---|---|
| `id` | Stable application identifier; do not rename when moving hosts. |
| `label`, `filename` | Exact title and descriptive filename from the supplied archive. |
| `archiveIndex` | Link back to the complete immutable source record. |
| `sourceUrl`, `sourceVariants` | Original URLs and sizes. Preserve these for provenance and fallback. |
| `ghlUrl`, `ghlVariants` | Optional future GHL URL and responsive variants. Empty until uploaded and checked. |
| `alt.en`, `alt.es` | Human-readable alternatives, separate from long catalog filenames. |
| `status`, `approvalRef` | Review state and non-sensitive production approval reference. |

`original` mode always uses original URLs, even after GHL URLs have been entered. `ghl` mode prefers each asset's `ghlUrl`, with an original-URL fallback for assets not yet migrated. It never mixes an old original-host srcset into an active GHL image. A failed GHL image retries the original once; an unavailable original displays a bounded, readable fallback.

Every rendered asset has `data-media-id`, `data-media-label`, and `data-media-provider` attributes. The layout references IDs, not hard-coded image URLs. The two providers are selected centrally by `src/js/media.js`.

## Future GHL migration

1. Upload the selected original files or approved derivatives to GHL Media, retaining descriptive filenames. The originals are in the user-supplied ZIP, not in this repository.
2. Paste public HTTPS URLs into each record's `ghlUrl`. Leave `sourceUrl`, `label`, `filename`, and `id` unchanged.
3. Optional: add `ghlVariants` as `{ "url": "https://...", "width": 768 }`. Use the same image composition and aspect ratio; the main upload should match the recorded dimensions.
4. Set `mediaProvider` to `ghl`; run `npm run check && npm test && npm run build`.
5. Review the resulting embed in GHL staging. Unmigrated assets continue using their original host. Set the provider back to `original` to roll back, while that host remains available.

**Before repointing `corewecan.org` to GHL, migrate or preserve its `/wp-content/uploads/` URLs.** Original-host fallback cannot help if those originals are removed or that domain stops serving them. A Git commit does not upload media to GHL or change DNS.

## Curation and approvals

The source ZIP contains 502 decodable raster entries, 18 HTML responses masquerading as image downloads, and 14 SVG entries from plugins/fonts. The HTML responses and SVG/plugin assets are catalog-only and are not embedded. Some heuristic labels call staff portraits or backgrounds a logo; the primary logo was selected by inspecting the actual artwork, not blindly trusting the role field.

This user request authorizes development use. All 16 selected records remain `review` until CORE completes its production permission, content, and translation review. The development build can show them; production validation rejects unapproved used media. No consent forms, private participant details, API keys, or private storage URLs belong here.

The financial-literacy card retains the existing book icon. An unrelated arts photograph is not relabeled as a financial-literacy lesson; the unused `financial-literacy-photo` acquisition ID remains open. General archive galleries do not assert that each photograph represents a specific current program.
